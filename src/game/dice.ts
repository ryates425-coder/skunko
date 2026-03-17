export function rollDice(): [number, number, number] {
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ];
}

function ensureDice(dice: unknown): [number, number, number] | null {
  if (!Array.isArray(dice) || dice.length !== 3) return null;
  const a = dice[0], b = dice[1], c = dice[2];
  if (typeof a !== 'number' || typeof b !== 'number' || typeof c !== 'number') return null;
  return [a, b, c];
}

export function isBunco(dice: [number, number, number], roundNumber: number): boolean {
  const d = ensureDice(dice);
  if (!d) return false;
  const [a, b, c] = d;
  return a === b && b === c && a === roundNumber;
}

export function isMiniBunco(dice: [number, number, number], roundNumber: number): boolean {
  const d = ensureDice(dice);
  if (!d) return false;
  const [a, b, c] = d;
  return a === b && b === c && a !== roundNumber;
}

export interface RollResult {
  points: number;
  rollAgain: boolean;
}

export function scoreRoll(
  dice: [number, number, number],
  roundNumber: number
): RollResult {
  const d = ensureDice(dice);
  if (!d) return { points: 0, rollAgain: false };
  let points = 0;
  if (isBunco(d, roundNumber)) return { points: 21, rollAgain: true };
  if (isMiniBunco(d, roundNumber)) return { points: -5, rollAgain: false };
  for (const die of d) {
    if (die === roundNumber) points++;
  }
  return { points, rollAgain: points > 0 };
}
