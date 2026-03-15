import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { theme } from '../constants/theme';

type CelebrationType = 'miniBunco' | 'bunco' | 'roundWin' | 'gameWin';

interface BuncoCelebrationProps {
  type: CelebrationType;
  winnerName?: string;
  onComplete: () => void;
}

export function BuncoCelebration({
  type,
  winnerName,
  onComplete,
}: BuncoCelebrationProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSequence(
      withTiming(1.2, { duration: 200 }),
      withTiming(1, { duration: 100 })
    );

    const duration =
      type === 'miniBunco' ? 800 :
      type === 'gameWin' ? 3000 : 1500;

    const timer = setTimeout(() => {
      opacity.value = withTiming(
        0,
        { duration: 300 },
        (finished) => {
          if (finished) runOnJS(onComplete)();
        }
      );
    }, duration - 300);
    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const label =
    type === 'miniBunco' ? 'Mini Bunco!' :
    type === 'bunco' ? 'BUNCO!' :
    type === 'roundWin' ? `Round Winner!\n${winnerName ?? ''}` :
    type === 'gameWin' ? `Champion!\n${winnerName ?? ''}` : '';

  const isBig = type === 'bunco' || type === 'roundWin' || type === 'gameWin';

  return (
    <Animated.View style={[styles.overlay, animatedStyle]}>
      <View
        style={[
          styles.content,
          isBig && styles.contentBig,
          type === 'bunco' && styles.buncoBg,
          type === 'miniBunco' && styles.miniBuncoBg,
        ]}
      >
        <Text
          style={[
            styles.label,
            isBig && styles.labelBig,
          ]}
          numberOfLines={2}
        >
          {label}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  content: {
    backgroundColor: theme.colors.cardBackground,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 16,
  },
  contentBig: {
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl * 2,
  },
  buncoBg: {
    backgroundColor: theme.colors.bunco,
  },
  miniBuncoBg: {
    backgroundColor: theme.colors.miniBunco,
  },
  label: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
  },
  labelBig: {
    fontSize: 36,
    color: theme.colors.cardBackground,
  },
});
