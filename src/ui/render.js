import { number, signed } from './presenter.js';
import { logoImage } from './branding.js';

const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const tag = (lot) => `<span class="auction-tag ${lot.type}">${lot.label}</span>`;
const lotImage = (lot) => `<img class="lot-image" src="${escape(lot.image)}" alt="${escape(lot.name)}" width="64" height="64">`;
const priority = (value) => `<span class="priority${value === 1 ? ' priority-first' : ''}"${value === 1 ? ' aria-label="優先1：今回の起点"' : ''}>優先${value}</span>`;
export const bidConfirmLabel = (selected) => selected === null ? '金額を選んで入札確定' : `${selected}で入札確定`;

const warning = (visible) => visible ? '<p class="save-warning" role="status">進行を保存できていません。この画面を閉じると、進行が失われたり以前の状態に戻る可能性があります。</p>' : '';

export function renderMenu(model, saveWarning, audioEnabled = true) {
  const invalid = model.kind === 'invalid';
  const hasGame = ['in-progress', 'finished'].includes(model.kind);
  return `<div class="lifecycle-shell menu-screen"><header class="menu-heading">
    <h1 id="menu-title" tabindex="-1">${logoImage()}</h1></header>
    <section class="menu-content">${invalid ? '<h2>保存データを読み込めませんでした</h2>' : ''}
      ${invalid ? '<p>保存データの形式または内容を確認できません。新しく始めると保存データを置き換えます。</p>' : ''}
      ${warning(saveWarning)}<p class="operation-error" role="alert" hidden></p>
      ${hasGame ? `<p class="current-difficulty" aria-label="現在のゲーム">${model.kind === 'finished' ? '前回のゲーム終了' : '進行中'} · ${escape(model.difficulty)}${model.kind === 'in-progress' ? ` · ${model.round} / ${model.roundCount}` : ''}</p>` : ''}
      <nav class="menu-actions" aria-label="メインメニュー">
        ${hasGame ? `<button class="secondary-button resume-button" data-action="resume">${model.kind === 'finished' ? '結果を見る' : '続きから'}</button>` : ''}
        <button class="${hasGame ? 'secondary' : 'primary'}-button" data-action="new-game">${model.kind === 'empty' ? 'ゲームを始める' : '新しく始める'}</button>
        <button class="secondary-button" data-action="rules">ルール</button>
      </nav><button class="audio-toggle" data-action="audio-toggle" aria-pressed="${audioEnabled}" aria-label="効果音：${audioEnabled ? 'ON、オフにする' : 'OFF、オンにする'}">効果音：${audioEnabled ? 'ON' : 'OFF'}</button></section></div>`;
}

export function renderNewGameConfirm(difficulty, inProgress) {
  return `<section class="new-game-confirm"><h2 id="dialog-title" tabindex="-1">新しいゲーム</h2>
    ${inProgress ? '<p>進行中のゲームは終了します。</p>' : ''}
    <fieldset class="difficulty-selector" aria-label="難易度">
      <div class="difficulty-options">${[['normal', 'Normal'], ['hard', 'Hard']].map(([value, label]) => `<label class="difficulty-option"><span class="difficulty-choice"><input type="radio" name="new-game-difficulty" value="${value}" ${difficulty === value ? 'checked' : ''}><strong>${label}</strong></span></label>`).join('')}</div>
    </fieldset>
    <p class="operation-error" role="alert" hidden></p>
    <button class="secondary-button" data-action="cancel-new-game">キャンセル</button>
    <button class="primary-button" data-action="confirm-new-game">ゲームを始める</button></section>`;
}

