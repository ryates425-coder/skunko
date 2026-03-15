import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import type { Player } from '../game/types';

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
  return (
    <View
      style={[
        styles.container,
        isCurrentTurn && styles.currentTurn,
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
    </View>
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
