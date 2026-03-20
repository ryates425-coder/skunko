import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useGameStore } from '../stores/gameStore';
import { playCelebrationSound } from '../utils/celebrationSound';
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

// bannerPop: quick pop-in, shorter hold, faster overall
const BANNER_POP_MS = 1800;
const BANNER_POP_PHASE1 = 180;  // pop-in (scale 0.4 → 1.1)
const BANNER_POP_PHASE2 = 120;  // settle (1.1 → 1)
const BANNER_POP_HOLD = 1000;   // hold
const BANNER_POP_EXIT = 500;    // fade out

const CONFETTI_COLORS = ['#ffd700', '#ff6b35', '#a78bfa', '#34d399', '#f472b6', '#60a5fa'];

interface BuncoCelebrationProps {
  type: CelebrationType;
  winnerName?: string;
  onComplete: () => void;
}

function ConfettiPiece({
  left,
  color,
  size,
  circular,
  duration,
  delay,
}: {
  left: number;
  color: string;
  size: number;
  circular: boolean;
  duration: number;
  delay: number;
}) {
  const screenHeight = Dimensions.get('window').height;
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(screenHeight * 1.1, { duration })
    );
    rotate.value = withDelay(delay, withTiming(720, { duration }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.confettiPiece,
        {
          left,
          width: size,
          height: size,
          borderRadius: circular ? size / 2 : 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export function BuncoCelebration({
  type,
  winnerName,
  onComplete,
}: BuncoCelebrationProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.4);
  const soundsAndHapticsEnabled = useGameStore((s) => s.soundsAndHapticsEnabled);

  useEffect(() => {
    if (soundsAndHapticsEnabled) {
      playCelebrationSound();
    }
  }, []); // Play once when celebration appears

  const duration =
    type === 'miniBunco' ? 2000 :
    type === 'gameWin' ? 4000 : BANNER_POP_MS;

  const screenWidth = Dimensions.get('window').width;
  const confettiPieces = useMemo(() => {
    const count = type === 'gameWin' ? 50 : type === 'bunco' ? 40 : 30;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * screenWidth,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 7 + Math.random() * 8,
      circular: Math.random() > 0.5,
      duration: 1800 + Math.random() * 1600,
      delay: Math.random() * 600,
    }));
  }, [type, screenWidth]);

  useEffect(() => {
    const total = duration;
    const phase1 = Math.round(total * 0.15);
    const phase2 = Math.round(total * (0.25 - 0.15));
    const hold = Math.round(total * (0.75 - 0.25));
    const exit = Math.round(total * (1 - 0.75));

    opacity.value = withSequence(
      withTiming(1, { duration: phase1 }),
      withDelay(
        phase2 + hold,
        withTiming(0, { duration: exit }, (finished) => {
          if (finished) runOnJS(onComplete)();
        })
      )
    );
    scale.value = withSequence(
      withTiming(1.1, { duration: phase1 }),
      withTiming(1, { duration: phase2 }),
      withDelay(hold, withTiming(0.8, { duration: exit }))
    );
    return () => {};
  }, [type, duration, onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const label =
    type === 'miniBunco' ? 'Mini Skunko!' :
    type === 'bunco' ? 'SKUNKO!' :
    type === 'roundWin' ? `Round Winner!\n${winnerName ?? ''}` :
    type === 'gameWin' ? `Champion!\n${winnerName ?? ''}` : '';

  const isBig = type === 'bunco' || type === 'roundWin' || type === 'gameWin';

  return (
    <View style={styles.overlay} pointerEvents="none">
      {confettiPieces.map((p) => (
        <ConfettiPiece
          key={p.id}
          left={p.left}
          color={p.color}
          size={p.size}
          circular={p.circular}
          duration={p.duration}
          delay={p.delay}
        />
      ))}
      <View style={styles.bannerCenter}>
        <Animated.View
          style={[
            styles.banner,
            type === 'bunco' && styles.bannerBunco,
            type === 'miniBunco' && styles.bannerMiniBunco,
            animatedStyle,
          ]}
        >
          <Text
            style={[
              styles.bannerTitle,
              isBig && styles.bannerTitleBig,
              type === 'bunco' && styles.bannerTitleBunco,
              type === 'miniBunco' && styles.bannerTitleMiniBunco,
            ]}
            numberOfLines={2}
          >
            {label}
          </Text>
        </Animated.View>
      </View>
    </View>
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
  confettiPiece: {
    position: 'absolute',
    top: -12,
    zIndex: 99,
  },
  bannerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 101,
  },
  banner: {
    paddingVertical: 24,
    paddingHorizontal: 40,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerBunco: {
    backgroundColor: theme.colors.bunco,
  },
  bannerMiniBunco: {
    backgroundColor: theme.colors.miniBunco,
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.05,
    textAlign: 'center',
    color: '#ffd700',
  },
  bannerTitleBig: {
    fontSize: 48,
  },
  bannerTitleBunco: {
    color: '#ffeb3b',
    textShadowColor: 'rgba(255, 215, 0, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  bannerTitleMiniBunco: {
    color: '#1a1a1a',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
});
