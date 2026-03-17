import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { theme } from '../constants/theme';

const HOLD_MS = 1800;
const FADE_IN_MS = 300;
const FADE_OUT_MS = 400;

interface RoundTransitionProps {
  round: number;
  onComplete: () => void;
}

export function RoundTransition({ round, onComplete }: RoundTransitionProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: FADE_IN_MS }),
      withDelay(HOLD_MS, withTiming(0, { duration: FADE_OUT_MS }, (finished) => {
        if (finished) runOnJS(onComplete)();
      }))
    );
  }, [round]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Pressable
      style={styles.overlay}
      onPress={onComplete}
    >
      <Animated.View style={[styles.content, animatedStyle]}>
        <Text style={styles.roundLabel}>Round {round}</Text>
        <Text style={styles.subLabel}>Rolling for {round}s</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  content: {
    paddingVertical: 32,
    paddingHorizontal: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
  },
  roundLabel: {
    fontSize: 48,
    fontWeight: '700',
    color: theme.colors.accent,
    letterSpacing: 2,
  },
  subLabel: {
    fontSize: 18,
    color: theme.colors.cardBackground,
    marginTop: 8,
    opacity: 0.9,
  },
});
