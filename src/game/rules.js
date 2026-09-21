import { BUST_THRESHOLD, getLot, ROUND_COUNT } from './data.js';
import {
  assertBids, assertPlayers, assertPriority, copyPlayer, getPlayer, playerValues, requireCondition,
} from './validation.js';

// Pure rule primitive. The engine owns phase transitions and NPC collection.
export function resolveAuction({ players, lotId, bids, priorityOrder, round }) {
  assertPlayers(players);
  assertPriority(priorityOrder, players);
  assertBids(bids, players);
  requireCondition(Number.isInteger(round) && round >= 1 && round <= ROUND_COUNT, 'Invalid auction round');
  const lot = getLot(lotId);
  const normal = lot.auctionType === 'normal';
  const amounts = players.map((player) => bids[player.id]);
  const targetBid = normal ? Math.max(...amounts) : Math.min(...amounts);
  const recipientId = priorityOrder.find((id) => bids[id] === targetBid);
  const payments = Object.fromEntries(players.map((player) => [
    player.id, (normal ? player.id === recipientId : player.id !== recipientId) ? bids[player.id] : 0,
  ]));
  const nextPlayers = players.map((player) => ({
    ...copyPlayer(player), funds: player.funds - payments[player.id],
  }));
  const recipient = getPlayer(nextPlayers, recipientId);
  const previous = getPlayer(players, recipientId);
  recipient.prestige += lot.prestigeDelta;
  recipient.heat = Math.max(0, recipient.heat + lot.heatDelta);
  if (lot.specialEffect === 'patron') recipient.patron = true;
  assertPlayers(nextPlayers);

  return {
    players: nextPlayers,
    roundResult: {
      round,
      lot: { ...lot },
      auctionType: lot.auctionType,
      bids: { ...bids },
      priorityOrder: [...priorityOrder],
      winnerId: normal ? recipientId : null,
      victimId: normal ? null : recipientId,
      payments,
      appliedEffects: [{
        playerId: recipientId,
        specialEffect: lot.specialEffect,
        prestigeDelta: recipient.prestige - previous.prestige,
        heatDelta: recipient.heat - previous.heat,
        patronGranted: !previous.patron && recipient.patron,
      }],
      playerChanges: players.map((player, index) => ({
        playerId: player.id,
        before: playerValues(player),
        after: playerValues(nextPlayers[index]),
        delta: {
          funds: nextPlayers[index].funds - player.funds,
          prestige: nextPlayers[index].prestige - player.prestige,
          heat: nextPlayers[index].heat - player.heat,
        },
        patronAcquired: !player.patron && nextPlayers[index].patron,
      })),
    },
  };
}

// Pure final-rule calculation; only advanceRound may attach this to Game State.
export function resolveFinal(players) {
  assertPlayers(players);
  const notBusted = players.filter((player) => player.heat < BUST_THRESHOLD);
  const minimumFunds = notBusted.length ? Math.min(...notBusted.map((player) => player.funds)) : null;
  const results = players.map((player) => {
    const eliminationReason = player.heat >= BUST_THRESHOLD ? 'bust'
      : player.funds === minimumFunds ? 'bankroll' : 'none';
    const eliminated = eliminationReason !== 'none';
    return {
      ...copyPlayer(player),
      finalScore: eliminated ? null
        : player.prestige + (player.patron ? Math.floor(Math.max(player.prestige, 0) * 0.4) : 0),
      eliminated,
      eliminationReason,
      winner: false,
    };
  });
  const survivors = results.filter((player) => !player.eliminated);
  const highestScore = survivors.length ? Math.max(...survivors.map((player) => player.finalScore)) : null;
  survivors.forEach((player) => { player.winner = player.finalScore === highestScore; });
  return {
    outcome: survivors.length ? 'winners' : 'all_eliminated',
    winnerIds: survivors.filter((player) => player.winner).map((player) => player.id),
    players: results,
  };
}
