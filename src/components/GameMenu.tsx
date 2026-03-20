import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '../stores/gameStore';
import { theme } from '../constants/theme';

interface GameMenuProps {
  visible: boolean;
  onClose: () => void;
}

export function GameMenu({ visible, onClose }: GameMenuProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const soundsAndHapticsEnabled = useGameStore((s) => s.soundsAndHapticsEnabled);
  const setSoundsAndHapticsEnabled = useGameStore(
    (s) => s.setSoundsAndHapticsEnabled
  );
  const initGame = useGameStore((s) => s.initGame);
  const restartGame = useGameStore((s) => s.restartGame);
  const restartRound = useGameStore((s) => s.restartRound);
  const endGameEarly = useGameStore((s) => s.endGameEarly);
  const scoringMode = useGameStore((s) => s.scoringMode);
  const debuggerDiceEnabled = useGameStore((s) => s.debuggerDiceEnabled);
  const setDebuggerDiceEnabled = useGameStore((s) => s.setDebuggerDiceEnabled);

  const handleStartNewGame = () => {
    onClose();
    router.replace('/');
  };

  const handleRestartGame = () => {
    onClose();
    restartGame();
  };

  const handleRestartRound = () => {
    onClose();
    restartRound();
  };

  const handleEndGame = () => {
    onClose();
    endGameEarly();
    router.replace('/results');
  };

  const handleShowStats = () => {
    onClose();
    router.push('/stats');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.menu, { paddingBottom: Math.max(48, insets.bottom + 24) }]} onStartShouldSetResponder={() => true}>
          <Text style={styles.menuTitle}>Menu</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleStartNewGame}
          >
            <Text style={styles.menuItemText}>Start a new game</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleRestartGame}
          >
            <Text style={styles.menuItemText}>Restart the current game</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleRestartRound}
          >
            <Text style={styles.menuItemText}>Restart the round</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleEndGame}
          >
            <Text style={styles.menuItemText}>End the game</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleShowStats}
          >
            <Text style={styles.menuItemText}>Show Player Stats</Text>
          </TouchableOpacity>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Sounds and haptics</Text>
            <Switch
              value={soundsAndHapticsEnabled}
              onValueChange={setSoundsAndHapticsEnabled}
              trackColor={{
                false: theme.colors.textMuted,
                true: theme.colors.accent,
              }}
              thumbColor={theme.colors.cardBackground}
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>
              Debugger Dice {debuggerDiceEnabled ? 'on' : 'off'}
            </Text>
            <Switch
              value={debuggerDiceEnabled}
              onValueChange={setDebuggerDiceEnabled}
              trackColor={{
                false: theme.colors.textMuted,
                true: theme.colors.accent,
              }}
              thumbColor={theme.colors.cardBackground}
            />
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menu: {
    backgroundColor: theme.colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: theme.spacing.xl,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  menuItem: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemText: {
    fontSize: 18,
    color: theme.colors.text,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  toggleLabel: {
    fontSize: 18,
    color: theme.colors.text,
  },
  closeButton: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
