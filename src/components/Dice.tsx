import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../constants/theme';

const DOUBLE_TAP_MS = 400;

type DieHighlight = 'positive' | 'negative' | 'none';

interface DiceProps {
  values: [number, number, number] | null;
  rolling?: boolean;
  /** Stack dice vertically instead of horizontally */
  vertical?: boolean;
  /** Current round (1–6) for scoring highlight */
  round?: number;
  /** Roll type when dice have landed — determines which dice to highlight */
  lastRollType?: 'normal' | 'miniBunco' | 'bunco' | null;
  /** Called on double-tap of first die (for debug bunco) */
  onDoubleTapDie0?: () => void;
  /** Called on double-tap of second die (for debug mini bunco) */
  onDoubleTapDie1?: () => void;
  /** Called on double-tap of third die (for debug guaranteed scoring roll) */
  onDoubleTapDie2?: () => void;
}

// Dot positions for each die face (1-6), matching Snotzee's physical dice layout
const DOT_POSITIONS: Record<number, string[]> = {
  1: ['center'],
  2: ['top-left', 'bottom-right'],
  3: ['top-left', 'center', 'bottom-right'],
  4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
  5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
  6: ['top-left', 'top-right', 'mid-left', 'mid-right', 'bottom-left', 'bottom-right'],
};

const DIE_SIZE = 60;
const DOT_SIZE = 8;
const DOT_OFFSET = (DIE_SIZE - DOT_SIZE) / 2;

function DieDot({ position }: { position: string }) {
  const posStyles: Record<string, object> = {
    'top-left': { top: 6, left: 6 },
    'top-right': { top: 6, right: 6 },
    'mid-left': { top: DOT_OFFSET, left: 6 },
    'center': { top: DOT_OFFSET, left: DOT_OFFSET },
    'mid-right': { top: DOT_OFFSET, right: 6 },
    'bottom-left': { bottom: 6, left: 6 },
    'bottom-right': { bottom: 6, right: 6 },
  };
  return <View style={[styles.dot, posStyles[position]]} />;
}

// Snotzee-style: 600ms roll, flash interval 60ms, staggered per die (30ms)
const ROLL_DURATION = 600;
const FLASH_INTERVAL = 60;

function randomDie() {
  return Math.floor(Math.random() * 6) + 1;
}

function SingleDie({
  value,
  rolling,
  flashValue,
  delayMs,
  showFinalValue,
  highlight,
}: {
  value: number;
  rolling?: boolean;
  flashValue?: number;
  delayMs?: number;
  /** When true, show final value even if rolling (dice landed after 600ms) */
  showFinalValue?: boolean;
  /** Positive = scoring (green), negative = mini bunco (red) */
  highlight?: DieHighlight;
}) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (rolling) {
      const rollAnim = {
        scale: withSequence(
          withTiming(1.18, { duration: 90 }),
          withTiming(0.88, { duration: 90 }),
          withTiming(1.12, { duration: 90 }),
          withTiming(0.93, { duration: 90 }),
          withTiming(1.05, { duration: 80 }),
          withTiming(0.98, { duration: 78 }),
          withTiming(1, { duration: 72 })
        ),
        rotation: withSequence(
          withTiming(-20, { duration: 90 }),
          withTiming(18, { duration: 90 }),
          withTiming(-14, { duration: 90 }),
          withTiming(10, { duration: 90 }),
          withTiming(-6, { duration: 80 }),
          withTiming(3, { duration: 78 }),
          withTiming(0, { duration: 72 })
        ),
      };
      const delay = delayMs ?? 0;
      scale.value = delay > 0 ? withDelay(delay, rollAnim.scale) : rollAnim.scale;
      rotation.value = delay > 0 ? withDelay(delay, rollAnim.rotation) : rollAnim.rotation;
    }
  }, [rolling, delayMs]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  // When rolling and not yet landed, show flashValue; otherwise show final value
  const displayValue = rolling && !showFinalValue && flashValue !== undefined ? flashValue : value;
  const positions = DOT_POSITIONS[displayValue] ?? DOT_POSITIONS[1];

  const highlightStyle =
    highlight === 'positive'
      ? styles.diePositive
      : highlight === 'negative'
        ? styles.dieNegative
        : undefined;

  return (
    <Animated.View style={[styles.die, highlightStyle, animatedStyle]}>
      {positions.map((pos) => (
        <DieDot key={pos} position={pos} />
      ))}
    </Animated.View>
  );
}

/** 60ms after roll result arrives — dice have visually settled. Show highlight even if rolling stays true (human scoring). */
const HIGHLIGHT_AFTER_SETTLE_MS = 60;

