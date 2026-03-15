import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  rollDice,
  scoreRoll,
  isBunco,
  isMiniBunco,
  type RollResult,
} from '../game/dice';
import { pickAINames } from '../game/ai';
import { AI_NAMES } from '../constants/aiNames';
import type { GameState, Player, ScoringMode } from '../game/types';

const SOUNDS_HAPTICS_KEY = '@bunco/soundsAndHaptics';

function createInitialPlayers(scoringMode: ScoringMode): Player[] {
  const aiNames = pickAINames(3);
  return [
    {
      id: 'human',
      name: 'You',
      isHuman: true,
      position: 'south',
    },
    {
      id: `ai-0`,
      name: aiNames[0],
      isHuman: false,
      position: 'east',
    },
    {
      id: `ai-1`,
      name: aiNames[1],
      isHuman: false,
      position: 'north',
    },
    {
      id: `ai-2`,
      name: aiNames[2],
      isHuman: false,
      position: 'west',
    },
  ];
}

interface GameStore extends GameState {
  initGame: (scoringMode: ScoringMode) => void;
  roll: () => RollResult | null;
  endTurn: () => void;
  advanceToNextRound: () => void;
  restartGame: () => void;
  restartRound: () => void;
  endGameEarly: () => void;
  setSoundsAndHapticsEnabled: (enabled: boolean) => Promise<void>;
  loadSoundsAndHaptics: () => Promise<void>;
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'idle',
  scoringMode: 'individual',
  round: 1,
  roundScores: [0, 0, 0, 0],
  teamScores: [0, 0],
  roundWins: [0, 0, 0, 0],
  teamRoundWins: [0, 0],
  totalGameScores: [0, 0, 0, 0],
  currentPlayerIndex: 0,
  currentRoundScore: 0,
  players: [],
  turnInProgress: false,
  lastRoll: null,
  lastRollScore: 0,
  lastRollType: null,
  roundWinner: null,
  gameWinner: null,
  soundsAndHapticsEnabled: true,

  loadSoundsAndHaptics: async () => {
    try {
      const stored = await AsyncStorage.getItem(SOUNDS_HAPTICS_KEY);
      set({
        soundsAndHapticsEnabled: stored !== 'false',
      });
    } catch {
      // keep default
    }
  },

  setSoundsAndHapticsEnabled: async (enabled: boolean) => {
    set({ soundsAndHapticsEnabled: enabled });
    try {
      await AsyncStorage.setItem(SOUNDS_HAPTICS_KEY, String(enabled));
    } catch {}
  },

  initGame: (scoringMode: ScoringMode) => {
    const players = createInitialPlayers(scoringMode);
    set({
      phase: 'playing',
      scoringMode,
      round: 1,
      roundScores: [0, 0, 0, 0],
      teamScores: [0, 0],
      roundWins: [0, 0, 0, 0],
      teamRoundWins: [0, 0],
      totalGameScores: [0, 0, 0, 0],
      currentPlayerIndex: 0,
      currentRoundScore: 0,
      players,
      turnInProgress: false,
      lastRoll: null,
      lastRollScore: 0,
      lastRollType: null,
      roundWinner: null,
      gameWinner: null,
    });
  },

  roll: () => {
    const { round, phase, scoringMode } = get();
    if (phase !== 'playing') return null;

    const dice = rollDice();
    const result = scoreRoll(dice, round);

    const isBuncoRoll = isBunco(dice, round);
    const isMiniBuncoRoll = isMiniBunco(dice, round);

    let type: 'normal' | 'miniBunco' | 'bunco' = 'normal';
    if (isBuncoRoll) type = 'bunco';
    else if (isMiniBuncoRoll) type = 'miniBunco';

    set({
      turnInProgress: true,
      lastRoll: dice,
      lastRollScore: result.points,
      lastRollType: type,
    });

    const { currentPlayerIndex, roundScores, teamScores } = get();
    const humanIndex = 0;
    const isHumanTurn = currentPlayerIndex === humanIndex;

    if (scoringMode === 'individual') {
      const newScores = [...roundScores];
      newScores[currentPlayerIndex] += result.points;
      set({ roundScores: newScores });
    } else {
      const teamIndex = currentPlayerIndex % 2 === 0 ? 0 : 1;
      const newTeamScores = [...teamScores] as [number, number];
      newTeamScores[teamIndex] += result.points;
      set({ teamScores: newTeamScores });
    }

    const roundTarget = 21;
    const hitTarget =
      scoringMode === 'individual'
        ? (get().roundScores[currentPlayerIndex] ?? 0) >= roundTarget
        : (get().teamScores[currentPlayerIndex % 2 === 0 ? 0 : 1] ?? 0) >= roundTarget;

    if (isBuncoRoll || hitTarget) {
      set({ phase: 'roundEnd', roundWinner: currentPlayerIndex });
    } else if (!result.rollAgain) {
      const nextIndex = (currentPlayerIndex + 1) % 4;
      set({
        currentPlayerIndex: nextIndex,
        turnInProgress: false,
        lastRoll: null,
        lastRollScore: 0,
        lastRollType: null,
      });
    }

    return {
      dice,
      score: result.points,
      type,
      rollAgain: result.rollAgain,
    };
  },

