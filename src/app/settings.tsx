import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useApp } from '../state/AppContext';
import { AccessibleButton } from '../components/AccessibleButton';
import { StatusAnnouncement } from '../components/StatusAnnouncement';
import { SUPPORTED_LANGUAGES } from '../constants/languages';
import { SupportedLanguage } from '../types/settings';
import { t } from '../localization/i18n';
import { ACCESSIBILITY_METRICS } from '../constants/theme';

export default function SettingsScreen() {
  const { preferences, theme, modelStatus, updatePreferences, changeLanguage } = useApp();

  const handleLanguageSelect = (lang: SupportedLanguage) => {
    changeLanguage(lang);
  };

  const toggleHighContrast = (val: boolean) => {
    updatePreferences({ highContrastEnabled: val });
  };

  const toggleHaptics = (val: boolean) => {
    updatePreferences({ hapticsEnabled: val });
  };

  const adjustSpeechRate = (delta: number) => {
    const newRate = Math.round((preferences.speechRate + delta) * 10) / 10;
    if (newRate >= 0.7 && newRate <= 1.4) {
      updatePreferences({ speechRate: newRate });
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
      accessible={true}
    >
      {/* Language Section */}
      <Text
        accessibilityRole="header"
        style={[styles.sectionTitle, { color: theme.text }]}
      >
        {t('settings_language')}
      </Text>

      <View style={styles.langGrid}>
        {(Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[]).map((code) => {
          const lang = SUPPORTED_LANGUAGES[code];
          const isSelected = preferences.preferredLanguage === code;

          return (
            <AccessibleButton
              key={code}
              label={`${lang.nativeName} (${lang.name})`}
              accessibilityHint={`Select ${lang.name} as application voice and text language`}
              onPress={() => handleLanguageSelect(code)}
              variant={isSelected ? 'primary' : 'secondary'}
              style={styles.langBtn}
            />
          );
        })}
      </View>

      {/* Accessibility Section */}
      <Text
        accessibilityRole="header"
        style={[styles.sectionTitle, { color: theme.text }]}
      >
        Accessibility & Feedback
      </Text>

      {/* High Contrast Toggle */}
      <View
        accessible={true}
        accessibilityRole="switch"
        accessibilityLabel={`${t('settings_high_contrast')}: ${preferences.highContrastEnabled ? 'Enabled' : 'Disabled'}`}
        style={[
          styles.settingRow,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.settingLabel, { color: theme.text }]}>
          {t('settings_high_contrast')}
        </Text>
        <Switch
          value={preferences.highContrastEnabled}
          onValueChange={toggleHighContrast}
          trackColor={{ false: theme.border, true: theme.accent }}
        />
      </View>

      {/* Haptics Toggle */}
      <View
        accessible={true}
        accessibilityRole="switch"
        accessibilityLabel={`${t('settings_haptics')}: ${preferences.hapticsEnabled ? 'Enabled' : 'Disabled'}`}
        style={[
          styles.settingRow,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.settingLabel, { color: theme.text }]}>
          {t('settings_haptics')}
        </Text>
        <Switch
          value={preferences.hapticsEnabled}
          onValueChange={toggleHaptics}
          trackColor={{ false: theme.border, true: theme.accent }}
        />
      </View>

      {/* Speech Rate Controls */}
      <View
        accessible={true}
        accessibilityRole="adjustable"
        accessibilityLabel={`Speech speed: ${preferences.speechRate} times normal rate`}
        style={[
          styles.settingRow,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.settingLabel, { color: theme.text }]}>
          {t('settings_speech_rate')}: {preferences.speechRate}x
        </Text>
        <View style={styles.stepperMini}>
          <AccessibleButton
            label="-"
            onPress={() => adjustSpeechRate(-0.1)}
            variant="secondary"
            style={styles.miniBtn}
            disabled={preferences.speechRate <= 0.7}
          />
          <AccessibleButton
            label="+"
            onPress={() => adjustSpeechRate(0.1)}
            variant="secondary"
            style={styles.miniBtn}
            disabled={preferences.speechRate >= 1.4}
          />
        </View>
      </View>

      {/* ML Model Status */}
      <Text
        accessibilityRole="header"
        style={[styles.sectionTitle, { color: theme.text }]}
      >
        {t('settings_model_status')}
      </Text>

      <StatusAnnouncement
        message={`Model: ${modelStatus.version} | Quantization: ${
          modelStatus.isQuantized ? 'INT8' : 'FP32'
        } | Acceleration: ${modelStatus.accelerationMode}`}
        type={modelStatus.status === 'READY' ? 'success' : 'warning'}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.lg,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 12,
  },
  langGrid: {
    gap: 8,
    marginBottom: 16,
  },
  langBtn: {
    justifyContent: 'flex-start',
    paddingLeft: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: ACCESSIBILITY_METRICS.borderRadius,
    borderWidth: 1,
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.base,
    fontWeight: '600',
  },
  stepperMini: {
    flexDirection: 'row',
    gap: 8,
  },
  miniBtn: {
    width: 48,
    height: 48,
    paddingHorizontal: 0,
    paddingVertical: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
