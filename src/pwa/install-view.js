import { INSTALL_GUIDES, offlinePresentation } from './install-guidance.js';

const INVITATION_IMAGE = new URL('../../assets/invitation/invitation-art.png', import.meta.url).href;
const INSTALL_LOGO = new URL('../../assets/branding/black-auction-logo.svg', import.meta.url).href;

// Project-native geometry, drawn for this guide; no vendor/reference paths or assets.
const PICTOGRAMS = {
  share: '<path d="M7 13v14h18V13M16 21V5m-5 5 5-5 5 5"/>',
  expand: '<rect x="5" y="5" width="22" height="22" rx="3"/><path d="M10 11h12M10 16h12m-9 5 3 3 3-3"/>',
  'add-home': '<rect x="5" y="5" width="22" height="22" rx="4"/><path d="M16 10v12M10 16h12"/>',
  launch: '<rect x="7" y="4" width="18" height="25" rx="3"/><path d="m12 22 9-11m-7 0h7v7"/>',
  menu: '<circle cx="16" cy="7" r="1.6"/><circle cx="16" cy="16" r="1.6"/><circle cx="16" cy="25" r="1.6"/>',
};
function pictogram(name) {
  return `<svg class="install-pictogram" data-pictogram="${name}" aria-hidden="true" focusable="false" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${PICTOGRAMS[name]}</svg>`;
}

// View only: no Engine, controller, save access, RNG or gate mutation.
export function mountInstallView(root, { offlineSupport } = {}) {
  root.innerHTML = `<main class="install-invitation" aria-label="Black Auctionへの招待">
    <h1 class="install-title"><img src="${INSTALL_LOGO}" alt="Black Auction" width="160" height="48"></h1>
    <img class="install-art" src="${INVITATION_IMAGE}" width="160" height="280" alt="青い衣装の収集家と、膝に抱かれた黒猫" draggable="false">
    <div class="install-action"><button type="button" class="install-open">ホーム画面追加方法を詳しく見る</button></div>
  </main>
  <dialog class="install-guide" aria-labelledby="install-guide-title">
    <header class="install-guide-header"><h2 id="install-guide-title">ホーム画面に追加</h2><button type="button" class="install-close" aria-label="ホーム画面追加の案内を閉じる">閉じる</button></header>
    <div class="install-guide-body" tabindex="0" aria-label="ホーム画面への追加手順">
      <p class="install-intro">ホーム画面のアイコンから、Black Auctionを始められます。</p>
      <label class="install-device">使っているブラウザ<select aria-label="使っているブラウザ">${Object.entries(INSTALL_GUIDES).map(([id, guide]) => `<option value="${id}">${guide.label}</option>`).join('')}</select></label>
      <section class="install-instructions" aria-labelledby="install-browser"></section>
      <p class="install-online-note">追加するときと、追加後の初回起動は、通信できる状態で行ってください。</p>
      <section class="install-preparation" aria-label="オフラインの準備"><p class="install-status" role="status" aria-live="polite"></p><p class="install-status-detail"></p></section>
      <section class="install-faq" aria-labelledby="install-faq-title"><h3 id="install-faq-title">うまくいかないとき</h3>
        <details><summary>「ホーム画面に追加」が見つからない</summary><p class="install-missing-action"></p></details>
        <details><summary>追加したアイコンがSafariで開く</summary><p>追加時に「Web アプリとして開く」がオフだと、ブラウザで開くショートカットになります。次に追加する際はオンを選んでください。</p></details>
        <details><summary>オフライン準備が終わらない</summary><p>通信を確認し、オンラインで開き直してください。追加後のアプリでも、一度オンラインで起動して準備する必要があります。</p></details>
      </section>
    </div>
  </dialog>`;
  const invitation = root.querySelector('.install-invitation');
  const dialog = root.querySelector('.install-guide');
  const openButton = root.querySelector('.install-open');
  const closeButton = root.querySelector('.install-close');
  const body = root.querySelector('.install-guide-body');
  const select = root.querySelector('select');
  function showGuide() {
    const guide = INSTALL_GUIDES[select.value] ?? INSTALL_GUIDES.iphone;
    root.querySelector('.install-instructions').innerHTML = `<h3 id="install-browser">${guide.label}</h3><ol class="install-steps" role="list">${guide.steps.map((step, index) => `<li class="install-step"><span class="install-step-visual" aria-hidden="true"><span class="install-step-number">${index + 1}</span>${pictogram(step.icon)}</span><div class="install-step-copy"><p class="install-step-title">${step.title}</p>${step.note ? `<p class="install-step-note">${step.note}</p>` : ''}</div></li>`).join('')}</ol><p class="install-guide-note">${guide.note}</p>`;
    root.querySelector('.install-missing-action').textContent = guide.missingAction;
  }
  showGuide(); select.addEventListener('change', showGuide);
  const renderStatus = snapshot => {
    const state = offlinePresentation(snapshot);
    const status = root.querySelector('.install-status');
    status.dataset.tone = state.tone; status.textContent = state.title;
    root.querySelector('.install-status-detail').textContent = state.detail;
  };
  renderStatus();
  const unsubscribe = offlineSupport?.subscribe(renderStatus);
  const open = () => {
    if (dialog.open) return;
    dialog.showModal(); invitation.inert = true;
    body.scrollTop = 0; closeButton.focus({ preventScroll: true });
    void offlineSupport?.refresh();
  };
  openButton.addEventListener('click', open);
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    invitation.inert = false;
    openButton.focus({ preventScroll: true });
  });
  // Native modal supplies inertness/Escape; explicit Tab wrap also avoids the
  // browser chrome becoming a tab stop at the end of a keyboard cycle.
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const stops = [...dialog.querySelectorAll('button, select, summary, [tabindex="0"]')].filter(el => el.getClientRects().length);
    const first = stops[0], last = stops.at(-1), active = root.ownerDocument.activeElement;
    if (event.shiftKey && active === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus(); }
  });
  return { destroy() { unsubscribe?.(); if (dialog.open) dialog.close(); root.replaceChildren(); } };
}
