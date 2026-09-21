// Rule values: docs/GAME_SPEC.md sections 3-13. No presentation resources.
export const SCHEMA_VERSION = 2;
export const DIFFICULTIES = Object.freeze(['normal', 'hard']);
export const PLAYER_COUNT = 4;
export const ROUND_COUNT = 13;
export const INITIAL_FUNDS = 100;
export const INITIAL_PRESTIGE = 0;
export const INITIAL_HEAT = 0;
export const BUST_THRESHOLD = 8;
export const CANONICAL_BIDS = Object.freeze([0, 5, 10, 15, 20, 25, 30]);

export const PLAYER_DEFINITIONS = Object.freeze([
  { id: 'human', role: 'human', characterId: 'human', name: 'あなた' },
  { id: 'count', role: 'npc', characterId: 'count', name: '伯爵' },
  { id: 'collector', role: 'npc', characterId: 'collector', name: '収集家' },
  { id: 'smuggler', role: 'npc', characterId: 'smuggler', name: '密売人' },
].map(Object.freeze));

export const LOTS = Object.freeze([
  ['ancient-coins', '古代銀貨', 'normal', 4, 0, 'none'],
  ['forbidden-index', '禁書目録', 'normal', 5, 1, 'none'],
  ['noble-ring', '貴族の指輪', 'normal', 7, 1, 'none'],
  ['alchemy-watch', '錬金時計', 'normal', 6, 1, 'none'],
  ['sealed-jar', '封印された壺', 'normal', 8, 2, 'none'],
  ['royal-jewel', '王家の宝石', 'normal', 10, 2, 'none'],
  ['black-crown', '黒い王冠', 'normal', 12, 3, 'none'],
  ['patron-letter', 'パトロンの紹介状', 'normal', 0, 1, 'patron'],
  ['appraisal', '鑑定書', 'normal', 3, -2, 'appraisal'],
  ['forged-painting', '偽物の名画', 'avoidance', -8, 0, 'none'],
  ['informer', '密告者', 'avoidance', -5, 1, 'none'],
  ['tax-audit', '税務監査', 'avoidance', -6, 2, 'none'],
  ['raid', 'ガサ入れ', 'avoidance', -4, 3, 'none'],
].map(([id, name, auctionType, prestigeDelta, heatDelta, specialEffect]) =>
  Object.freeze({ id, name, auctionType, prestigeDelta, heatDelta, specialEffect }),
));

export function getLot(id) {
  const lot = LOTS.find((entry) => entry.id === id);
  if (!lot) throw new RangeError(`Unknown lot: ${id}`);
  return lot;
}