  endTurn: () => {
    const { currentPlayerIndex, round, phase } = get();
    if (phase !== 'playing') return;

    const nextIndex = (currentPlayerIndex + 1) % 4;
    set({
      currentPlayerIndex: nextIndex,
      turnInProgress: false,
      lastRoll: null,
      lastRollScore: 0,
      lastRollType: null,
    });
  },

  advanceToNextRound: () => {
    const {
      round,
      roundWins,
      teamRoundWins,
      roundWinner,
      roundScores,
      teamScores,
      totalGameScores,
      scoringMode,
    } = get();

    if (roundWinner === null) return;

    const newRoundWins = [...roundWins];
    const newTeamRoundWins = [...teamRoundWins] as [number, number];
    const newTotalScores = [...totalGameScores];

    if (scoringMode === 'individual') {
      newRoundWins[roundWinner]++;
      for (let i = 0; i < 4; i++) {
        newTotalScores[i] += roundScores[i] ?? 0;
      }
    } else {
      const winningTeam = roundWinner % 2 === 0 ? 0 : 1;
      newTeamRoundWins[winningTeam]++;
      for (let i = 0; i < 4; i++) {
        const teamIdx = i % 2 === 0 ? 0 : 1;
        newTotalScores[i] += (teamScores[teamIdx] ?? 0) / 2;
      }
    }

    const nextRound = round + 1;

    if (nextRound > 6) {
      const finalWins = scoringMode === 'individual' ? newRoundWins : newTeamRoundWins;
      let maxWins = 0;
      let winnerIdx = 0;
      if (scoringMode === 'individual') {
        for (let i = 0; i < 4; i++) {
          if ((newRoundWins[i] ?? 0) > maxWins) {
            maxWins = newRoundWins[i] ?? 0;
            winnerIdx = i;
          }
        }
      } else {
        const t0 = newTeamRoundWins[0] ?? 0;
        const t1 = newTeamRoundWins[1] ?? 0;
        if (t0 >= t1) winnerIdx = 0;
        else winnerIdx = 1;
      }
      set({
        phase: 'gameEnd',
        round: 6,
        roundWins: newRoundWins,
        teamRoundWins: newTeamRoundWins,
        totalGameScores: newTotalScores,
        gameWinner: winnerIdx,
        roundWinner: null,
      });
    } else {
      set({
        round: nextRound,
        roundScores: [0, 0, 0, 0],
        teamScores: [0, 0],
        roundWins: newRoundWins,
        teamRoundWins: newTeamRoundWins,
        totalGameScores: newTotalScores,
        currentPlayerIndex: 0,
        currentRoundScore: 0,
        phase: 'playing',
        roundWinner: null,
        turnInProgress: false,
        lastRoll: null,
        lastRollScore: 0,
        lastRollType: null,
      });
    }
  },

  restartGame: () => {
    const { scoringMode, players } = get();
    set({
      phase: 'playing',
      round: 1,
      roundScores: [0, 0, 0, 0],
      teamScores: [0, 0],
      roundWins: [0, 0, 0, 0],
      teamRoundWins: [0, 0],
      totalGameScores: [0, 0, 0, 0],
      currentPlayerIndex: 0,
      currentRoundScore: 0,
      turnInProgress: false,
      lastRoll: null,
      lastRollScore: 0,
      lastRollType: null,
      roundWinner: null,
      gameWinner: null,
      players,
    });
  },

  restartRound: () => {
    set({
      phase: 'playing',
      roundScores: [0, 0, 0, 0],
      teamScores: [0, 0],
      currentPlayerIndex: 0,
      currentRoundScore: 0,
      turnInProgress: false,
      lastRoll: null,
      lastRollScore: 0,
      lastRollType: null,
      roundWinner: null,
    });
  },

  endGameEarly: () => {
    set({
      phase: 'gameEnd',
      gameWinner: -1,
      roundWinner: null,
    });
  },
}));