export function renderFinal(model, saveWarning) {
  return `<div class="lifecycle-shell final-screen" tabindex="-1" aria-labelledby="ending-title"><header class="final-heading">
    <div class="final-context"><p class="eyebrow">夜明け</p><span class="difficulty-badge" aria-label="難易度：${escape(model.difficulty)}">${escape(model.difficulty)}</span></div>
    <div class="final-title-row"><h1 id="ending-title">最終結果</h1><button class="final-help-button" data-action="final-help" aria-label="勝敗判定の説明" aria-haspopup="dialog"><svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="10" cy="10" r="7.5"/><path d="M10 9v5M10 5.5v1.5"/></svg></button></div>
    <h2 class="final-outcome" data-outcome="${model.outcomeKind}">${escape(model.outcome)}</h2>
    </header><section class="final-grid" aria-label="4人の最終結果">${model.players.map((player) => `
      <article class="final-player ${player.winner ? 'is-winner' : ''}" data-final-player="${player.id}" aria-label="${escape(player.name)}の最終結果">
        <div class="final-identity"><img src="${escape(player.portrait)}" alt="${escape(player.name)}の肖像" width="96" height="96" draggable="false">
          <h3>${escape(player.name)}</h3><p class="final-status" data-status="${player.statusKind}">${player.status}</p></div>
        <dl class="final-metrics">${[['funds', '資金', number(player.funds)], ['prestige', '名声', number(player.prestige)],
          ['heat', '目立ち度', number(player.heat)], ['patron', 'パトロン', player.patron ? 'あり' : 'なし'],
          ['score', '最終得点', player.finalScore === null ? '—' : number(player.finalScore)]].map(([key, label, value]) =>
          `<div data-final-metric="${key}"><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>
      </article>`).join('')}</section>
    ${warning(saveWarning)}<p class="operation-error" role="alert" hidden></p>
    <button class="primary-button" data-action="menu">メニューへ</button></div>`;
}

// Concise guidance only; the recorded Final Result remains authoritative.
export function renderFinalHelp() {
  return `<section class="final-help"><h2 id="dialog-title">勝敗判定</h2>
    <ol class="final-judgement">
      <li data-judgement="danger"><h3>摘発</h3><p>目立ち度が8以上のプレイヤーは脱落します。</p></li>
      <li data-judgement="danger"><h3>浪費脱落</h3><p>摘発されなかったプレイヤーのうち、資金が最も少ないプレイヤーが脱落します。</p><p>最低資金が同額なら、該当者全員が脱落します。</p></li>
      <li><h3>最終得点</h3><p>残ったプレイヤーの名声をもとに最終得点を比較します。最高得点が同じなら複数の勝者になります。</p><p>パトロンがある場合は、正の名声に40%を加算します（小数点以下切り捨て）。</p></li>
    </ol><p>全員が脱落した場合は勝者なしとなります。</p>
    <button class="secondary-button" data-action="close-final-help">閉じる</button></section>`;
}

export function renderTable(model, bid, selected, saveWarning) {
  const lot = model.lot;
  return `<div class="game-shell">
    <header class="masthead">${model.canBid ? '<button class="menu-button" data-action="menu" aria-label="メニューへ戻る"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6 9 12 15 18"/></svg></button>' : ''}
      <div class="masthead-brand"><h1>${logoImage()}</h1><span class="difficulty-badge table-difficulty" aria-label="難易度：${escape(model.difficulty)}">${escape(model.difficulty)}</span></div>
      <span class="round-count"><strong>${model.round}</strong> / ${model.roundCount}</span></header>
    <section class="lot-panel ${lot.type}" aria-labelledby="current-lot-name">
      <div class="auction-context">${tag(lot)}<span class="auction-summary">${model.auction.summary}</span></div>
      ${model.canBid ? `<button class="auction-help-button" data-action="auction-help" aria-label="${lot.label}のルール" aria-haspopup="dialog"><svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="10" cy="10" r="7.5"/><path d="M10 9v5M10 5.5v1.5"/></svg></button>` : ''}
      <div class="lot-main"><div class="lot-art">${lotImage(lot)}</div><div class="lot-description">
        <h2 id="current-lot-name">${escape(lot.name)}</h2>
        <div class="lot-effects"><span>名声 <b>${lot.prestige}</b></span><span>目立ち度 <b>${lot.heat}</b></span></div>
      </div></div>${lot.special ? `<p class="lot-special">${lot.special}</p>` : ''}
    </section>
    <section class="players-section" aria-labelledby="players-heading">
      <h2 class="visually-hidden" id="players-heading">競りの参加者</h2>
      <div class="players-grid">${model.players.map((player) => `<article class="player-card ${player.id === 'human' ? 'human-card' : ''}" data-player="${player.id}" aria-label="${player.name}の状態">
        <img class="portrait" src="${escape(player.portrait)}" alt="${player.name}の肖像" width="64" height="64">
        <div class="player-heading"><h3>${player.name}</h3>${priority(player.priority)}</div>
        ${player.patron || player.heatWarning ? `<div class="player-flags">${player.patron ? '<span class="patron-badge">◆ パトロン</span>' : ''}${player.heatWarning ? '<span class="heat-warning-badge">摘発圏</span>' : ''}</div>` : ''}
        <dl class="player-metrics">${[['資金', player.funds], ['名声', player.prestige], ['目立ち度', player.heat]].map(([label, value]) => `<div${label === '目立ち度' && player.heatWarning ? ' class="heat-danger"' : ''}><dt>${label}</dt><dd>${number(value)}</dd></div>`).join('')}</dl>
      </article>`).join('')}<svg class="priority-direction" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h10m-3-2 3 2-3 2"/><path d="M21 5v10m2-3-2 3-2-3"/><path d="M19 21H9m3 2-3-2 3-2"/><path d="M3 19V9m-2 3 2-3 2 3"/></svg></div>
    </section>
    <footer class="table-actions">${warning(saveWarning)}${bid ? renderBidControls(bid, selected) : ''}</footer>
  </div>`;
}

export function renderAuctionHelp(model) {
  return `<section class="auction-help"><h2 id="dialog-title" tabindex="-1">${model.label}</h2>
    <div class="auction-help-copy">${model.details.map((text) => `<p>${escape(text)}</p>`).join('')}</div>
    <button class="secondary-button" data-action="close-auction-help">閉じる</button></section>`;
}

function renderBidControls(model, selected) {
  return `<section class="bid-controls" aria-label="入札">
    <div class="bid-options" role="group" aria-label="入札額">${model.options.map(({ amount, disabled }) => `<button class="bid-option" data-bid="${amount}" aria-label="${amount}で入札" aria-pressed="${selected === amount}" ${disabled ? 'disabled' : ''}>${amount}${disabled ? '<span>資金不足</span>' : ''}</button>`).join('')}</div>
    <p class="operation-error" role="alert" hidden></p>
    <button class="primary-button" data-action="confirm" ${selected === null ? 'disabled' : ''}>${bidConfirmLabel(selected)}</button>
  </section>`;
}

export function renderResult(model, stage, saveWarning) {
  const outcome = stage !== 'bids';
  const settled = stage === 'settled';
  const tied = outcome && model.tieBreak.used;
  return `<section class="result-content ${model.lot.type}" data-stage="${stage}">
    <header class="result-heading"><div><p class="eyebrow">${settled ? '競りの結果' : outcome ? '競りの決着' : '入札公開'}</p>
      <h2 id="dialog-title">${escape(model.lot.name)}</h2></div>${lotImage(model.lot)}</header>
    <div class="result-summary" aria-live="polite">${tag(model.lot)}
      <strong class="recipient-name">${outcome ? `${model.recipientLabel}：${model.recipient}` : '全員の入札を公開'}</strong>
      ${tied ? '<span class="tie-note">同額・優先順で決定</span>' : ''}
    </div>
    <div class="result-players" aria-label="全員の入札・状態変化">${model.players.map((player) => `<article class="result-player ${outcome && player.recipient ? 'is-recipient' : ''}" data-result-player="${player.id}" aria-label="${player.name}の競り結果">
      <div class="result-player-heading"><h3>${player.name}</h3><span class="priority${tied && player.recipient ? ' tie-decider' : ''}">優先${player.priority}</span>
        <p class="result-bid"><span>入札</span> <b data-value="bid"${tied && model.tieBreak.contenderIds.includes(player.id) ? ' class="tie-bid"' : ''}>${player.bid}</b></p>
      </div>
      <dl class="result-metrics">${player.metrics.map((metric) => `<div data-metric="${metric.key}" data-tone="${settled ? metric.tone : 'neutral'}"><dt>${metric.label}${!settled || metric.delta !== 0 ? `<span class="delta">${settled ? `(${signed(metric.delta)})` : '未公開'}</span>` : ''}</dt><dd><span class="before-after">${settled ? metric.delta === 0 ? number(metric.after) : `<span class="metric-before">${number(metric.before)}</span> <span class="metric-arrow" aria-hidden="true">→</span><span class="visually-hidden">から</span> <span class="metric-after">${number(metric.after)}</span>` : '—'}</span></dd></div>`).join('')}</dl>
      ${settled && player.patronAcquired ? '<span class="result-patron">◆ パトロン獲得</span>' : ''}
      ${settled && player.specialNotice ? `<p class="result-special">${escape(player.specialNotice)}</p>` : ''}
    </article>`).join('')}</div>
    <p class="operation-error" role="alert" hidden></p>
    ${warning(saveWarning)}<button class="primary-button next-button" data-action="next" ${settled ? '' : 'disabled'}>${settled ? model.lastRound ? '最終結果へ' : '次の出品へ' : '結果を公開中…'}<span aria-hidden="true"> →</span></button>
  </section>`;
}
