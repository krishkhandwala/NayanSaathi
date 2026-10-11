import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CameraGuidanceState } from '../types/guidance';
import { useApp } from '../state/AppContext';
import { ACCESSIBILITY_METRICS } from '../constants/theme';
import { t } from '../localization/i18n';

interface CameraGuidanceOverlayProps {
  guidance: CameraGuidanceState;
}

export const CameraGuidanceOverlay: React.FC<CameraGuidanceOverlayProps> = ({
  guidance,
}) => {
  const { theme } = useApp();

  const getPromptMessage = () => {
    switch (guidance.currentPrompt) {
      case 'MOVE_CENTER':
        return t('guidance_move_center');
      case 'MOVE_FARTHER':
        return t('guidance_move_farther');
      case 'MOVE_CLOSER':
        return t('guidance_move_closer');
      case 'HOLD_STEADY':
        return t('guidance_hold_steady');
      case 'TOO_DARK':
        return t('guidance_too_dark');
      case 'FLATTEN_NOTE':
        return t('guidance_flatten_note');
      case 'SEPARATE_NOTES':
        return t('guidance_separate_notes');
      default:
        return t('scanner_status_ready');
    }
  };

  return (
    <View pointerEvents="none" style={styles.overlay}>
      {/* High contrast viewfinder target box */}
      <View
        style={[
          styles.viewfinder,
          {
            borderColor: guidance.currentPrompt ? theme.warning : theme.accent,
          },
        ]}
      />

      {/* Prominent spoken prompt display */}
      <View
        style={[
          styles.promptBanner,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <Text
          accessible={false} // AudioFeedbackService handles speech
          style={[styles.promptText, { color: theme.text }]}
        >
          {getPromptMessage()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    width: '80%',
    height: 180,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderRadius: ACCESSIBILITY_METRICS.borderRadius * 2,
    marginBottom: 40,
  },
  promptBanner: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: ACCESSIBILITY_METRICS.borderRadius,
    borderWidth: 2,
    alignItems: 'center',
  },
  promptText: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.base,
    fontWeight: '700',
    textAlign: 'center',
  },
});
