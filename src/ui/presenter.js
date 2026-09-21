import { BUST_THRESHOLD, CANONICAL_BIDS, getLot, PLAYER_DEFINITIONS, ROUND_COUNT } from '../game/data.js';

export const signed = (value) => value === 0 ? '±0' : value > 0 ? `+${value}` : `−${Math.abs(value)}`;
export const number = (value) => String(value).replace('-', '−');
export const difficultyLabel = (difficulty) => ({ normal: 'Normal', hard: 'Hard' })[difficulty];

const auctionText = {
  normal: {
    label: '通常競り', recipientLabel: '落札者',
    rule: '最高額が獲得 / 落札者のみ支払い',
    tie: '同額最高なら、優先順が早い人が獲得。',
    paymentRule: '落札者だけが支払い、出品物の効果を受けます。',
  },
  avoidance: {
    label: '回避競り', recipientLabel: '災厄対象',
    rule: '最低額が災厄対象 / 対象者以外が各自支払い',
    tie: '同額最低なら、優先順が早い人が災厄対象。',
    paymentRule: '災厄対象は支払い0。他3人は各自の入札額を支払います。',
  },
};

// General guidance belongs to Table help; Result projects this round's facts.
const tableAuctionText = {
  normal: {
    summary: '最高額が獲得',
    details: ['最高額の人が出品物を獲得します。', '落札者だけが自分の入札額を支払います。'],
  },
  avoidance: {
    summary: '最低額が災厄対象',
    details: ['最低額の人が災厄対象になります。', '災厄対象は支払い0、他3人は各自の入札額を支払います。'],
  },
};

export function presentAuctionHelp(lotId) {
  const type = getLot(lotId).auctionType;
  return { label: auctionText[type].label, summary: tableAuctionText[type].summary,
    details: [...tableAuctionText[type].details,
      '同額の場合は、その中で優先順が最も早い人に決まります。優先1から時計回りです。'] };
}

const specialText = {
  none: '',
  patron: 'パトロン獲得：終了時、正の名声に40%加算。',
  appraisal: '浄化：目立ち度は0が下限。',
};

const portrait = (id) => new URL(`../../assets/portraits/${id}.png`, import.meta.url).href;
const lotImage = (id) => new URL(`../../assets/lots/${id}.png`, import.meta.url).href;

function presentLot(lot) {
  return {
    id: lot.id, name: lot.name, image: lotImage(lot.id), type: lot.auctionType,
    prestige: signed(lot.prestigeDelta), heat: signed(lot.heatDelta),
    special: specialText[lot.specialEffect], ...auctionText[lot.auctionType],
  };
}

// Explicit public projection. The renderer never receives state, deckOrder,
// previous-round results, RNG, or NPC decision contexts.
export function presentTable(state) {
  return {
    difficulty: difficultyLabel(state.difficulty),
    round: state.round, roundCount: ROUND_COUNT, canBid: state.phase === 'awaiting_bid',
    lot: presentLot(getLot(state.currentLotId)),
    auction: presentAuctionHelp(state.currentLotId),
    players: PLAYER_DEFINITIONS.map(({ id, name }) => {
      const player = state.players.find((entry) => entry.id === id);
      return {
        id, name, portrait: portrait(id), priority: state.priorityOrder.indexOf(id) + 1,
        funds: player.funds, prestige: player.prestige, heat: player.heat, patron: player.patron,
        heatWarning: player.heat >= BUST_THRESHOLD,
      };
    }),
  };
}

export function presentMenu(state, invalidSave = false) {
  return { kind: state ? state.status === 'finished' ? 'finished' : 'in-progress'
    : invalidSave ? 'invalid' : 'empty', difficulty: state ? difficultyLabel(state.difficulty) : null,
    round: state?.round ?? null, roundCount: ROUND_COUNT };
}

export function presentFinal(result, difficulty) {
  const status = { bust: '摘発', bankroll: '浪費脱落', none: '敗退' };
  return {
    difficulty: difficultyLabel(difficulty),
    outcomeKind: result.outcome === 'all_eliminated' ? 'all-eliminated' : 'winner',
    outcome: result.outcome === 'all_eliminated' ? '全員脱落'
      : `勝者：${result.winnerIds.map((id) => result.players.find((player) => player.id === id).name).join('・')}`,
    players: PLAYER_DEFINITIONS.map(({ id }) => {
      const player = result.players.find((entry) => entry.id === id);
      return {
        id, name: player.name, portrait: portrait(id), funds: player.funds,
        prestige: player.prestige, heat: player.heat, patron: player.patron,
        finalScore: player.finalScore, winner: player.winner,
        statusKind: player.eliminated ? player.eliminationReason : player.winner ? 'winner' : 'defeated',
        status: player.eliminated ? status[player.eliminationReason] : player.winner ? '勝者' : '敗退',
      };
    }),
  };
}

export function presentBid(legalBids) {
  return {
    options: CANONICAL_BIDS.map((amount) => ({ amount, disabled: !legalBids.includes(amount) })),
  };
}

export function presentResult(result) {
  const type = auctionText[result.auctionType];
  const recipientId = result.winnerId ?? result.victimId;
  // Identify a tied extreme in the recorded bids, never select a winner here.
  // The recipient remains exactly the Engine's stored winnerId / victimId.
  const amounts = Object.values(result.bids);
  const extremeBid = result.auctionType === 'normal' ? Math.max(...amounts) : Math.min(...amounts);
  const contenderIds = result.priorityOrder.filter(id => result.bids[id] === extremeBid);
  const tieBreak = { used: contenderIds.length > 1, extremeBid, contenderIds, recipientId };
  return {
    round: result.round, lastRound: result.round === ROUND_COUNT,
    lot: presentLot(result.lot), label: type.label, recipientLabel: type.recipientLabel, tieBreak,
    recipient: PLAYER_DEFINITIONS.find((player) => player.id === recipientId).name,
    players: PLAYER_DEFINITIONS.map(({ id, name }) => {
      const change = result.playerChanges.find((entry) => entry.playerId === id);
      return {
        id, name, priority: result.priorityOrder.indexOf(id) + 1, recipient: id === recipientId,
        bid: result.bids[id], payment: result.payments[id], patronAcquired: change.patronAcquired,
        specialNotice: result.appliedEffects.some(effect => effect.playerId === id && effect.specialEffect === 'appraisal')
          ? '浄化（目立ち度は0が下限）' : '',
        metrics: [['funds', '資金'], ['prestige', '名声'], ['heat', '目立ち度']].map(([key, label]) => ({
          key, label, before: change.before[key], after: change.after[key], delta: change.delta[key],
          tone: change.delta[key] === 0 ? 'neutral'
            : (key === 'heat' ? change.delta[key] < 0 : change.delta[key] > 0) ? 'good' : 'danger',
        })),
      };
    }),
  };
}
