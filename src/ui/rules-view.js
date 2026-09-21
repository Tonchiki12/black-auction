// Explanatory HTML is the rule-copy authority; pictures are illustrative UI examples.
const visuals = {
  'participants': { src: new URL('../../assets/rules/participants.png', import.meta.url).href, width: 732, height: 848 },
  'player-values': { src: new URL('../../assets/rules/player-values.png', import.meta.url).href, width: 342, height: 402 },
  'bid-controls': { src: new URL('../../assets/rules/bid-controls.png', import.meta.url).href, width: 732, height: 96 },
  'priority-order': { src: new URL('../../assets/rules/priority-order.png', import.meta.url).href, width: 732, height: 544 },
  'auction-normal': { src: new URL('../../assets/rules/auction-normal.png', import.meta.url).href, width: 732, height: 198 },
  'auction-avoidance': { src: new URL('../../assets/rules/auction-avoidance.png', import.meta.url).href, width: 732, height: 198 },
  'result': { src: new URL('../../assets/rules/result.png', import.meta.url).href, width: 732, height: 972 },
  'final': { src: new URL('../../assets/rules/final.png', import.meta.url).href, width: 716, height: 1382 },
};
const patron = new URL('../../assets/lots/patron-letter.png', import.meta.url).href;
const appraisal = new URL('../../assets/lots/appraisal.png', import.meta.url).href;
function figure(name, alt, caption = '', className = '') {
  const visual = visuals[name];
  return `<figure class="rules-figure ${className}">
    <img src="${visual.src}" alt="${alt}" width="${visual.width}" height="${visual.height}" decoding="async">
    ${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;
}

// Explanatory copy only. No Game State, rule calculations or game dependencies.
// Keep the reading view separate so later presentation work can restyle it.
export function renderRules() {
  return `<div class="lifecycle-shell rules-screen">
    <header class="rules-header"><h1 id="rules-title" tabindex="-1">ルール</h1>
      <nav aria-label="ルール画面"><button class="secondary-button" data-action="back-from-rules">戻る</button></nav>
    </header>
    <section aria-labelledby="rules-purpose"><h2 id="rules-purpose">1. ゲームの目的</h2>
      <p>4人の参加者で一夜の競売に参加し、全13回の競りを行います。13種類の出品物が1回ずつ登場し、最終的な得点をもとに勝者を決めます。</p>
      ${figure('participants', 'あなた・伯爵・密売人・収集家の4人が卓を囲む画面。', '4人で同じ出品物を競います。')}
      <p>名声を集めても、目立ちすぎれば<span class="rules-danger">「摘発」</span>されます。摘発を免れても、資金を使いすぎると<span class="rules-danger">「浪費脱落」</span>します。</p>
      <p>危険を抑え、資金を残しながら名声を伸ばしましょう。</p>
    </section>
    <section aria-labelledby="rules-values"><h2 id="rules-values">2. 3つの値</h2>
      ${figure('player-values', 'あなたのカードの例。資金20、名声7、目立ち度3。', '', 'rules-closeup')}
      <dl class="rules-values">
        <div><dt>資金</dt><dd>入札に使います。全員100からスタートします。ゲーム終了時にこれが<strong>摘発されなかった他の参加者と比べて最も少ない</strong>と<span class="rules-danger">浪費脱落</span>します。</dd></div>
        <div><dt>名声</dt><dd>勝敗の中心となる値です。0からスタートし、出品物の効果によって増減します。負の値になることもあります。</dd></div>
        <div><dt>目立ち度</dt><dd>摘発の危険度です。0からスタートします。<strong>ゲーム終了時に8以上だと</strong><span class="rules-danger">摘発</span>されます。</dd>
          <dd>途中で8以上になっても、その場では脱落しません。その後8未満まで下がれば、ゲーム終了時の摘発を免れます。</dd></div>
      </dl>
    </section>
    <section aria-labelledby="rules-bids"><h2 id="rules-bids">3. 入札と優先順</h2>
      <p>全員が秘密裏に金額を選ぶ「秘密同時入札」です。全員の入札が決まったあと、一斉に公開されます。</p>
      <h3>入札候補</h3>
      ${figure('bid-controls', '0、5、10、15、20、25、30の入札候補。資金20の例では25と30が資金不足で選べません。', '入札候補は0 / 5 / 10 / 15 / 20 / 25 / 30。')}
      <p>所持資金を超える額は選べません。0は常に選択できます。</p>
      <h3>同額時の優先順</h3>
      ${figure('priority-order', '左上のあなたが優先1、右上の伯爵が優先2、右下の収集家が優先3、左下の密売人が優先4。中央の矢印は時計回り。', '優先1 → 2 → 3 → 4。時計回りに確認します。')}
      <p>同額で並んだ場合は、「優先1」から時計回りに見て、該当者の中で最初の人が対象となります。</p>
      <h3>優先1の移動</h3>
      <p>最初の「優先1」はランダムで決まります。その後は競りが1回終わるごとに、時計回りへ1席ずつ移動します。</p>
    </section>
    <section aria-labelledby="rules-auctions"><h2 id="rules-auctions">4. 2種類の競り</h2>
      <div class="rules-comparison"><article><h3>通常競り</h3>
      ${figure('auction-normal', '通常競りの古代銀貨。最高額が獲得。', '最高額 → 出品物。落札者だけが支払う。')}
      <p><strong>最高額を入札した人が出品物を獲得</strong>します。同額最高の場合は優先順で決定します。</p>
      <p>支払うのは落札者だけです。落札者が自分の入札額を支払い、他の3人は支払いません。</p>
      </article><article><h3>回避競り</h3>
      ${figure('auction-avoidance', '回避競りの偽物の名画。最低額が災厄を受ける。', '最低額 → 災厄。対象者は支払わない。')}
      <p><strong>最低額を入札した人が「災厄」を受けます</strong>。同額最低の場合は優先順で決定します。</p>
      <p>災厄を受ける人は入札額を支払いません。災厄を回避した他の3人が、それぞれ自分の入札額を支払います。0を入札していた場合、支払いも0です。</p>
      <p>あえて低く入札して災厄を受け入れ、資金を残すことも有効な戦略です。</p>
      </article></div>
      <h3>競りの結果</h3>
      ${figure('result', '古代銀貨の競り結果。4人の入札と対象者、資金・名声・目立ち度の変化、次の出品へ進むボタン。')}
      <p>右側に全員の入札額、枠で対象者を表示。数値の変化を確認し、「次の出品へ」で進みます。</p>
    </section>
    <section aria-labelledby="rules-special"><h2 id="rules-special">5. 特殊な出品物</h2>
      <div class="rules-special-grid"><article><img src="${patron}" alt="" width="64" height="64"><h3>パトロンの紹介状</h3>
      <p>獲得すると目立ち度が+1され、パトロンを得ます。即時の名声は増えません。</p>
      <p>ゲーム終了時、パトロンを持っているプレイヤーには名声に応じた得点ボーナスがあります。</p>
      </article><article><img src="${appraisal}" alt="" width="64" height="64"><h3>鑑定書</h3>
      <p>獲得すると名声+3、目立ち度−2。</p>
      <p>目立ち度は0未満にはなりません。</p></article></div>
    </section>
    <section aria-labelledby="rules-ending"><h2 id="rules-ending">6. ゲーム終了と勝敗判定</h2>
      <p>13回の競りが終わると、次の順番で勝敗を判定します。</p>
      ${figure('final', '最終結果の例。あなたが勝者、密売人が摘発、収集家が浪費脱落。各参加者の最終状態と最終得点を表示。')}
      <ol class="rules-judgement">
        <li data-judgement="danger"><h3>摘発</h3><p>目立ち度が8以上のプレイヤーは摘発され、脱落します。</p></li>
        <li data-judgement="danger"><h3>浪費脱落</h3><p>摘発されなかったプレイヤーのうち、資金が最も少ないプレイヤーが脱落します。</p>
          <p>最低資金が同額の場合は、該当する全員が脱落します。</p>
          <p>摘発を免れたプレイヤーが1人しかいない場合も、その人が最低資金者となるため脱落します。</p></li>
        <li><h3>最終得点</h3><p>残ったプレイヤーの名声をもとに、最終得点を計算します。</p>
          <p>パトロンを持っている場合は、正の基礎名声の40%を加算します。小数点以下は切り捨てます。基礎名声が0以下の場合、パトロンによる加算はありません。</p>
          <p>最終得点が最も高いプレイヤーが勝者です。同点の場合は複数のプレイヤーが勝者になります。</p>
          <p>全員が脱落した場合は「全員脱落」となり、勝者はいません。</p></li>
      </ol>
    </section>
  </div>`;
}
