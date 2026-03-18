import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { theme } from '../constants/theme';

const SKUNCO_INSULTS = [
  'Oops! That stunk!',
  'Yikes! That roll really smelled.',
  'P.U.! Better luck next time!',
  'Eww! What was that?!',
  "That's one smelly roll!",
  'Woof! You got skunked!',
  'Rotten luck!',
  "That one's gonna leave a mark!",
  'Better hold your nose for that one!',
  'Skunked again!',
  'That roll went sour!',
  'Someone call the hazmat team!',
  "Whew! That's foul!",
  'Scent-sational failure!',
  'Pepe Le Pew would be proud!',
];

interface SkuncoCelebrationProps {
  type: 'skunco' | 'miniSkunco';
  onComplete: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const DIALOG_MAX_WIDTH = Math.min(screenWidth * 0.85, 320);

export function SkuncoCelebration({ type, onComplete }: SkuncoCelebrationProps) {
  const insult = useMemo(
    () => SKUNCO_INSULTS[Math.floor(Math.random() * SKUNCO_INSULTS.length)],
    []
  );

  const label = type === 'skunco' ? 'Skunco!' : 'Mini Skunco!';

  useEffect(() => {
    const id = setTimeout(onComplete, 2500);
    return () => clearTimeout(id);
  }, [onComplete]);

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={onComplete} />
      <View style={styles.dialog}>
        <View style={styles.dialogInner}>
          <View style={styles.thoughtBubble}>
            <Text style={styles.insult} numberOfLines={2}>
              {insult}
            </Text>
            <View style={styles.bubbleTail} />
          </View>
          <Text style={styles.skuncoEmoji}>🦨</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  dialog: {
    position: 'absolute',
    width: DIALOG_MAX_WIDTH,
    backgroundColor: theme.colors.tableEdge,
    borderRadius: 20,
    borderWidth: 6,
    borderColor: '#3d4a5c',
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  dialogInner: {
    backgroundColor: theme.colors.tableFelt,
    borderRadius: 14,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  thoughtBubble: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 12,
    maxWidth: DIALOG_MAX_WIDTH - 64,
    position: 'relative',
  },
  insult: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bubbleTail: {
    position: 'absolute',
    bottom: -10,
    left: '50%',
    marginLeft: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: theme.colors.cardBackground,
  },
  skuncoEmoji: {
    fontSize: 72,
    marginVertical: 4,
  },
  label: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.cardBackground,
  },
});
