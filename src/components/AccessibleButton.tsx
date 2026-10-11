import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ACCESSIBILITY_METRICS } from '../constants/theme';
import { useApp } from '../state/AppContext';
import { hapticsService } from '../services/haptics/HapticsService';

interface AccessibleButtonProps {
  label: string;
  onPress: () => void;
  accessibilityHint?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  label,
  onPress,
  accessibilityHint,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const { theme } = useApp();

  const handlePress = () => {
    if (disabled || loading) return;
    hapticsService.trigger('SELECTION');
    onPress();
  };

  const getBackgroundColor = () => {
    if (disabled) return theme.surfaceElevated;
    switch (variant) {
      case 'primary':
        return theme.accent;
      case 'danger':
        return theme.error;
      case 'secondary':
        return theme.surfaceElevated;
      case 'outline':
        return 'transparent';
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.textMuted;
    switch (variant) {
      case 'primary':
        return theme.accentContrast;
      case 'danger':
        return '#FFFFFF';
      case 'secondary':
        return theme.text;
      case 'outline':
        return theme.accent;
    }
  };

  return (
    <TouchableOpacity
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading }}
      onPress={handlePress}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: variant === 'outline' ? theme.accent : theme.border,
          borderWidth: variant === 'outline' ? 2 : 1,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              { color: getTextColor(), marginLeft: icon ? 8 : 0 },
              textStyle,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: ACCESSIBILITY_METRICS.minTouchTargetSize,
    minWidth: ACCESSIBILITY_METRICS.minTouchTargetSize,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: ACCESSIBILITY_METRICS.borderRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  text: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.base,
    fontWeight: '700',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
});
