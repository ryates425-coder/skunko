import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Dice } from '../src/components/Dice';
import { PlayerCard } from '../src/components/PlayerCard';
import { BuncoCelebration } from '../src/components/BuncoCelebration';
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

const POSITION_ORDER: Array<'south' | 'east' | 'north' | 'west'> = [
  'south',
  'east',
  'north',
  'west',
];

export default function GameScreen() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [celebration, setCelebration] = useState<{
    type: 'miniBunco' | 'bunco' | 'roundWin';
    winnerName?: string;
  } | null>(null);
  const [rolling, setRolling] = useState(false);

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
    lastRollType,
    roundWinner,
    gameWinner,
    scoringMode,
    soundsAndHapticsEnabled,
  } = useGameStore();

  useGameEngine();

  useEffect(() => {
    if (phase === 'gameEnd' && gameWinner !== null && gameWinner >= 0) {
      router.replace('/results');
    }
  }, [phase, gameWinner, router]);

  useEffect(() => {
    if (lastRollType === 'miniBunco') {
      setCelebration({ type: 'miniBunco' });
      if (currentPlayerIndex === 0) {
        recordMiniBunco(scoringMode);
      }
      if (soundsAndHapticsEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else if (lastRollType === 'bunco') {
      const name = players[currentPlayerIndex]?.name ?? 'Winner';
      setCelebration({ type: 'bunco', winnerName: name });
      if (currentPlayerIndex === 0) {
        recordBunco(scoringMode);
      }
      if (soundsAndHapticsEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, [lastRollType]);

  useEffect(() => {
    if (phase === 'roundEnd' && roundWinner !== null && lastRollType !== 'bunco') {
      const name = players[roundWinner]?.name ?? 'Winner';
      setCelebration({ type: 'roundWin', winnerName: name });
      if (soundsAndHapticsEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, [phase, roundWinner, lastRollType]);

  const handleRoll = () => {
    if (!canRoll) return;
    setRolling(true);
    setTimeout(() => {
      useGameStore.getState().roll();
      setRolling(false);
    }, 100);
  };

  const handleCelebrationComplete = () => {
    setCelebration(null);
    const state = useGameStore.getState();
    if (state.phase === 'roundEnd') {
      const humanWonRound =
        state.scoringMode === 'individual'
          ? state.roundWinner === 0
          : state.roundWinner === 0 || state.roundWinner === 2;
      recordRoundComplete({
        scoringMode: state.scoringMode,
        humanWonRound,
      });
      state.advanceToNextRound();
    }
  };

  const getScoreForPlayer = (index: number) => {
    if (scoringMode === 'individual') return roundScores[index] ?? 0;
    const teamIdx = index % 2 === 0 ? 0 : 1;
    return teamScores[teamIdx] ?? 0;
  };

  const getRoundWinsForPlayer = (index: number) => {
    if (scoringMode === 'individual') return roundWins[index] ?? 0;
    const teamIdx = index % 2 === 0 ? 0 : 1;
    return teamRoundWins[teamIdx] ?? 0;
  };

  const turnInProgress = useGameStore((s) => s.turnInProgress);
  const canRoll = phase === 'playing' && currentPlayerIndex === 0 && !turnInProgress;

  const playerOrder = [0, 1, 2, 3];
  const southPlayer = players[0];
  const eastPlayer = players[1];
  const northPlayer = players[2];
  const westPlayer = players[3];

  return (
    <View style={styles.container}>
      <View style={styles.table}>
        <View style={styles.tableSurface}>
          <Text style={styles.roundLabel}>
            Round {round} — Rolling for {round}s
          </Text>

          <View style={styles.playersLayout}>
            <View style={styles.northSeat}>
              {northPlayer && (
                <PlayerCard
                  player={northPlayer}
                  score={getScoreForPlayer(2)}
                  roundWins={getRoundWinsForPlayer(2)}
                  isCurrentTurn={currentPlayerIndex === 2}
                  scoringMode={scoringMode}
                  teamLabel={scoringMode === 'team' ? 'Team 2' : undefined}
                />
              )}
            </View>

            <View style={styles.eastWestRow}>
              <View style={styles.westSeat}>
                {westPlayer && (
                  <PlayerCard
                    player={westPlayer}
                    score={getScoreForPlayer(3)}
                    roundWins={getRoundWinsForPlayer(3)}
                    isCurrentTurn={currentPlayerIndex === 3}
                    scoringMode={scoringMode}
                    teamLabel={scoringMode === 'team' ? 'Team 2' : undefined}
                  />
                )}
              </View>
              <View style={styles.diceArea}>
                <Dice values={lastRoll} rolling={rolling} />
                {canRoll && (
                  <TouchableOpacity
                    style={styles.rollButton}
                    onPress={handleRoll}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.rollButtonText}>Roll Dice</Text>
                  </TouchableOpacity>
                )}
                {!canRoll && currentPlayerIndex !== 0 && (
                  <Text style={styles.waitingText}>
                    {players[currentPlayerIndex]?.name}'s turn...
                  </Text>
                )}
              </View>
              <View style={styles.eastSeat}>
                {eastPlayer && (
                  <PlayerCard
                    player={eastPlayer}
                    score={getScoreForPlayer(1)}
                    roundWins={getRoundWinsForPlayer(1)}
                    isCurrentTurn={currentPlayerIndex === 1}
                    scoringMode={scoringMode}
                    teamLabel={scoringMode === 'team' ? 'Team 1' : undefined}
                  />
                )}
              </View>
            </View>

            <View style={styles.southSeat}>
              {southPlayer && (
                <PlayerCard
                  player={southPlayer}
                  score={getScoreForPlayer(0)}
                  roundWins={getRoundWinsForPlayer(0)}
                  isCurrentTurn={currentPlayerIndex === 0}
                  scoringMode={scoringMode}
                  teamLabel={scoringMode === 'team' ? 'Team 1' : undefined}
                />
              )}
            </View>
          </View>
        </View>
      </View>

      <Pressable
        style={styles.menuButton}
        onPress={() => setMenuVisible(true)}
      >
        <Ionicons name="menu" size={28} color={theme.colors.cardBackground} />
      </Pressable>

      {celebration && (
        <BuncoCelebration
          type={celebration.type}
          winnerName={celebration.winnerName}
          onComplete={handleCelebrationComplete}
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
    padding: theme.spacing.md,
    justifyContent: 'center',
  },
  tableSurface: {
    flex: 1,
    backgroundColor: theme.colors.tableFelt,
    borderRadius: 24,
    borderWidth: 8,
    borderColor: theme.colors.tableEdge,
    padding: theme.spacing.lg,
    minHeight: 400,
  },
  roundLabel: {
    fontSize: 18,
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
    alignItems: 'flex-start',
  },
  eastSeat: {
    alignItems: 'flex-end',
  },
  diceArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  rollButton: {
    backgroundColor: theme.colors.accent,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 12,
    marginTop: theme.spacing.lg,
  },
  rollButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  waitingText: {
    fontSize: 14,
    color: theme.colors.cardBackground,
    marginTop: theme.spacing.sm,
  },
  southSeat: {
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  menuButton: {
    position: 'absolute',
    top: 48,
    right: theme.spacing.lg,
    padding: theme.spacing.sm,
  },
});
