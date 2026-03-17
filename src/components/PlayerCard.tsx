import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../constants/theme';
import type { Player } from '../game/types';

const PULSE_DURATION = 2000;
const PULSE_SCALE = 1.2;

interface PlayerCardProps {
  player: Player;
  score: number;
  roundWins: number;
  isCurrentTurn: boolean;
  scoringMode: 'individual' | 'team';
  teamLabel?: string;
}

export function PlayerCard({
  player,
  score,
  roundWins,
  isCurrentTurn,
  scoringMode,
  teamLabel,
}: PlayerCardProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isCurrentTurn) {
      scale.value = withRepeat(
        withSequence(
          withTiming(PULSE_SCALE, { duration: PULSE_DURATION / 2 }),
          withTiming(1, { duration: PULSE_DURATION / 2 })
        ),
        -1,
        true
      );
    } else {
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [isCurrentTurn]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        isCurrentTurn && styles.currentTurn,
        animatedStyle,
      ]}
    >
      <Text style={styles.name} numberOfLines={1}>
        {player.name}
      </Text>
      <Text style={styles.score}>{score}</Text>
      <Text style={styles.roundWins}>
        {roundWins} {roundWins === 1 ? 'win' : 'wins'}
      </Text>
      {scoringMode === 'team' && teamLabel && (
        <Text style={styles.teamLabel}>{teamLabel}</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 12,
    padding: theme.spacing.md,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  currentTurn: {
    borderColor: theme.colors.accent,
    borderWidth: 3,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    fontVariant: ['tabular-nums'],
  },
  roundWins: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  teamLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
});
