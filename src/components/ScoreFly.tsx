import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { theme } from '../constants/theme';

const FLY_DURATION = 600;

interface ScoreFlyProps {
  points: number;
  playerIndex: number;
  slotRefs: React.RefObject<View>[];
  cardRefs: React.RefObject<View>[];
  containerRef?: React.RefObject<View>;
  onComplete?: () => void;
}

export function ScoreFly({
  points,
  playerIndex,
  slotRefs,
  cardRefs,
  containerRef,
  onComplete,
}: ScoreFlyProps) {
  const [layout, setLayout] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (points === 0) return;

    const slotRef = slotRefs[playerIndex];
    const cardRef = cardRefs[playerIndex];
    if (!slotRef?.current || !cardRef?.current || !containerRef?.current) return;

    const measureAndAnimate = () => {
      containerRef!.current!.measureInWindow((cx, cy) => {
        slotRef!.current!.measureInWindow((sx, sy, sw, sh) => {
          cardRef!.current!.measureInWindow((cx2, cy2, cw, ch) => {
            const halfW = 45;
            const halfH = 28;
            const startX = sx + sw / 2 - halfW - cx;
            const startY = sy + sh / 2 - halfH - cy;
            const endX = cx2 + cw / 2 - halfW - cx;
            const endY = cy2 + ch / 2 - halfH - cy;

            setLayout({ startX, startY, endX, endY });
            translateX.value = startX;
            translateY.value = startY;
            opacity.value = 1;

            translateX.value = withTiming(endX, {
              duration: FLY_DURATION,
              easing: Easing.out(Easing.cubic),
            });
            translateY.value = withTiming(endY, {
              duration: FLY_DURATION,
              easing: Easing.out(Easing.cubic),
            });
            opacity.value = withSequence(
              withTiming(1, { duration: FLY_DURATION * 0.7 }),
              withTiming(0, { duration: FLY_DURATION * 0.3 })
            );
          });
        });
      });
    };

    const t = setTimeout(measureAndAnimate, 50);
    const done = setTimeout(() => onComplete?.(), FLY_DURATION + 50);
    return () => {
      clearTimeout(t);
      clearTimeout(done);
    };
  }, [points, playerIndex]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  if (points === 0 || !layout) return null;

  const isNegative = points < 0;
  return (
    <Animated.View
      style={[styles.overlay, animatedStyle]}
      pointerEvents="none"
    >
      <Text style={[styles.points, isNegative && styles.pointsNegative]}>
        {isNegative ? points : `+${points}`}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 90,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  points: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  pointsNegative: {
    color: '#ff6b6b',
  },
});
