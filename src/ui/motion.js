// Decorative lifecycle only. No Game State, commands, RNG or persistence.
const pressTargets = '#game-table .menu-actions button, #game-table .audio-toggle, #game-table .game-shell :is(.primary-button,.menu-button,.bid-option,.auction-help-button), #game-table .final-screen :is(.primary-button,.final-help-button), #game-table .rules-screen [data-action="back-from-rules"], .game-dialog :is(.primary-button,.secondary-button)';

export function createMotion(root) {
  // Human product policy (D-040): Game motion is independent of OS preference.
  const events = new AbortController();
  const listen = (node, name, fn) => node.addEventListener(name, fn, { signal: events.signal });
  let consumedEntry, menu, cover, pressed;

  function cancelMenu() {
    if (!menu) return;
    const old = menu; menu = null;
    clearTimeout(old.timer);
    old.events.abort();
    old.node.classList.remove('menu-enter');
  }
  function cancelCover() {
    if (!cover) return;
    const old = cover; cover = null;
    clearTimeout(old.timer);
    old.events.abort();
    old.frame.remove();
  }
  function clearPress() { pressed?.classList.remove('is-pressed'); pressed = null; }
  function reset() { cancelMenu(); cancelCover(); clearPress(); }

  function enterMenu(node, entry) {
    // Entry is owned by the controller, not inferred from DOM replacement.
    if (entry === consumedEntry) return;
    consumedEntry = entry;
    reset();
    if (document.hidden) return;
    const record = { node, entry, events: new AbortController() };
    menu = record;
    const finish = event => {
      if (menu === record && event.animationName === 'menu-logo-enter'
        && event.target === node.querySelector('.menu-heading')) cancelMenu();
    };
    for (const name of ['animationend', 'animationcancel']) node.addEventListener(name, finish, { signal: record.events.signal });
    record.timer = setTimeout(() => { if (menu === record) cancelMenu(); }, 750);
    node.classList.add('menu-enter');
  }

  function showCover(menuNode) {
    cancelCover();
    if (document.hidden || !menuNode) return;
    const frame = document.createElement('div');
    frame.className = 'new-game-cover-frame';
    frame.inert = true;
    frame.setAttribute('aria-hidden', 'true');
    const node = document.createElement('div');
    node.className = 'new-game-cover';
    node.inert = true;
    node.setAttribute('aria-hidden', 'true');
    // Move the actual, already detached Menu. Never clone controls or state.
    node.append(menuNode);
    frame.append(node);
    root.append(frame);
    const record = { frame, node, events: new AbortController() };
    cover = record;
    const finish = event => {
      if (cover === record && event.target === node && event.animationName === 'new-game-cover-turn') cancelCover();
    };
    for (const name of ['animationend', 'animationcancel']) node.addEventListener(name, finish, { signal: record.events.signal });
    record.timer = setTimeout(() => { if (cover === record) cancelCover(); }, 1000);
  }

  function press(target) {
    const button = target.closest('button');
    if (!button?.matches(pressTargets) || button.disabled || button.closest('[inert]')) return;
    cancelCover();
    clearPress(); pressed = button; button.classList.add('is-pressed');
  }
  listen(root, 'pointerdown', event => {
    if (event.button === 0 && event.isPrimary) press(event.target);
  });
  // Release outside the original button/root must also clear decoration.
  listen(window, 'pointerup', clearPress);
  listen(window, 'pointercancel', clearPress);
  listen(root, 'keydown', event => {
    if ([' ', 'Enter'].includes(event.key) && !event.repeat) press(event.target);
  });
  listen(root, 'keyup', event => { if ([' ', 'Enter'].includes(event.key)) clearPress(); });
  // pointerdown precedes native focus: the previous control losing focus must
  // not clear the newly pressed control's decoration.
  listen(root, 'focusout', event => { if (event.target === pressed) clearPress(); });
  listen(window, 'blur', clearPress);
  listen(window, 'pagehide', reset);
  listen(document, 'visibilitychange', () => { if (document.hidden) reset(); });
  // A disabled/removed control must not retain a press decoration.
  const observer = new MutationObserver(() => {
    if (pressed && (pressed.disabled || !root.contains(pressed))) clearPress();
  });
  observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['disabled'] });
  return { enterMenu, showCover, cancelMenu, cancelCover, clearPress, reset,
    dispose() { reset(); events.abort(); observer.disconnect(); } };
}
