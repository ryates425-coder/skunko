import type { DiceRoll, Player, ScoringMode } from './types';
import { rollDice, scoreRoll, isBunco, isMiniBunco } from './dice';

export type RoundResult = 
  | { type: 'continue'; points: number; isBunco?: boolean; isMiniBunco?: boolean }
  | { type: 'roundWin'; winnerId: string; points: number; isBunco?: boolean }
  | { type: 'gameOver'; winnerId: string };

export function evaluateRoll(
  dice: [number, number, number],
  roundNumber: number,
  currentScore: number,
  scoringMode: ScoringMode,
  players: Player[],
  currentPlayerId: string
): RoundResult {
  const result = scoreRoll(dice, roundNumber);
  const points = result.points;
  const bunco = isBunco(dice, roundNumber);
  const miniBunco = isMiniBunco(dice, roundNumber);

  if (points === 0) {
    return { type: 'continue', points: 0 };
  }

  const newScore = currentScore + points;

  if (bunco || newScore >= 21) {
    return {
      type: 'roundWin',
      winnerId: currentPlayerId,
      points,
      isBunco: bunco,
    };
  }

  return {
    type: 'continue',
    points,
    isBunco: bunco,
    isMiniBunco: miniBunco,
  };
}

export function getNextPlayerId(
  currentPlayerId: string,
  players: Player[]
): string {
  const idx = players.findIndex((p) => p.id === currentPlayerId);
  const nextIdx = (idx + 1) % players.length;
  return players[nextIdx].id;
}
