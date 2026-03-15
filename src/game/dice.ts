export function rollDice(): [number, number, number] {
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ];
}

export function isBunco(dice: [number, number, number], roundNumber: number): boolean {
  const [a, b, c] = dice;
  return a === b && b === c && a === roundNumber;
}

export function isMiniBunco(dice: [number, number, number], roundNumber: number): boolean {
  const [a, b, c] = dice;
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
  let points = 0;
  if (isBunco(dice, roundNumber)) return { points: 21, rollAgain: true };
  if (isMiniBunco(dice, roundNumber)) return { points: 5, rollAgain: true };
  for (const d of dice) {
    if (d === roundNumber) points++;
  }
  return { points, rollAgain: points > 0 };
}
