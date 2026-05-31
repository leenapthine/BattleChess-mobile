import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { useState } from 'react';
import { COLORS, FONT } from '@/constants/theme';

type Props = {
  onConcede: () => void;
  disabled?: boolean;
};

export function ConcedeButton({ onConcede, disabled }: Props) {
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <Pressable
        style={[styles.button, disabled && styles.disabled]}
        onPress={() => setConfirming(true)}
        disabled={disabled}
      >
        <Text style={styles.buttonText}>CONCEDE</Text>
      </Pressable>
      <Modal
        visible={confirming}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirming(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>concede game?</Text>
            <Text style={styles.dialogSub}>your opponent will win</Text>
            <View style={styles.row}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setConfirming(false)}
              >
                <Text style={styles.cancelText}>CANCEL</Text>
              </Pressable>
              <Pressable
                style={styles.confirmBtn}
                onPress={() => {
                  setConfirming(false);
                  onConcede();
                }}
              >
                <Text style={styles.confirmText}>CONCEDE</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#ff3333',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  disabled: { opacity: 0.4 },
  buttonText: {
    color: '#ff3333',
    fontFamily: FONT.monoBold,
    fontSize: 12,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  dialog: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    borderRadius: 4,
    width: '100%',
    maxWidth: 320,
  },
  dialogTitle: {
    color: COLORS.text,
    fontFamily: FONT.monoBold,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 4,
  },
  dialogSub: {
    color: COLORS.textMuted,
    fontFamily: FONT.mono,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.textMuted,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  cancelText: {
    color: COLORS.textMuted,
    fontFamily: FONT.monoBold,
    fontSize: 12,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#ff3333',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  confirmText: {
    color: '#000000',
    fontFamily: FONT.monoBold,
    fontSize: 12,
  },
});
