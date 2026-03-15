import { rollDice } from './dice';

const MIN_DELAY_MS = 800;
const MAX_DELAY_MS = 1200;

export function getAIDelayMs(): number {
  return MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
}

export function performAIRoll(): [number, number, number] {
  return rollDice();
}
