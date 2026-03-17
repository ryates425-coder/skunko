import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';

const ROLL_ANIMATION_MS = 600;
const RESOLVE_AT_MS = 550;
/** Dice stop at 600ms. ScoreFly starts 610ms from roll(). */
const SCORE_FLY_START_DELAY_MS = 610;
/** ScoreFly animates for 50ms setup + 1100ms fly. */
const SCORE_FLY_ANIMATION_MS = 600;
/** Pause after ScoreFly lands so user sees updated avatar before next roll. */
const DELAY_AFTER_SCORE_FLY_MS = 500;
/** Delay before setRolling(false) for AI non-scoring rolls. Matches dice-settle time (610ms) so highlight shows when dice land. */
const NON_SCORING_DELAY_MS = 610;

/**
 * Engine runs via store subscription with empty effect deps, so timers are never
 * cancelled by effect cleanup from store updates (roll, prepareScoreFlyAndStopRolling).
 * Cleanup only runs on unmount.
 */
export function useGameEngine() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phase1Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phase2Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScheduledKeyRef = useRef<string | null>(null);

  useEffect(() => {
    function scheduleRoll() {
      const store = useGameStore.getState();
      timerRef.current = setTimeout(() => {
        store.setRolling(true);
        resolveRef.current = setTimeout(() => {
          const result = store.roll();
          resolveRef.current = null;
          if (!result) {
            useGameStore.getState().setRolling(false);
            return;
          }
          const s = useGameStore.getState();
          if (s.phase === 'roundEnd') {
            s.setRolling(false);
            return;
          }
          if (result.score !== 0) {
            const points = result.score;
            const playerIndex = useGameStore.getState().currentPlayerIndex;
            phase1Ref.current = setTimeout(() => {
              useGameStore.getState().prepareScoreFlyAndStopRolling({ points, playerIndex });
              phase1Ref.current = null;
            }, SCORE_FLY_START_DELAY_MS);
            phase2Ref.current = setTimeout(() => {
              phase2Ref.current = null;
              if (result.rollAgain) {
                scheduleRoll();
              } else {
                advanceRef.current = setTimeout(() => {
                  useGameStore.getState().endTurn();
                  advanceRef.current = null;
                }, 0);
              }
            }, SCORE_FLY_START_DELAY_MS + SCORE_FLY_ANIMATION_MS + DELAY_AFTER_SCORE_FLY_MS);
          } else {
            phase2Ref.current = setTimeout(() => {
              useGameStore.getState().setRolling(false);
              phase2Ref.current = null;
              if (result.rollAgain) {
                scheduleRoll();
              } else {
                advanceRef.current = setTimeout(() => {
                  useGameStore.getState().endTurn();
                  advanceRef.current = null;
                }, 0);
              }
            }, NON_SCORING_DELAY_MS);
          }
        }, RESOLVE_AT_MS);
      }, 0);
    }

    function tryStartAITurn() {
      const state = useGameStore.getState();
      if (state.phase !== 'playing' || state.celebrationActive || state.rolling) return;

      const currentPlayer = state.players[state.currentPlayerIndex];
      if (!currentPlayer || currentPlayer.isHuman) return;

      const key = `playing-${state.currentPlayerIndex}`;
      if (lastScheduledKeyRef.current === key) return;
      lastScheduledKeyRef.current = key;

      scheduleRoll();
    }

    tryStartAITurn();

    const unsub = useGameStore.subscribe(() => {
      const state = useGameStore.getState();
      if (state.rolling) return;
      if (state.phase !== 'playing' || state.celebrationActive) {
        lastScheduledKeyRef.current = null;
        return;
      }
      const currentPlayer = state.players[state.currentPlayerIndex];
      if (!currentPlayer || currentPlayer.isHuman) {
        lastScheduledKeyRef.current = null;
        return;
      }
      const key = `playing-${state.currentPlayerIndex}`;
      if (lastScheduledKeyRef.current === key) return;
      lastScheduledKeyRef.current = key;
      scheduleRoll();
    });

    return () => {
      unsub();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (resolveRef.current) {
        clearTimeout(resolveRef.current);
        resolveRef.current = null;
      }
      if (phase1Ref.current) {
        clearTimeout(phase1Ref.current);
        phase1Ref.current = null;
      }
      if (phase2Ref.current) {
        clearTimeout(phase2Ref.current);
        phase2Ref.current = null;
      }
      if (advanceRef.current) {
        clearTimeout(advanceRef.current);
        advanceRef.current = null;
      }
      lastScheduledKeyRef.current = null;
    };
  }, []);
}
