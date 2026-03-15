import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { theme } from '../constants/theme';

interface DiceProps {
  values: [number, number, number] | null;
  rolling?: boolean;
}

const diceFaces: Record<number, string> = {
  1: '⚀',
  2: '⚁',
  3: '⚂',
  4: '⚃',
  5: '⚄',
  6: '⚅',
};

function SingleDie({ value, rolling }: { value: number; rolling?: boolean }) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (rolling) {
      scale.value = withSequence(
        withTiming(1.2, { duration: 100 }),
        withTiming(0.9, { duration: 100 }),
        withTiming(1, { duration: 150 })
      );
      rotation.value = withSequence(
        withTiming(360, { duration: 400, easing: Easing.out(Easing.cubic) })
      );
    }
  }, [rolling, value]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.die, animatedStyle]}>
      <Text style={styles.dieValue}>{diceFaces[value] || value}</Text>
    </Animated.View>
  );
}

export function Dice({ values, rolling }: DiceProps) {
  if (!values) {
    return (
      <View style={styles.container}>
        <View style={styles.die}>
          <Text style={styles.dieValue}>?</Text>
        </View>
        <View style={styles.die}>
          <Text style={styles.dieValue}>?</Text>
        </View>
        <View style={styles.die}>
          <Text style={styles.dieValue}>?</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SingleDie value={values[0]} rolling={rolling} />
      <SingleDie value={values[1]} rolling={rolling} />
      <SingleDie value={values[2]} rolling={rolling} />
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
  die: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 2,
    borderColor: theme.colors.tableEdge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dieValue: {
    fontSize: 28,
  },
});