function getDieHighlight(
  index: number,
  values: [number, number, number],
  round: number | undefined,
  lastRollType: 'normal' | 'miniBunco' | 'bunco' | null | undefined,
  rolling: boolean,
  diceSettledForHighlight: boolean
): DieHighlight {
  const canShowHighlight = !rolling || diceSettledForHighlight;
  if (!canShowHighlight || round === undefined || lastRollType === null || lastRollType === undefined) {
    return 'none';
  }
  if (lastRollType === 'miniBunco' || lastRollType === 'bunco') {
    return 'negative';
  }
  return values[index] === round ? 'positive' : 'none';
}

export function Dice({
  values,
  rolling,
  vertical,
  round,
  lastRollType,
  onDoubleTapDie0,
  onDoubleTapDie1,
  onDoubleTapDie2,
}: DiceProps) {
  const [flashValues, setFlashValues] = useState<[number, number, number]>([
    1, 1, 1,
  ]);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [settledForHighlight, setSettledForHighlight] = useState(false);
  const lastTap = useRef<{ time: number; index: number }>({ time: 0, index: -1 });

  // Show highlight 60ms after dice land, even if rolling stays true (human scoring)
  useEffect(() => {
    if (!values || lastRollType == null || round == null || !rolling) {
      setSettledForHighlight(false);
      return;
    }
    const id = setTimeout(() => setSettledForHighlight(true), HIGHLIGHT_AFTER_SETTLE_MS);
    return () => {
      clearTimeout(id);
      setSettledForHighlight(false);
    };
  }, [values, lastRollType, round, rolling]);

  useEffect(() => {
    if (!rolling) {
      setAnimationComplete(false);
      return;
    }
    setAnimationComplete(false);
    setFlashValues([randomDie(), randomDie(), randomDie()]);
    const id = setInterval(() => {
      setFlashValues([randomDie(), randomDie(), randomDie()]);
    }, FLASH_INTERVAL);
    const stop = setTimeout(() => {
      clearInterval(id);
      setAnimationComplete(true);
    }, ROLL_DURATION);
    return () => {
      clearInterval(id);
      clearTimeout(stop);
    };
  }, [rolling]);

  const handleDiePress = (index: 0 | 1 | 2) => {
    const callback = index === 0 ? onDoubleTapDie0 : index === 1 ? onDoubleTapDie1 : onDoubleTapDie2;
    if (!callback) return;
    const now = Date.now();
    const prev = lastTap.current;
    if (prev.index === index && now - prev.time < DOUBLE_TAP_MS) {
      callback();
      lastTap.current = { time: 0, index: -1 };
    } else {
      lastTap.current = { time: now, index };
    }
  };

  const containerStyle = vertical
    ? [styles.container, styles.containerVertical]
    : styles.container;

  const wrapDie = (index: 0 | 1 | 2, content: React.ReactNode) => {
    const callback = index === 0 ? onDoubleTapDie0 : index === 1 ? onDoubleTapDie1 : onDoubleTapDie2;
    if (callback) {
      return (
        <Pressable onPress={() => handleDiePress(index)} style={styles.dieWrap}>
          {content}
        </Pressable>
      );
    }
    return content;
  };

  if (!values) {
    return (
      <View style={containerStyle}>
        <View style={[styles.die, styles.placeholderDie]}>
          <DieDot position="center" />
        </View>
        <View style={[styles.die, styles.placeholderDie]}>
          <DieDot position="center" />
        </View>
        <View style={[styles.die, styles.placeholderDie]}>
          <DieDot position="center" />
        </View>
      </View>
    );
  }

  const die0Highlight = getDieHighlight(0, values, round, lastRollType ?? null, rolling, settledForHighlight);
  const die1Highlight = getDieHighlight(1, values, round, lastRollType ?? null, rolling, settledForHighlight);
  const die2Highlight = getDieHighlight(2, values, round, lastRollType ?? null, rolling, settledForHighlight);

  return (
    <View style={containerStyle}>
      {wrapDie(
        0,
        <SingleDie
          value={values[0]}
          rolling={rolling}
          flashValue={flashValues[0]}
          delayMs={0}
          showFinalValue={animationComplete}
          highlight={die0Highlight}
        />
      )}
      {wrapDie(
        1,
        <SingleDie
          value={values[1]}
          rolling={rolling}
          flashValue={flashValues[1]}
          delayMs={30}
          showFinalValue={animationComplete}
          highlight={die1Highlight}
        />
      )}
      {wrapDie(
        2,
        <SingleDie
          value={values[2]}
          rolling={rolling}
          flashValue={flashValues[2]}
          delayMs={60}
          showFinalValue={animationComplete}
          highlight={die2Highlight}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerVertical: {
    flexDirection: 'column',
  },
  die: {
    width: DIE_SIZE,
    height: DIE_SIZE,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#aaaaaa',
    position: 'relative',
  },
  diePositive: {
    borderColor: '#22c55e',
    backgroundColor: '#dcfce7',
  },
  dieNegative: {
    borderColor: theme.colors.bunco,
    backgroundColor: '#fee2e2',
  },
  placeholderDie: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: '#111111',
  },
  dieWrap: {
    alignSelf: 'center',
  },
});
