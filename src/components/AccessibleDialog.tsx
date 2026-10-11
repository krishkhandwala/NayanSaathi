import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { useApp } from '../state/AppContext';
import { AccessibleButton } from './AccessibleButton';
import { ACCESSIBILITY_METRICS } from '../constants/theme';

interface AccessibleDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export const AccessibleDialog: React.FC<AccessibleDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isDestructive = false,
}) => {
  const { theme } = useApp();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      accessible={true}
      accessibilityViewIsModal={true}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: theme.text }]}
          >
            {title}
          </Text>
          <Text style={[styles.message, { color: theme.textSecondary }]}>
            {message}
          </Text>

          <View style={styles.actions}>
            <AccessibleButton
              label={cancelLabel}
              onPress={onCancel}
              variant="secondary"
              style={styles.btn}
            />
            <AccessibleButton
              label={confirmLabel}
              onPress={onConfirm}
              variant={isDestructive ? 'danger' : 'primary'}
              style={styles.btn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: ACCESSIBILITY_METRICS.borderRadius * 2,
    borderWidth: 2,
    padding: 24,
  },
  title: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.xl,
    fontWeight: '800',
    marginBottom: 12,
  },
  message: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.base,
    lineHeight: ACCESSIBILITY_METRICS.lineHeight.base,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  btn: {
    flex: 1,
  },
});
