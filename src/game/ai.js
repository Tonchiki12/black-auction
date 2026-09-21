import { BUST_THRESHOLD, CANONICAL_BIDS, INITIAL_FUNDS, ROUND_COUNT } from './data.js';
import { drawRandom } from './rng.js';
import { getPlayer, requireCondition } from './validation.js';

// Decision preferences only. Auctions, payments, effects and final results
// remain exclusively authoritative in the Engine's rule module.
const PERSONALITIES = Object.freeze({
  count: { prestige: 2.15, heat: 0.9, patron: 15, appraisal: 1, clean: 0.5, avoidance: 1.0 },
  collector: { prestige: 1.65, heat: 1.3, patron: 10, appraisal: 8, clean: 3, avoidance: 1.2 },
  smuggler: { prestige: 1.6, heat: 1.5, patron: 9, appraisal: 3, clean: 1, avoidance: 1.65 },
});
const BALANCED = { prestige: 1.8, heat: 1.2, patron: 11, appraisal: 3, clean: 1, avoidance: 1.2 };
// Shared evaluator; Normal has coarser public estimates and a broader softmax
// (temperature). Hard weighs relative reserves more precisely, but still samples.
const DIFFICULTY = {
  normal: { precision: 0.45, temperature: 9, money: 0.50, reserve: 0.35, forecastSpread: 7 },
  hard: { precision: 1, temperature: 3, money: 0.62, reserve: 1.0, forecastSpread: 5 },
};
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

function heatBurden(heat, urgency) {
  // Increasing exposure is expensive; crossing the known final threshold is
  // especially costly late. No assumption about any future appraisal card.
  return heat * 0.7 + Math.max(0, heat - 4) ** 2 * 0.5
    + (heat >= BUST_THRESHOLD ? 13 + urgency * 22 : 0);
}

function lotValue(player, opponents, lot, context, profile, personality) {
  const urgency = (context.round - 1) / (ROUND_COUNT - 1);
  const rivals = opponents.filter(p => p.heat < BUST_THRESHOLD);
  const rivalPrestige = Math.max(...(rivals.length ? rivals : opponents).map(p => p.prestige));
  const rawGap = rivalPrestige - player.prestige;
  const gap = context.difficulty === 'normal' ? Math.round(rawGap / 10) * 10 : rawGap;
  const pressure = 1 + clamp(gap / 20, -0.6, 1) * urgency * profile.precision;
  const exposure = heatBurden(Math.max(0, player.heat + lot.heatDelta), urgency) - heatBurden(player.heat, urgency);
  let value = lot.prestigeDelta * personality.prestige * pressure * (player.patron && player.prestige > 0 ? 1.25 : 1)
    - exposure * personality.heat;
  if (lot.auctionType === 'avoidance') return Math.max(0, -value) * personality.avoidance;
  if (lot.heatDelta === 0) value += personality.clean;
  if (lot.specialEffect === 'patron' && !player.patron) value += personality.patron + Math.max(0, player.prestige) * 0.35;
  if (lot.specialEffect === 'appraisal') value += personality.appraisal;
  // Opportunity to improve a trailing position matters more with few auctions
  // left, while a large lead allows funds to be retained.
  return value;
}

function moneyCost(player, opponents, bid, context, profile) {
  const urgency = (context.round - 1) / (ROUND_COUNT - 1);
  const reservePerRound = context.remainingRounds / (player.funds + 15);
  const relevant = opponents.filter(p => p.heat < BUST_THRESHOLD);
  const minimum = Math.min(...(relevant.length ? relevant : opponents).map(p => p.funds));
  const minimumEstimate = context.difficulty === 'normal' ? Math.floor(minimum / 15) * 15 : minimum;
  const before = Math.max(0, minimumEstimate + 5 - player.funds);
  const after = Math.max(0, minimumEstimate + 5 - (player.funds - bid));
  return bid * (profile.money + reservePerRound * 2.2)
    + (after - before) * profile.reserve * (0.2 + urgency * 1.2);
}

function opponentDistribution(player, context, profile) {
  const opponents = context.players.filter(p => p.id !== player.id);
  const personality = PERSONALITIES[player.characterId] ?? BALANCED;
  const value = lotValue(player, opponents, context.currentLot, context, profile, personality);
  const money = moneyCost(player, opponents, 5, context, profile) / 5;
  const budget = clamp(player.funds / INITIAL_FUNDS + 1 / (context.remainingRounds + 3), 0.1, 1);
  const target = clamp(value / Math.max(0.7, money * 1.8) * budget, 0, CANONICAL_BIDS.at(-1));
  const spread = profile.forecastSpread;
  const entries = CANONICAL_BIDS.filter(bid => bid <= player.funds).map(bid => ({
    bid, weight: Math.exp(-0.5 * ((bid - target) / spread) ** 2),
  }));
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  return entries.map(({ bid, weight }) => ({ bid, probability: weight / total }));
}

export function evaluateNpcBids(context) {
  requireCondition(Object.hasOwn(PERSONALITIES, context.personality), 'Unknown NPC personality');
  requireCondition(Object.hasOwn(DIFFICULTY, context.difficulty), 'Unknown difficulty');
  requireCondition(Array.isArray(context.legalBids) && context.legalBids.length > 0, 'Missing legal bids');
  const profile = DIFFICULTY[context.difficulty];
  const self = getPlayer(context.players, context.playerId);
  const opponents = context.players.filter(p => p.id !== self.id);
  // Small public-information forecasts, not actual hidden bids or simulated
  // games. At most 3 opponents × 7 options; no future deck or policy history.
  const distributions = opponents.map(player => ({ player, bids: opponentDistribution(player, context, profile) }));
  const priority = context.priorityOrder.indexOf(self.id);
  const normal = context.currentLot.auctionType === 'normal';
  const value = lotValue(self, opponents, context.currentLot, context, profile, PERSONALITIES[context.personality]);
  const scores = context.legalBids.map(bid => {
    let recipientProbability = 1;
    for (const opponent of distributions) {
      const winsTie = priority < context.priorityOrder.indexOf(opponent.player.id);
      recipientProbability *= opponent.bids.reduce((sum, option) => sum
        + ((normal ? option.bid < bid : option.bid > bid) || (winsTie && option.bid === bid) ? option.probability : 0), 0);
    }
    const cost = moneyCost(self, opponents, bid, context, profile);
    const utility = normal ? recipientProbability * (value - cost)
      : -recipientProbability * value - (1 - recipientProbability) * cost;
    return { bid, utility };
  });
  const best = Math.max(...scores.map(entry => entry.utility));
  const weights = scores.map(entry => Math.exp((entry.utility - best) / profile.temperature));
  const total = weights.reduce((sum, value) => sum + value, 0);
  return scores.map((entry, index) => ({ ...entry, probability: weights[index] / total }));
}

export function chooseNpcBid(context, rng) {
  const candidates = evaluateNpcBids(context);
  const draw = drawRandom(rng); // Exactly one draw, including a sole legal 0.
  let cumulative = 0;
  for (const candidate of candidates) {
    cumulative += candidate.probability;
    if (draw < cumulative) return candidate.bid;
  }
  return candidates.at(-1).bid;
}
