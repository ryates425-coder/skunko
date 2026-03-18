import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useGameStore } from '../src/stores/gameStore';
import { theme } from '../src/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const [scoringMode, setScoringMode] = useState<'individual' | 'team'>('individual');
  const initGame = useGameStore((s) => s.initGame);
  const loadSoundsAndHaptics = useGameStore((s) => s.loadSoundsAndHaptics);

  useEffect(() => {
    loadSoundsAndHaptics();
  }, [loadSoundsAndHaptics]);

  const handleNewGame = () => {
    initGame(scoringMode);
    router.push('/game');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.title}>Bunco</Text>
      <Text style={styles.subtitle}>Roll the dice. Score 21 to win the round.</Text>

      <View style={styles.modeSection}>
        <Text style={styles.modeLabel}>Scoring mode</Text>
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              scoringMode === 'individual' && styles.modeButtonActive,
            ]}
            onPress={() => setScoringMode('individual')}
          >
            <Text
              style={[
                styles.modeButtonText,
                scoringMode === 'individual' && styles.modeButtonTextActive,
              ]}
            >
              Individual
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, scoringMode === 'team' && styles.modeButtonActive]}
            onPress={() => setScoringMode('team')}
          >
            <Text
              style={[
                styles.modeButtonText,
                scoringMode === 'team' && styles.modeButtonTextActive,
              ]}
            >
              Team
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleNewGame}>
        <Text style={styles.primaryButtonText}>New Game</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push('/stats')}
      >
        <Text style={styles.secondaryButtonText}>Player Stats</Text>
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
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.cardBackground,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 18,
    color: theme.colors.cardBackground,
    opacity: 0.9,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  modeSection: {
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  modeLabel: {
    fontSize: 16,
    color: theme.colors.cardBackground,
    marginBottom: theme.spacing.sm,
  },
  modeRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modeButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeButtonActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.cardBackground,
  },
  modeButtonText: {
    fontSize: 16,
    color: theme.colors.cardBackground,
    opacity: 0.8,
  },
  modeButtonTextActive: {
    color: theme.colors.text,
    opacity: 1,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: theme.colors.accent,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
    minWidth: 200,
  },
  primaryButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
  },
  secondaryButton: {
    paddingVertical: theme.spacing.sm,
  },
  secondaryButtonText: {
    fontSize: 16,
    color: theme.colors.cardBackground,
    textDecorationLine: 'underline',
  },
});
