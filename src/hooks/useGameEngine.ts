import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';

const AI_DELAY_MS = 900;

export function useGameEngine() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { phase, currentPlayerIndex, players, roll, endTurn } = useGameStore();

  useEffect(() => {
    if (phase !== 'playing') return;

    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer || currentPlayer.isHuman) return;

    function scheduleRoll() {
      timerRef.current = setTimeout(() => {
        const result = roll();
        if (!result) return;

        const state = useGameStore.getState();
        if (state.phase === 'roundEnd') return;

        if (result.rollAgain) {
          scheduleRoll();
        }
      }, AI_DELAY_MS);
    }

    scheduleRoll();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase, currentPlayerIndex, players, roll, endTurn]);
}
