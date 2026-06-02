import { View, Text, Pressable, StyleSheet, Modal, ScrollView } from 'react-native';
import type { Spectator } from '@/lib/presence';
import { COLORS, FONT } from '@/constants/theme';

type Props = {
  visible: boolean;
  viewers: Spectator[];
  onClose: () => void;
};

/** Modal listing every live spectator of the game by name. */
export function ViewerListModal({ visible, viewers, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Tap the backdrop to dismiss; the inner card swallows the press. */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>👁 WATCHING ({viewers.length})</Text>
          <ScrollView style={styles.list}>
            {viewers.length === 0 ? (
              <Text style={styles.empty}>no spectators</Text>
            ) : (
              viewers.map((v) => (
                <Text key={v.userId} style={styles.name}>{v.name}</Text>
              ))
            )}
          </ScrollView>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>CLOSE</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    maxHeight: '60%',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.text,
    borderRadius: 6,
    padding: 16,
  },
  title: {
    color: COLORS.text,
    fontFamily: FONT.monoBold,
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  list: { flexGrow: 0, marginBottom: 12 },
  name: {
    color: COLORS.text,
    fontFamily: FONT.mono,
    fontSize: 13,
    paddingVertical: 4,
  },
  empty: {
    color: COLORS.textMuted,
    fontFamily: FONT.mono,
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  closeBtn: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  closeText: {
    color: COLORS.border,
    fontFamily: FONT.monoBold,
    fontSize: 12,
  },
});
