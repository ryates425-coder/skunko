export type ScoringMode = 'individual' | 'team';

export interface Player {
  id: string;
  name: string;
  isHuman: boolean;
  position: 'north' | 'east' | 'south' | 'west';
}

export interface GameState {
  phase: 'idle' | 'playing' | 'roundEnd' | 'gameEnd';
  scoringMode: ScoringMode;
  round: number;
  roundScores: number[];
  teamScores: [number, number];
  roundWins: number[];
  teamRoundWins: [number, number];
  totalGameScores: number[];
  currentPlayerIndex: number;
  currentRoundScore: number;
  players: Player[];
  turnInProgress: boolean;
  lastRoll: [number, number, number] | null;
  lastRollScore: number;
  lastRollType: 'normal' | 'miniBunco' | 'bunco' | null;
  roundWinner: number | null;
  gameWinner: number | null;
  soundsAndHapticsEnabled: boolean;
  /** True when human just finished turn (no rollAgain) — UI pauses before advancing */
  awaitingHumanAdvance: boolean;
  /** True during dice roll animation (human or AI) */
  rolling: boolean;
  /** True while celebration overlay is showing — blocks rolls and AI turns */
  celebrationActive: boolean;
}

export type RollResult = {
  dice: [number, number, number];
  score: number;
  type: 'normal' | 'miniBunco' | 'bunco';
  rollAgain: boolean;
};
