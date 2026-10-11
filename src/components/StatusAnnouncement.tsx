import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../state/AppContext';
import { ACCESSIBILITY_METRICS } from '../constants/theme';

interface StatusAnnouncementProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export const StatusAnnouncement: React.FC<StatusAnnouncementProps> = ({
  message,
  type = 'info',
}) => {
  const { theme } = useApp();

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return theme.success;
      case 'warning':
        return theme.warning;
      case 'error':
        return theme.error;
      default:
        return theme.info;
    }
  };

  return (
    <View
      accessible={true}
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
      style={[
        styles.container,
        {
          backgroundColor: theme.surfaceElevated,
          borderColor: getBorderColor(),
        },
      ]}
    >
      <Text style={[styles.text, { color: theme.text }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: ACCESSIBILITY_METRICS.borderRadius,
    borderLeftWidth: 6,
    marginVertical: 8,
  },
  text: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.base,
    fontWeight: '600',
    lineHeight: ACCESSIBILITY_METRICS.lineHeight.base,
  },
});
