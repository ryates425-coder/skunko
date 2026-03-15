import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getStats, type PlayerStats } from '../src/services/stats';
import { theme } from '../src/constants/theme';

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString();
}

function StatSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function StatsScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats().then((s) => {
      setStats(s);
      setLoading(false);
    });
  }, []);

  if (loading || !stats) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Player Stats</Text>

      <StatSection title="Individual">
        <Text style={styles.stat}>Games played: {stats.individualGamesPlayed}</Text>
        <Text style={styles.stat}>Games won: {stats.individualGamesWon}</Text>
        <Text style={styles.stat}>Rounds played: {stats.individualRoundsPlayed}</Text>
        <Text style={styles.stat}>Rounds won: {stats.individualRoundsWon}</Text>
        <Text style={styles.stat}>Buncos: {stats.individualBuncosCount}</Text>
        <Text style={styles.stat}>Mini Buncos: {stats.individualMiniBuncosCount}</Text>
        <Text style={styles.subSection}>Top 10 scores</Text>
        {stats.individualHighScores.length === 0 ? (
          <Text style={styles.muted}>No scores yet</Text>
        ) : (
          stats.individualHighScores.map((s, i) => (
            <Text key={i} style={styles.scoreRow}>
              {i + 1}. {s.score} pts — {formatDate(s.createdAt)}
            </Text>
          ))
        )}
      </StatSection>

      <StatSection title="Team">
        <Text style={styles.stat}>Games played: {stats.teamGamesPlayed}</Text>
        <Text style={styles.stat}>Games won: {stats.teamGamesWon}</Text>
        <Text style={styles.stat}>Rounds played: {stats.teamRoundsPlayed}</Text>
        <Text style={styles.stat}>Rounds won: {stats.teamRoundsWon}</Text>
        <Text style={styles.stat}>Buncos: {stats.teamBuncosCount}</Text>
        <Text style={styles.stat}>Mini Buncos: {stats.teamMiniBuncosCount}</Text>
        <Text style={styles.subSection}>Top 10 scores</Text>
        {stats.teamHighScores.length === 0 ? (
          <Text style={styles.muted}>No scores yet</Text>
        ) : (
          stats.teamHighScores.map((s, i) => (
            <Text key={i} style={styles.scoreRow}>
              {i + 1}. {s.score} pts — {formatDate(s.createdAt)}
            </Text>
          ))
        )}
      </StatSection>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  content: {
    padding: theme.spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.cardBackground,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  section: {
    marginBottom: theme.spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.accent,
    marginBottom: theme.spacing.md,
  },
  stat: {
    fontSize: 16,
    color: theme.colors.cardBackground,
    marginBottom: theme.spacing.xs,
  },
  subSection: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.cardBackground,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  scoreRow: {
    fontSize: 14,
    color: theme.colors.cardBackground,
    opacity: 0.9,
    marginBottom: 4,
  },
  muted: {
    fontSize: 14,
    color: theme.colors.cardBackground,
    opacity: 0.6,
  },
  backButton: {
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 18,
    color: theme.colors.cardBackground,
    textDecorationLine: 'underline',
  },
});
