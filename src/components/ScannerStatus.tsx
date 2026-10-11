import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../state/AppContext';
import { ACCESSIBILITY_METRICS } from '../constants/theme';
import { CameraGuidanceState } from '../types/guidance';

interface ScannerStatusProps {
  guidance: CameraGuidanceState;
  isPaused: boolean;
  torchActive: boolean;
}

export const ScannerStatus: React.FC<ScannerStatusProps> = ({
  guidance,
  isPaused,
  torchActive,
}) => {
  const { theme, modelStatus } = useApp();

  return (
    <View
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Scanner Status: ${
        isPaused
          ? 'Scanning paused'
          : modelStatus.status === 'READY'
          ? 'Ready to recognize notes'
          : 'Model initializing'
      }. Flashlight is ${torchActive ? 'on' : 'off'}. Lighting is ${guidance.lighting}.`}
      style={[
        styles.container,
        {
          backgroundColor: theme.surfaceElevated,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.dot,
            {
              backgroundColor:
                isPaused
                  ? theme.warning
                  : modelStatus.status === 'READY'
                  ? theme.success
                  : theme.info,
            },
          ]}
        />
        <Text style={[styles.statusText, { color: theme.text }]}>
          {isPaused
            ? 'Scanning Paused'
            : modelStatus.status === 'READY'
            ? 'Offline Model Ready'
            : 'Loading Model...'}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={[styles.metaText, { color: theme.textMuted }]}>
          Torch: {torchActive ? 'ON' : 'OFF'}
        </Text>
        <Text style={[styles.metaText, { color: theme.textMuted }]}>
          Light: {guidance.lighting}
        </Text>
        <Text style={[styles.metaText, { color: theme.textMuted }]}>
          Motion: {guidance.motion}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: ACCESSIBILITY_METRICS.borderRadius,
    borderWidth: 1,
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.sm,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.xs,
    fontWeight: '600',
  },
});
