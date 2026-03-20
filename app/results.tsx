import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGameStore } from '../src/stores/gameStore';
import { recordGameComplete } from '../src/services/stats';
import { theme } from '../src/constants/theme';
import { BuncoCelebration } from '../src/components/BuncoCelebration';

export default function ResultsScreen() {
  const [showGameWinCelebration, setShowGameWinCelebration] = useState(true);
  const recordedRef = useRef(false);
  const router = useRouter();
  const {
    players,
    roundWins,
    teamRoundWins,
    totalGameScores,
    gameWinner,
    scoringMode,
    phase,
  } = useGameStore();

  const isTeam = scoringMode === 'team';
  const winnerIdx = gameWinner ?? -1;
  const humanWon = isTeam
    ? (winnerIdx === 0 && (roundWins[0] ?? 0) > 0) || (winnerIdx === 1 && (teamRoundWins[1] ?? 0) > 0)
    : winnerIdx === 0;

  const getRoundWinsForPlayer = (index: number) => {
    if (!isTeam) return roundWins[index] ?? 0;
    const teamIdx = index % 2 === 0 ? 0 : 1;
    return teamRoundWins[teamIdx] ?? 0;
  };

  const getTotalForPlayer = (index: number) => {
    if (!isTeam) return totalGameScores[index] ?? 0;
    const teamIdx = index % 2 === 0 ? 0 : 1;
    const teamTotal = (totalGameScores[teamIdx * 2] ?? 0) + (totalGameScores[teamIdx * 2 + 1] ?? 0);
    return teamTotal / 2;
  };

  const winnerName =
    winnerIdx >= 0
      ? isTeam
        ? `Team ${winnerIdx + 1} (${players[winnerIdx * 2]?.name} & ${players[winnerIdx * 2 + 1]?.name})`
        : players[winnerIdx]?.name ?? 'Winner'
      : '';

  const humanTotalScore = isTeam
    ? (totalGameScores[0] ?? 0) + (totalGameScores[2] ?? 0)
    : (totalGameScores[0] ?? 0);

  useEffect(() => {
    if (recordedRef.current || phase !== 'gameEnd') return;
    if (winnerIdx < 0) return;
    recordedRef.current = true;
    recordGameComplete({
      scoringMode: scoringMode,
      humanWon: winnerIdx === 0,
      humanTotalScore,
    });
  }, [phase, winnerIdx, scoringMode, humanTotalScore]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {showGameWinCelebration && winnerIdx === 0 && (
        <BuncoCelebration
          type="gameWin"
          winnerName="You"
          onComplete={() => setShowGameWinCelebration(false)}
        />
      )}
      <Text style={styles.title}>
        {winnerIdx >= 0 ? 'Game Over!' : 'Game Ended'}
      </Text>
      {winnerIdx >= 0 && (
        <Text style={styles.winner}>{winnerName} wins!</Text>
      )}

      <View style={styles.scoreboard}>
        {players.map((p, i) => (
          <View
            key={p.id}
            style={[
              styles.row,
              (isTeam ? Math.floor(i / 2) === winnerIdx : i === winnerIdx) &&
                styles.winnerRow,
            ]}
          >
            <Text style={styles.name}>{p.name}</Text>
            <Text style={styles.wins}>{getRoundWinsForPlayer(i)} wins</Text>
            <Text style={styles.total}>{getTotalForPlayer(i)} pts</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => {
          router.replace('/');
        }}
      >
        <Text style={styles.primaryButtonText}>New Game</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.cardBackground,
    marginBottom: theme.spacing.sm,
  },
  winner: {
    fontSize: 22,
    color: theme.colors.accent,
    marginBottom: theme.spacing.xl,
  },
  scoreboard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  winnerRow: {
    backgroundColor: 'rgba(201, 162, 39, 0.3)',
    marginHorizontal: -theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    marginVertical: 2,
    borderRadius: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.cardBackground,
  },
  wins: {
    fontSize: 14,
    color: theme.colors.cardBackground,
    opacity: 0.9,
  },
  total: {
    fontSize: 14,
    color: theme.colors.cardBackground,
  },
  primaryButton: {
    backgroundColor: theme.colors.accent,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 12,
    minWidth: 200,
  },
  primaryButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
  },
});
