import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, InteractionManager, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dice } from '../src/components/Dice';
import { ScoreFly } from '../src/components/ScoreFly';
import { PlayerCard } from '../src/components/PlayerCard';
import { BuncoCelebration } from '../src/components/BuncoCelebration';
import { SkuncoCelebration } from '../src/components/SkuncoCelebration';
import { RoundTransition } from '../src/components/RoundTransition';
import { useGameStore } from '../src/stores/gameStore';
import { useGameEngine } from '../src/hooks/useGameEngine';
import { theme } from '../src/constants/theme';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { GameMenu } from '../src/components/GameMenu';
import {
  recordRoundComplete,
  recordBunco,
  recordMiniBunco,
} from '../src/services/stats';

export default function GameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);
  const [celebration, setCelebration] = useState<{
    type: 'miniBunco' | 'bunco' | 'roundWin' | 'skunco' | 'miniSkunco';
    winnerName?: string;
  } | null>(null);
  const [roundTransition, setRoundTransition] = useState<number | null>(null);
  const {
    phase,
    round,
    players,
    roundScores,
    teamScores,
    roundWins,
    teamRoundWins,
    currentPlayerIndex,
    lastRoll,
    lastRollScore,
    lastRollType,
    roundWinner,
    gameWinner,
    scoringMode,
    soundsAndHapticsEnabled,
    awaitingHumanAdvance,
    advanceFromHumanTurn,
    rolling,
    setRolling,
    pendingScoreFly,
    clearPendingScoreFly,
    setCelebrationActive,
    debuggerDiceEnabled,
  } = useGameStore();

  useGameEngine();

  useEffect(() => {
    if (phase === 'idle') {
      router.replace('/');
      return;
    }
    if (phase === 'gameEnd' && gameWinner !== null && gameWinner >= 0) {
      router.replace('/results');
    }
  }, [phase, gameWinner, router]);

  // Round win celebration fires from useLayoutEffect (before prevRolling is cleared).

  // AI won round — show transition (including when AI won with bunco), or advance to game end
  useEffect(() => {
    if (phase !== 'roundEnd' || roundWinner === null) return;
    const humanWonRound =
      scoringMode === 'individual'
        ? roundWinner === 0
        : roundWinner === 0 || roundWinner === 2;
    if (humanWonRound) return; // Human celebration path handles it

    if (round >= 6) {
      // AI won the game — advance to gameEnd after a brief pause so user sees the result.
      // Match human game-end delay (800ms) to avoid long pause.
      const t = setTimeout(() => {
        const state = useGameStore.getState();
        if (state.phase !== 'roundEnd' || state.roundWinner === null) return;
        state.advanceToNextRound();
      }, 800);
      return () => clearTimeout(t);
    }

    const nextRound = round + 1;
    const t = setTimeout(() => {
      const state = useGameStore.getState();
      if (state.phase !== 'roundEnd' || state.roundWinner === null) return;
      setCelebrationActive(true);
      setRoundTransition(nextRound);
    }, 1200);
    return () => clearTimeout(t);
  }, [phase, roundWinner, scoringMode, round]);

  /** Same as engine: ScoreFly starts 610ms from roll start (dice resolve at 550ms). */
  const SCORE_FLY_START_DELAY_MS = 610;

  const handleRoll = (forcedDice?: [number, number, number]) => {
    if (rollInProgressRef.current || !canRoll) return;
    rollInProgressRef.current = true;
    if (soundsAndHapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setRolling(true);
    // Snotzee-style: 600ms roll animation, resolve dice at 550ms
    setTimeout(() => {
      const result = useGameStore.getState().roll(forcedDice);
      const state = useGameStore.getState();
      if (!result) {
        setRolling(false);
        return;
      }
      if (state.phase === 'roundEnd') {
        // Bunco or 21 — no ScoreFly, fixed delay then end roll
        setTimeout(() => {
          if (soundsAndHapticsEnabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          setRolling(false);
        }, 1500 - 550);
        return;
      }
      if (result.score !== 0) {
        // Scoring — start ScoreFly at 610ms from roll start; roll stays true until ScoreFly completes
        const delayUntilScoreFly = SCORE_FLY_START_DELAY_MS - 550; // 60ms after roll() at 550ms
        setTimeout(() => {
          if (soundsAndHapticsEnabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          setScoreFly({ points: result.score, playerIndex: state.currentPlayerIndex });
        }, delayUntilScoreFly);
        // setRolling(false) runs in ScoreFly onComplete
      } else {
        // Non-scoring — end roll at 1500ms
        setTimeout(() => {
          if (soundsAndHapticsEnabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          setRolling(false);
          const s = useGameStore.getState();
          if (s.awaitingHumanAdvance) {
            setTimeout(() => advanceFromHumanTurn(), 0);
          }
        }, 1500 - 550);
      }
    }, 550);
  };

  const handleRollBunco = () => {
    handleRoll([round, round, round] as [number, number, number]);
  };

  const handleRollMiniBunco = () => {
    let n: number;
    do {
      n = Math.floor(Math.random() * 6) + 1;
    } while (n === round);
    handleRoll([n, n, n] as [number, number, number]);
  };

  const handleRollScoring = () => {
    const a = Math.floor(Math.random() * 6) + 1;
    const b = Math.floor(Math.random() * 6) + 1;
    handleRoll([round, a, b] as [number, number, number]); // At least one die matches round
  };

  const handleCelebrationComplete = () => {
    setCelebrationActive(false);
    setCelebration(null);
    const state = useGameStore.getState();
    if (state.phase === 'roundEnd') {
      if (state.round < 6) {
        setCelebrationActive(true);
        setRoundTransition(state.round + 1);
      } else {
        const humanWonRound =
          state.scoringMode === 'individual'
            ? state.roundWinner === 0
            : state.roundWinner === 0 || state.roundWinner === 2;
        recordRoundComplete({ scoringMode: state.scoringMode, humanWonRound });
        state.advanceToNextRound();
      }
    }
  };

  const handleRoundTransitionComplete = () => {
    const state = useGameStore.getState();
    const humanWonRound =
      state.scoringMode === 'individual'
        ? state.roundWinner === 0
        : state.roundWinner === 0 || state.roundWinner === 2;
    recordRoundComplete({ scoringMode: state.scoringMode, humanWonRound });
    setCelebrationActive(false);
    setRoundTransition(null);
    state.advanceToNextRound();
  };

  const getScoreForPlayer = (index: number) => {
    let score: number;
    if (scoringMode === 'individual') {
      score = roundScores[index] ?? 0;
    } else {
      const teamIdx = index % 2 === 0 ? 0 : 1;
      score = teamScores[teamIdx] ?? 0;
    }
    // Hide the score update until ScoreFly animation completes. Show old score while rolling
    // (dice settling) and while ScoreFly is animating (fly hasn't landed yet).
    const isScoringEntity =
      scoringMode === 'individual'
        ? index === currentPlayerIndex
        : (index % 2) === (currentPlayerIndex % 2);
    // ScoreFly is "active" when scoreFly exists, or when pendingScoreFly is set (same store update as rolling=false),
    // or during the legacy transition (prevRolling && !rolling for human rolls that use setRolling only).
    // Don't hide once ScoreFly has completed (fullScoreDisplayedRef) — show updated score immediately.
    const flySource = scoreFly ?? pendingScoreFly;
    const scoreFlyActiveForThisPlayer =
      !fullScoreDisplayedRef.current &&
      lastRollScore !== 0 &&
      isScoringEntity &&
      phase === 'playing' &&
      (flySource !== null
        ? (scoringMode === 'individual' ? flySource.playerIndex === index : true)
        : prevRolling.current && !rolling);
    // While rolling (before ScoreFly starts): show old score unless we've already committed.
    // Don't hide when phase is roundEnd (bunco/21) — no ScoreFly, show full score immediately.
    const hideDuringRoll =
      phase === 'playing' &&
      rolling &&
      lastRollScore !== 0 &&
      isScoringEntity &&
      !fullScoreDisplayedRef.current;
    if (hideDuringRoll || scoreFlyActiveForThisPlayer) {
      return Math.max(0, score - lastRollScore);
    }
    return score;
  };

  const getRoundWinsForPlayer = (index: number) => {
    if (scoringMode === 'individual') return roundWins[index] ?? 0;
    const teamIdx = index % 2 === 0 ? 0 : 1;
    return teamRoundWins[teamIdx] ?? 0;
  };

  const turnInProgress = useGameStore((s) => s.turnInProgress);
  const celebrationActive = useGameStore((s) => s.celebrationActive);
  const canRoll = phase === 'playing' && currentPlayerIndex === 0 && !turnInProgress && !celebrationActive && !rolling;

  const southPlayer = players[0];
  const eastPlayer = players[1];
  const northPlayer = players[2];
  const westPlayer = players[3];

  const containerRef = useRef<View>(null);
  const southSlotRef = useRef<View>(null);
  const eastSlotRef = useRef<View>(null);
  const northSlotRef = useRef<View>(null);
  const westSlotRef = useRef<View>(null);
  const slotRefs = [southSlotRef, eastSlotRef, northSlotRef, westSlotRef];
  const southCardRef = useRef<View>(null);
  const eastCardRef = useRef<View>(null);
  const northCardRef = useRef<View>(null);
  const westCardRef = useRef<View>(null);
  const cardRefs = [southCardRef, eastCardRef, northCardRef, westCardRef];
  const [scoreFly, setScoreFly] = useState<{ points: number; playerIndex: number } | null>(null);
  const prevRolling = useRef(rolling);
  const fullScoreDisplayedRef = useRef(false);
  const prevLastRollKey = useRef<string | null>(null);
  const rollInProgressRef = useRef(false);

  // Clear roll-in-progress guard when rolling completes so user can roll again
  useEffect(() => {
    if (!rolling) rollInProgressRef.current = false;
  }, [rolling]);

  // Sync: clear fullScoreDisplayedRef when new roll detected. Must run during render (before
  // getScoreForPlayer) so we don't show full score for one frame when roll() just returned — that
  // caused the first-score bounce. useEffect runs after paint, too late.
  // Also clear when lastRoll just became non-null (first roll of turn) — prevLastRollKey is null.
  if (rolling && lastRoll !== null && lastRollScore !== 0) {
    const key = `${JSON.stringify(lastRoll)}-${lastRollScore}`;
    if (prevLastRollKey.current !== key) {
      fullScoreDisplayedRef.current = false;
      prevLastRollKey.current = key;
    }
  } else if (lastRoll === null) {
    prevLastRollKey.current = null;
  }

  // Mark full score displayed when ScoreFly completes (onComplete), or when !rolling with no ScoreFly
  // (non-scoring roll). Don't set on !rolling for scoring rolls — we wait for ScoreFly to land first.
  useEffect(() => {
    if (!rolling && lastRollScore === 0) fullScoreDisplayedRef.current = true;
  }, [rolling, lastRollScore]);

  // Sync: clear fullScoreDisplayedRef when new roll detected. Must run during render (before
  // getScoreForPlayer) so we don't show full score for one frame when roll() just returned.
  // That caused the first-score bounce. useEffect runs after paint, too late.
  if (rolling && lastRoll !== null && lastRollScore !== 0) {
    const key = `${JSON.stringify(lastRoll)}-${lastRollScore}`;
    if (prevLastRollKey.current !== key) {
      fullScoreDisplayedRef.current = false;
      prevLastRollKey.current = key;
    }
  } else if (lastRoll === null) {
    prevLastRollKey.current = null;
  }

  // Only clear scoreFly when a NEW roll just updated the score (rollAgain case). Detect by:
  // lastRollScore changed from what scoreFly was set with - means roll() just added more points.
  // Don't clear when advancing turns (lastRoll=null) or when we just set rolling=true for
  // scheduleRoll (lastRollScore === scoreFly.points).
  useEffect(() => {
    if (
      rolling &&
      scoreFly !== null &&
      lastRoll !== null &&
      lastRollScore !== scoreFly.points
    ) {
      setScoreFly(null);
    }
  }, [rolling, scoreFly, lastRoll, lastRollScore]);

  useLayoutEffect(() => {
    // Fire bunco/miniBunco/roundWin celebration when roll lands. Must run BEFORE prevRolling is updated,
    // because useEffect runs after useLayoutEffect and would see prevRolling already cleared.
    // When round >= 6 (game-winning roll), skip the celebration on game screen and go straight to
    // results — avoids conflict between bunco/roundWin animation and end-game transition.
    let t: ReturnType<typeof setTimeout> | null = null;
    if (prevRolling.current && !rolling && currentPlayerIndex === 0) {
      const isGameWinningRoll = phase === 'roundEnd' && round >= 6;
      if (lastRollType === 'miniBunco' || lastRollType === 'bunco') {
        const type = lastRollType;
        const sm = scoringMode;
        const snd = soundsAndHapticsEnabled;
        const p0Name = players[0]?.name ?? 'Winner';
        if (isGameWinningRoll) {
          t = setTimeout(() => {
            if (type === 'bunco') recordBunco(sm);
            else recordMiniBunco(sm);
            if (snd) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const humanWon =
              scoringMode === 'individual' ? roundWinner === 0 : roundWinner === 0 || roundWinner === 2;
            recordRoundComplete({ scoringMode: sm, humanWonRound: humanWon ?? false });
            useGameStore.getState().advanceToNextRound();
          }, 800);
        } else {
          // Set immediately — advanceFromHumanTurn (from ScoreFly onComplete) triggers a re-render
          // that cancels delayed timeouts via effect cleanup; sync set avoids cancellation
          if (type === 'miniBunco') {
            setCelebrationActive(true);
            setCelebration({ type: 'miniSkunco' });
            recordMiniBunco(sm);
            if (snd) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            setCelebrationActive(true);
            setCelebration({ type: 'skunco' });
            recordBunco(sm);
            if (snd) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      } else if (phase === 'roundEnd' && roundWinner !== null && lastRollType !== 'bunco') {
        const humanWonRound =
          scoringMode === 'individual'
            ? roundWinner === 0
            : roundWinner === 0 || roundWinner === 2;
        if (humanWonRound) {
          const rwName = players[roundWinner]?.name ?? 'Winner';
          const snd = soundsAndHapticsEnabled;
          if (isGameWinningRoll) {
            t = setTimeout(() => {
              recordRoundComplete({ scoringMode, humanWonRound });
              if (snd) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              useGameStore.getState().advanceToNextRound();
            }, 800);
          } else {
            t = setTimeout(() => {
              setCelebrationActive(true);
              setCelebration({ type: 'roundWin', winnerName: rwName });
              if (snd) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }, 100);
          }
        }
      }
    }
    if (pendingScoreFly !== null) {
      setScoreFly(pendingScoreFly);
      clearPendingScoreFly();
    }
    prevRolling.current = rolling;
    return () => {
      if (t !== null) clearTimeout(t);
    };
  }, [rolling, phase, lastRoll, lastRollScore, lastRollType, currentPlayerIndex, pendingScoreFly, clearPendingScoreFly, scoringMode, soundsAndHapticsEnabled, players]);

  return (
    <View ref={containerRef} style={[styles.container, { paddingTop: Math.max(insets.top, insets.bottom), paddingBottom: Math.max(insets.top, insets.bottom), paddingLeft: Math.max(insets.left, insets.right, theme.spacing.lg), paddingRight: Math.max(insets.left, insets.right, theme.spacing.lg) }]} collapsable={false}>
      <View style={styles.table}>
        <View style={styles.tableSurface}>
          <Text style={styles.roundLabel}>
            Round {round} — Rolling for {round}s
          </Text>

          <View style={styles.playersLayout}>
            <View style={styles.northSeat}>
              {northPlayer && (
                <View ref={northCardRef} collapsable={false}>
                  <PlayerCard
                    player={northPlayer}
                    score={getScoreForPlayer(2)}
                    roundWins={getRoundWinsForPlayer(2)}
                    isCurrentTurn={currentPlayerIndex === 2}
                    scoringMode={scoringMode}
                    teamLabel={scoringMode === 'team' ? 'Team 2' : undefined}
                  />
                </View>
              )}
              <View
                ref={northSlotRef}
                style={styles.diceSlotVertical}
                collapsable={false}
              >
                {((phase === 'playing' && currentPlayerIndex === 2) || (phase === 'roundEnd' && roundWinner === 2 && lastRoll !== null)) && (
                  <Dice
                    values={lastRoll ?? [round, round, round]}
                    rolling={rolling}
                    vertical={false}
                    round={round}
                    lastRollType={lastRollType}
                  />
                )}
              </View>
            </View>

            <View style={styles.eastWestRow}>
              <View style={styles.westSeat}>
                {westPlayer && (
                  <View ref={westCardRef} collapsable={false}>
                    <PlayerCard
                      player={westPlayer}
                      score={getScoreForPlayer(3)}
                      roundWins={getRoundWinsForPlayer(3)}
                      isCurrentTurn={currentPlayerIndex === 3}
                      scoringMode={scoringMode}
                      teamLabel={scoringMode === 'team' ? 'Team 2' : undefined}
                    />
                  </View>
                )}
                <View
                  ref={westSlotRef}
                  style={styles.diceSlotHorizontal}
                  collapsable={false}
                >
                  {((phase === 'playing' && currentPlayerIndex === 3) || (phase === 'roundEnd' && roundWinner === 3 && lastRoll !== null)) && (
                    <Dice
                      values={lastRoll ?? [round, round, round]}
                      rolling={rolling}
                      vertical={true}
                      round={round}
                      lastRollType={lastRollType}
                    />
                  )}
                </View>
              </View>
              <View style={styles.tableCenter} />
              <View style={styles.eastSeat}>
                <View
                  ref={eastSlotRef}
                  style={styles.diceSlotHorizontal}
                  collapsable={false}
                >
                  {((phase === 'playing' && currentPlayerIndex === 1) || (phase === 'roundEnd' && roundWinner === 1 && lastRoll !== null)) && (
                    <Dice
                      values={lastRoll ?? [round, round, round]}
                      rolling={rolling}
                      vertical={true}
                      round={round}
                      lastRollType={lastRollType}
                    />
                  )}
                </View>
                {eastPlayer && (
                  <View ref={eastCardRef} collapsable={false}>
                    <PlayerCard
                      player={eastPlayer}
                      score={getScoreForPlayer(1)}
                      roundWins={getRoundWinsForPlayer(1)}
                      isCurrentTurn={currentPlayerIndex === 1}
                      scoringMode={scoringMode}
                      teamLabel={scoringMode === 'team' ? 'Team 1' : undefined}
                    />
                  </View>
                )}
              </View>
            </View>

            <View style={styles.southSeat}>
              <View
                ref={southSlotRef}
                style={styles.diceSlotVertical}
                collapsable={false}
              >
                {((phase === 'playing' && currentPlayerIndex === 0) || (phase === 'roundEnd' && roundWinner === 0 && lastRoll !== null)) && (
                  <Dice
                    values={lastRoll ?? [round, round, round]}
                    rolling={rolling}
                    vertical={false}
                    round={round}
                    lastRollType={lastRollType}
                    onDoubleTapDie0={debuggerDiceEnabled && canRoll ? handleRollBunco : undefined}
                    onDoubleTapDie1={debuggerDiceEnabled && canRoll ? handleRollMiniBunco : undefined}
                    onDoubleTapDie2={debuggerDiceEnabled && canRoll ? handleRollScoring : undefined}
                  />
                )}
              </View>
              {southPlayer && (
                <Pressable
                  onPress={() => handleRoll()}
                  disabled={!canRoll}
                  style={({ pressed }) => [pressed && canRoll && { opacity: 0.8 }]}
                >
                  <View ref={southCardRef} collapsable={false}>
                    <PlayerCard
                      player={southPlayer}
                      score={getScoreForPlayer(0)}
                      roundWins={getRoundWinsForPlayer(0)}
                      isCurrentTurn={currentPlayerIndex === 0}
                      scoringMode={scoringMode}
                      teamLabel={scoringMode === 'team' ? 'Team 1' : undefined}
                    />
                  </View>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </View>

      {scoreFly && (
        <ScoreFly
          points={scoreFly.points}
          playerIndex={scoreFly.playerIndex}
          slotRefs={slotRefs}
          cardRefs={cardRefs}
          containerRef={containerRef}
          onComplete={() => {
            setScoreFly(null);
            fullScoreDisplayedRef.current = true;
            setRolling(false);
            const state = useGameStore.getState();
            if (state.awaitingHumanAdvance) {
              setTimeout(() => advanceFromHumanTurn(), 0);
            }
          }}
        />
      )}

      <Pressable
        style={[styles.menuButton, { top: insets.top + 16, left: Math.max(insets.left, theme.spacing.lg) }]}
        onPress={() => setMenuVisible(true)}
      >
        <Ionicons name="menu" size={28} color={theme.colors.cardBackground} />
      </Pressable>

      {celebration && (celebration.type === 'skunco' || celebration.type === 'miniSkunco') && (
        <SkuncoCelebration
          type={celebration.type}
          onComplete={handleCelebrationComplete}
        />
      )}
      {celebration && celebration.type !== 'skunco' && celebration.type !== 'miniSkunco' && (
        <BuncoCelebration
          type={celebration.type}
          winnerName={celebration.winnerName}
          onComplete={handleCelebrationComplete}
        />
      )}

      {roundTransition !== null && (
        <RoundTransition
          round={roundTransition}
          onComplete={handleRoundTransitionComplete}
        />
      )}

      <GameMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.tableEdge,
  },
  table: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
    justifyContent: 'center',
  },
  tableSurface: {
    flex: 1,
    backgroundColor: theme.colors.tableFelt,
    borderRadius: 24,
    borderWidth: 8,
    borderColor: theme.colors.tableEdge,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
    minHeight: 600,
  },
  roundLabel: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.cardBackground,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  playersLayout: {
    flex: 1,
  },
  northSeat: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  eastWestRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  westSeat: {
    flex: 1,
    flexBasis: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing.sm,
  },
  diceSlotVertical: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diceSlotHorizontal: {
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableCenter: {
    flex: 1,
    flexBasis: 0,
  },
  eastSeat: {
    flex: 1,
    flexBasis: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  diceArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    minHeight: 140,
  },
  southSeat: {
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  menuButton: {
    position: 'absolute',
    left: theme.spacing.lg,
    padding: theme.spacing.sm,
  },
});
