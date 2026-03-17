import type { StoreApi } from 'zustand';
import type { GameStore } from '../stores/gameStore';

const ROLL_ANIMATION_MS = 600;
const RESOLVE_AT_MS = 550;
const SCORE_FLY_START_DELAY_MS = 610;
const SCORE_FLY_ANIMATION_MS = 600;
const DELAY_AFTER_SCORE_FLY_MS = 500;
const NON_SCORING_DELAY_MS = 610;

let timerId: ReturnType<typeof setTimeout> | null = null;
let resolveId: ReturnType<typeof setTimeout> | null = null;
let phase1Id: ReturnType<typeof setTimeout> | null = null;
let phase2Id: ReturnType<typeof setTimeout> | null = null;
let advanceId: ReturnType<typeof setTimeout> | null = null;
let lastScheduledKey: string | null = null;

function clearAll() {
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
  if (resolveId) {
    clearTimeout(resolveId);
    resolveId = null;
  }
  if (phase1Id) {
    clearTimeout(phase1Id);
    phase1Id = null;
  }
  if (phase2Id) {
    clearTimeout(phase2Id);
    phase2Id = null;
  }
  if (advanceId) {
    clearTimeout(advanceId);
    advanceId = null;
  }
}

export function initAIEngine(store: StoreApi<GameStore>) {
  function scheduleRoll() {
    timerId = setTimeout(() => {
      store.getState().setRolling(true);
      resolveId = setTimeout(() => {
        const result = store.getState().roll();
        resolveId = null;
        if (!result) {
          store.getState().setRolling(false);
          return;
        }
        const s = store.getState();
        if (s.phase === 'roundEnd') {
          s.setRolling(false);
          return;
        }
        if (result.score !== 0) {
          const points = result.score;
          const playerIndex = store.getState().currentPlayerIndex;
          phase1Id = setTimeout(() => {
            store.getState().prepareScoreFlyAndStopRolling({ points, playerIndex });
            phase1Id = null;
          }, SCORE_FLY_START_DELAY_MS);
          phase2Id = setTimeout(() => {
            phase2Id = null;
            if (result.rollAgain) {
              scheduleRoll();
            } else {
              advanceId = setTimeout(() => {
                store.getState().endTurn();
                advanceId = null;
              }, 0);
            }
          }, SCORE_FLY_START_DELAY_MS + SCORE_FLY_ANIMATION_MS + DELAY_AFTER_SCORE_FLY_MS);
        } else {
          const nonScoringDelay = NON_SCORING_DELAY_MS;
          phase2Id = setTimeout(() => {
            store.getState().setRolling(false);
            phase2Id = null;
            if (result.rollAgain) {
              scheduleRoll();
            } else {
              advanceId = setTimeout(() => {
                store.getState().endTurn();
                advanceId = null;
              }, 0);
            }
          }, nonScoringDelay);
        }
      }, RESOLVE_AT_MS);
    }, 0);
  }

  function tryStartAITurn() {
    const state = store.getState();
    if (state.phase !== 'playing' || state.celebrationActive || state.rolling) return;

    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.isHuman) return;

    const key = `playing-${state.currentPlayerIndex}`;
    if (lastScheduledKey === key) return;
    lastScheduledKey = key;

    scheduleRoll();
  }

  store.subscribe(() => {
    const state = store.getState();
    if (state.phase !== 'playing' && state.phase !== 'roundEnd') {
      clearAll();
      lastScheduledKey = null;
      return;
    }
    if (state.rolling) return;
    if (state.phase !== 'playing' || state.celebrationActive) {
      lastScheduledKey = null;
      return;
    }
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.isHuman) {
      lastScheduledKey = null;
      return;
    }
    const key = `playing-${state.currentPlayerIndex}`;
    if (lastScheduledKey === key) return;
    lastScheduledKey = key;
    scheduleRoll();
  });

  tryStartAITurn();
}
