import { rollDice } from './dice';
import { AI_NAMES } from '../constants/aiNames';

const AI_DELAY_MS = 1200;

export function pickAINames(count: number): string[] {
  const shuffled = [...AI_NAMES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getAIDelayMs(): number {
  return AI_DELAY_MS;
}

export function performAIRoll(): [number, number, number] {
  return rollDice();
}
