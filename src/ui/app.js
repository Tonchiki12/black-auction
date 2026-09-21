import { createGameStorage } from '../storage/game-storage.js';
import { presentAuctionHelp, presentBid, presentFinal, presentMenu, presentResult, presentTable } from './presenter.js';
import { bidConfirmLabel, renderAuctionHelp, renderFinal, renderFinalHelp, renderMenu, renderNewGameConfirm, renderResult, renderTable } from './render.js';
import { renderRules } from './rules-view.js';
import { createMotion } from './motion.js';
import { createAudio } from './audio.js';

/** The controller alone retains authoritative State. The public renderer gets
 * projections only. initialState/engine injection is for the test-only harness. */
export function mountGame(root, { engine, initialState, storage = createGameStorage(), audio = createAudio() }) {
  const loaded = initialState ? { kind: 'loaded', state: initialState } : storage.load();
  let state = loaded.kind === 'loaded' ? loaded.state : null;
  let saveWarning = loaded.kind === 'unavailable';
  const ui = { view: 'menu', selected: null, stage: null, busy: false, nextPointer: null,
    nextDifficulty: state?.difficulty ?? 'normal' };
  let rulesReturn = null;
  const timers = new Set();
  const events = new AbortController();
  const listen = (element, event, handler) => element.addEventListener(event, handler, { signal: events.signal });
  root.innerHTML = '<main id="game-table"></main><dialog class="game-dialog" tabindex="-1" aria-labelledby="dialog-title"></dialog>';
  const table = root.querySelector('main');
  const dialog = root.querySelector('dialog');
  const motion = createMotion(root);
  let menuEntry = 0;
  let resultCuePending = false;
  // Even an injected/faulty audio implementation cannot interrupt Game work.
  function audioCall(method, ...args) {
    try { const value = audio[method](...args); value?.catch?.(() => {}); return value; }
    catch { return undefined; }
  }
  let audioEnabled = audioCall('getEnabled') !== false;
  function cue(name, level) { if (!document.hidden) audioCall('playCue', name, level); }
  function unlock(event) {
    const button = event.target.closest('button');
    if (button && !button.disabled && !button.closest('[inert]') && root.contains(button)) audioCall('unlock');
  }
  listen(root, 'pointerdown', event => { if (event.isPrimary && event.button === 0) unlock(event); });
  listen(root, 'keydown', event => { if (['Enter', ' ', 'Escape'].includes(event.key) && !event.repeat) unlock(event); });
  listen(document, 'visibilitychange', () => { if (document.hidden) resultCuePending = false; });
  listen(window, 'pagehide', () => { resultCuePending = false; });

  function later(callback, delay) {
    const timer = setTimeout(() => { timers.delete(timer); callback(); }, delay);
    timers.add(timer);
  }

  function showGame() {
    if (state.phase === 'finished') {
      ui.view = 'final';
      table.innerHTML = renderFinal(presentFinal(state.finalResult, state.difficulty), saveWarning);
      return;
    }
    ui.view = 'table';
    const bid = state.phase === 'awaiting_bid' ? presentBid(engine.getLegalBids(state, 'human')) : null;
    table.innerHTML = renderTable(presentTable(state), bid, ui.selected, saveWarning);
    if (state.phase === 'resolved') {
      ui.view = 'result';
      table.inert = true;
      showResult('settled');
    }
  }

  // Menu navigation is presentation only: retain State and selected bid, and
  // never call an Engine command, consume RNG, or write persistence here.
  function showMenu(focus = true) {
    motion.reset();
    ui.view = 'menu';
    table.innerHTML = renderMenu(presentMenu(state, loaded.kind === 'invalid'), saveWarning, audioEnabled);
    motion.enterMenu(table.firstElementChild, ++menuEntry);
    if (focus) {
      window.scrollTo(0, 0);
      table.querySelector('#menu-title').focus({ preventScroll: true });
    }
  }

  // The view is already correct. CSS only fades its new content; there are no
  // animation callbacks, delayed commands, input locks or deferred save writes.
  function enterScreen() { table.firstElementChild.classList.add('screen-enter'); }

  function openMenu() {
    if (ui.busy || !(ui.view === 'final' || (ui.view === 'table' && state?.phase === 'awaiting_bid'))) return;
    showMenu();
    cue('tap');
  }

  function openRules() {
    if (ui.view !== 'menu' || ui.busy) return;
    motion.reset();
    // Retain the actual menu, including native controls and temporary messages.
    // This snapshot belongs only to presentation and is never passed to save.
    rulesReturn = { menu: table.firstElementChild, scrollY: window.scrollY };
    ui.view = 'rules';
    table.innerHTML = renderRules();
    window.scrollTo(0, 0);
    table.querySelector('#rules-title').focus({ preventScroll: true });
    cue('tap');
  }

  function closeRules() {
    if (ui.view !== 'rules' || ui.busy) return;
    ui.view = 'menu';
    table.replaceChildren(rulesReturn.menu);
    window.scrollTo(0, rulesReturn.scrollY);
    table.querySelector('[data-action="rules"]').focus({ preventScroll: true });
    rulesReturn = null;
    cue('tap');
  }

  function resumeGame() {
    if (ui.view !== 'menu' || ui.busy || !state) return;
    motion.reset();
    showGame();
    enterScreen();
    window.scrollTo(0, 0);
    if (ui.view !== 'result') focusTable(); // showResult already focused the modal.
    cue('tap');
  }

  // Called only after a successful Engine command has replaced State. Storage
  // failure cannot roll back or re-run the command, including NPC decisions.
  function save() { saveWarning = !storage.save(state).ok; }

  function resetUi() {
    motion.reset();
    timers.forEach(clearTimeout);
    resultCuePending = false;
    timers.clear();
    Object.assign(ui, { view: 'table', selected: null, stage: null, busy: false, nextPointer: null });
    table.inert = false;
    dialog.close();
    dialog.replaceChildren();
  }

  function focusTable() {
    table.querySelector(state.phase === 'finished' ? '.final-screen' : `[data-bid="${ui.selected ?? 0}"]`)
      .focus({ preventScroll: true });
  }

  function startGame() {
    if (ui.busy) return;
    ui.busy = true;
    try { state = engine.createGame({ difficulty: ui.nextDifficulty }); }
    catch {
      ui.busy = false;
      showError('ゲームを開始できませんでした。もう一度お試しください。');
      return;
    }
    save();
    const menuCover = table.firstElementChild;
    resetUi();
    showGame();
    motion.showCover(menuCover);
    cue('page');
    window.scrollTo(0, 0);
    focusTable();
  }

  function requestNewGame() {
    if (ui.view !== 'menu' || ui.busy) return;
    motion.reset();
    ui.view = 'new-game-confirm';
    table.inert = true;
    dialog.innerHTML = renderNewGameConfirm(ui.nextDifficulty, state?.status === 'in_progress');
    dialog.showModal();
    dialog.querySelector('[data-action="cancel-new-game"]').focus();
    cue('tap');
  }

  function cancelNewGame() {
    if (ui.view !== 'new-game-confirm' || ui.busy) return;
    ui.view = 'menu';
    table.inert = false;
    dialog.close();
    dialog.replaceChildren();
    table.querySelector('[data-action="new-game"]').focus({ preventScroll: true });
    cue('tap');
  }

  function openAuctionHelp() {
    if (ui.view !== 'table' || ui.busy || state?.phase !== 'awaiting_bid') return;
    // Retain the table DOM and selection; no Engine, persistence or reveal work.
    ui.view = 'auction-help';
    table.inert = true;
    dialog.innerHTML = renderAuctionHelp(presentAuctionHelp(state.currentLotId));
    dialog.showModal();
    dialog.querySelector('[data-action="close-auction-help"]').focus({ preventScroll: true });
    cue('tap');
  }

  function closeAuctionHelp() {
    if (ui.view !== 'auction-help') return;
    ui.view = 'table';
    table.inert = false;
    dialog.close();
    dialog.replaceChildren();
    table.querySelector('[data-action="auction-help"]').focus({ preventScroll: true });
    cue('tap');
  }

  function showError(message) {
    const error = (dialog.open ? dialog : table).querySelector('.operation-error');
    error.hidden = false;
    error.textContent = message;
  }

  function openFinalHelp() {
    if (ui.view !== 'final' || ui.busy || state?.phase !== 'finished') return;
    // Keep the existing Final DOM and scroll; this is presentation only.
    ui.view = 'final-help';
    table.inert = true;
    dialog.innerHTML = renderFinalHelp();
    dialog.showModal();
    dialog.querySelector('[data-action="close-final-help"]').focus({ preventScroll: true });
    cue('tap');
  }

  function closeFinalHelp() {
    if (ui.view !== 'final-help') return;
    ui.view = 'final';
    table.inert = false;
    dialog.close();
    dialog.replaceChildren();
    table.querySelector('[data-action="final-help"]').focus({ preventScroll: true });
    cue('tap');
  }

  function showResult(stage) {
    ui.stage = stage;
    ui.nextPointer = null;
    dialog.innerHTML = renderResult(presentResult(state.latestRoundResult), stage, saveWarning);
    if (!dialog.open) {
      // Focus the stable modal once. Replacing reveal content must not refocus
      // the Lot heading or steal focus at each presentation stage.
      dialog.autofocus = true;
      dialog.showModal();
      dialog.autofocus = false;
      dialog.focus({ preventScroll: true });
    }
  }

  function confirmBid() {
    if (ui.view !== 'table' || ui.busy || state?.phase !== 'awaiting_bid' || ui.selected === null) return;
    ui.busy = true; // Lock before entering the synchronous engine command.
    table.querySelector('[data-action="confirm"]').disabled = true;
    try {
      state = engine.submitBid(state, { playerId: 'human', amount: ui.selected });
    } catch {
      ui.busy = false;
      table.querySelector('[data-action="confirm"]').disabled = false;
      showError('入札を確定できませんでした。金額を確認して、もう一度お試しください。');
      return;
    }
    save(); // Persist resolved BEFORE any reveal timer or result rendering.
    cue('confirm');
    // State is already resolved. Timers only expose its recorded result;
    // none of them may call advanceRound or invoke the NPC policy.
    ui.view = 'result';
    ui.busy = false;
    table.inert = true;
    showResult('bids');
    resultCuePending = !document.hidden;
    // Restore fast presentation cadence for every OS preference (D-041).
    later(() => {
      showResult('outcome');
      later(() => {
        showResult('settled');
        if (resultCuePending) cue('settle');
        resultCuePending = false;
      }, 160);
    }, 160);
  }

  function advance(event) {
    if (ui.view !== 'result' || ui.stage !== 'settled' || ui.busy || state.phase !== 'resolved') return;
    // A pointer click must start on the newly enabled next button. A pointer
    // held through reveal, a click on the old confirm, or a second click cannot advance.
    // detail=0 preserves keyboard and assistive-technology activation.
    // Safari may deliver click as MouseEvent (without pointerId). Remember the
    // actual enabled button pressed, rather than comparing browser-specific IDs.
    if (event.detail !== 0 && ui.nextPointer !== event.target.closest('[data-action="next"]')) return;
    ui.nextPointer = null;
    ui.busy = true;
    try {
      state = engine.advanceRound(state);
    } catch {
      ui.busy = false;
      showError('次の出品へ進めませんでした。もう一度お試しください。');
      return;
    }
    save();
    resetUi();
    showGame();
    focusTable();
    cue(state.phase === 'finished' ? 'final' : 'advance');
  }

  // Only the next new game's preference changes here. Current State, saved
  // difficulty and the injected RNG remain untouched until creation succeeds.
  listen(root, 'change', (event) => {
    if (ui.view !== 'new-game-confirm' || ui.busy || !event.target.matches('input[name="new-game-difficulty"]')) return;
    const value = event.target.value;
    if (!event.target.checked || !['normal', 'hard'].includes(value) || value === ui.nextDifficulty) return;
    ui.nextDifficulty = value;
    audioCall('unlock');
    cue('tap');
  });

  listen(root, 'click', (event) => {
    const button = event.target.closest('button');
    if (!button || button.disabled || !root.contains(button) || button.closest('.new-game-cover-frame')) return;
    // Click also covers assistive activation and the OFF→ON gesture.
    unlock(event);
    motion.cancelCover();
    if (button.hasAttribute('data-bid')) {
      if (ui.view !== 'table' || ui.busy || state?.phase !== 'awaiting_bid') return;
      const amount = Number(button.dataset.bid);
      if (!engine.getLegalBids(state, 'human').includes(amount)) return;
      if (ui.selected === amount) return;
      ui.selected = amount;
      table.querySelectorAll('[data-bid]').forEach((option) => option.setAttribute('aria-pressed', String(option === button)));
      const confirm = table.querySelector('[data-action="confirm"]');
      confirm.textContent = bidConfirmLabel(amount);
      confirm.disabled = false;
      cue('tap');
      return;
    }
    switch (button.dataset.action) {
      case 'audio-toggle':
        if (ui.view !== 'menu' || ui.busy) break;
        audioEnabled = !audioEnabled;
        audioCall('setEnabled', audioEnabled);
        button.textContent = `効果音：${audioEnabled ? 'ON' : 'OFF'}`;
        button.setAttribute('aria-pressed', String(audioEnabled));
        button.setAttribute('aria-label', `効果音：${audioEnabled ? 'ON、オフにする' : 'OFF、オンにする'}`);
        if (audioEnabled) { audioCall('unlock'); cue('tap'); }
        break;
      case 'confirm': confirmBid(); break;
      case 'auction-help': openAuctionHelp(); break;
      case 'close-auction-help': closeAuctionHelp(); break;
      case 'final-help': openFinalHelp(); break;
      case 'close-final-help': closeFinalHelp(); break;
      case 'next': advance(event); break;
      case 'menu': openMenu(); break;
      case 'rules': openRules(); break;
      case 'back-from-rules': closeRules(); break;
      case 'resume': resumeGame(); break;
      case 'new-game': requestNewGame(); break;
      case 'cancel-new-game': cancelNewGame(); break;
      case 'confirm-new-game': if (ui.view === 'new-game-confirm') startGame(); break;
      default: break;
    }
  });
  listen(dialog, 'pointerdown', (event) => {
    const button = event.target.closest('[data-action="next"]');
    ui.nextPointer = ui.view === 'result' && ui.stage === 'settled' && button && !button.disabled
      ? button : null;
  });
  listen(dialog, 'pointercancel', () => { ui.nextPointer = null; });
  listen(dialog, 'cancel', (event) => {
    event.preventDefault();
    if (ui.view === 'new-game-confirm') cancelNewGame();
    if (ui.view === 'auction-help') closeAuctionHelp();
    if (ui.view === 'final-help') closeFinalHelp();
  });
  listen(root, 'keydown', (event) => {
    if (event.repeat && ['Enter', ' '].includes(event.key)) event.preventDefault();
  });
  listen(dialog, 'keydown', (event) => {
    if (event.key !== 'Tab') return;
    // Native radio groups have one Tab stop (the checked option). Arrow keys
    // still visit both choices. Include it in the same trap as the buttons.
    const controls = [...dialog.querySelectorAll('button:not(:disabled), input[type="radio"]:checked:not(:disabled)')];
    const first = controls[0];
    const last = controls.at(-1);
    if (!first) { event.preventDefault(); dialog.focus({ preventScroll: true }); return; }
    if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement))) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  });

  // Automatic persistence load is independent of visual resume. Every new
  // runtime session starts at Menu; background/foreground never changes view.
  showMenu(false);
  return { dispose() {
    motion.dispose();
    audioCall('dispose');
    timers.forEach(clearTimeout);
    rulesReturn = null;
    events.abort();
    dialog.close();
    root.replaceChildren();
  } };
}
