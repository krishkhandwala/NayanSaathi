import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import { useApp } from '../state/AppContext';
import { AccessibleButton } from '../components/AccessibleButton';
import { SUPPORTED_LANGUAGES } from '../constants/languages';
import { SupportedLanguage } from '../types/settings';
import { t } from '../localization/i18n';
import { ACCESSIBILITY_METRICS } from '../constants/theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const { theme, preferences, updatePreferences, changeLanguage, announce } = useApp();
  const [step, setStep] = useState<number>(1);
  const [permission, requestPermission] = useCameraPermissions();

  const handleNextStep = () => {
    if (step < 4) {
      const nextStep = step + 1;
      setStep(nextStep);
      if (nextStep === 2) {
        announce(
          `${t('onboarding_tutorial_title')}. ${t('onboarding_tutorial_step1')} ${t('onboarding_tutorial_step2')}`,
          'HIGH'
        );
      } else if (nextStep === 3) {
        announce(t('onboarding_lang_title'), 'HIGH');
      } else if (nextStep === 4) {
        announce(t('onboarding_perm_title'), 'HIGH');
      }
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    await updatePreferences({ onboardingCompleted: true });
    announce('Setup complete. Welcome to NayanSaathi.', 'HIGH');
    router.replace('/');
  };

  const handleLanguageSelect = (lang: SupportedLanguage) => {
    changeLanguage(lang);
  };

  const handleGrantCamera = async () => {
    await requestPermission();
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
      accessible={true}
    >
      <View style={styles.stepIndicator}>
        <Text style={[styles.stepText, { color: theme.accent }]}>
          Step {step} of 4
        </Text>
      </View>

      {/* Screen 1: Welcome */}
      {step === 1 && (
        <View style={styles.stepContent}>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: theme.text }]}
          >
            {t('onboarding_welcome_title')}
          </Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            {t('onboarding_welcome_desc')}
          </Text>
          <Text style={[styles.highlightBox, { color: theme.accent, backgroundColor: theme.surfaceElevated }]}>
            ✓ 100% Offline Processing{'\n'}
            ✓ No accounts or data collection{'\n'}
            ✓ Built for TalkBack and VoiceOver
          </Text>
        </View>
      )}

      {/* Screen 2: Audio Tutorial */}
      {step === 2 && (
        <View style={styles.stepContent}>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: theme.text }]}
          >
            {t('onboarding_tutorial_title')}
          </Text>
          <View style={styles.tutorialList}>
            <Text style={[styles.tutorialItem, { color: theme.text }]}>
              1. {t('onboarding_tutorial_step1')}
            </Text>
            <Text style={[styles.tutorialItem, { color: theme.text }]}>
              2. {t('onboarding_tutorial_step2')}
            </Text>
            <Text style={[styles.tutorialItem, { color: theme.text }]}>
              3. {t('onboarding_tutorial_step3')}
            </Text>
            <Text style={[styles.tutorialItem, { color: theme.text }]}>
              4. {t('onboarding_tutorial_step4')}
            </Text>
          </View>
        </View>
      )}

      {/* Screen 3: Language Selection */}
      {step === 3 && (
        <View style={styles.stepContent}>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: theme.text }]}
          >
            {t('onboarding_lang_title')}
          </Text>
          <View style={styles.langList}>
            {(Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[]).map((code) => {
              const lang = SUPPORTED_LANGUAGES[code];
              const isSelected = preferences.preferredLanguage === code;
              return (
                <AccessibleButton
                  key={code}
                  label={`${lang.nativeName} (${lang.name})`}
                  onPress={() => handleLanguageSelect(code)}
                  variant={isSelected ? 'primary' : 'secondary'}
                />
              );
            })}
          </View>
        </View>
      )}

      {/* Screen 4: Permissions */}
      {step === 4 && (
        <View style={styles.stepContent}>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: theme.text }]}
          >
            {t('onboarding_perm_title')}
          </Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            {t('onboarding_perm_desc')}
          </Text>

          <View style={styles.permissionActionBox}>
            <AccessibleButton
              label={
                permission?.granted
                  ? 'Camera Permission Granted ✓'
                  : t('onboarding_grant_camera')
              }
              onPress={handleGrantCamera}
              variant={permission?.granted ? 'secondary' : 'primary'}
              disabled={permission?.granted}
            />
          </View>
        </View>
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <AccessibleButton
          label={step === 4 ? t('onboarding_get_started') : 'Continue'}
          onPress={handleNextStep}
          variant="primary"
          style={styles.continueBtn}
        />
        {step < 4 && (
          <AccessibleButton
            label="Skip Tutorial"
            onPress={completeOnboarding}
            variant="outline"
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  stepIndicator: {
    marginTop: 40,
    marginBottom: 16,
  },
  stepText: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.sm,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  stepContent: {
    flex: 1,
  },
  title: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.xxl,
    fontWeight: '900',
    marginBottom: 16,
    lineHeight: ACCESSIBILITY_METRICS.lineHeight.xxl,
  },
  body: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.base,
    lineHeight: ACCESSIBILITY_METRICS.lineHeight.base,
    marginBottom: 20,
  },
  highlightBox: {
    padding: 20,
    borderRadius: ACCESSIBILITY_METRICS.borderRadius,
    fontSize: ACCESSIBILITY_METRICS.fontSize.base,
    lineHeight: 28,
    fontWeight: '600',
  },
  tutorialList: {
    gap: 16,
  },
  tutorialItem: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.base,
    lineHeight: ACCESSIBILITY_METRICS.lineHeight.base,
    fontWeight: '600',
  },
  langList: {
    gap: 8,
  },
  permissionActionBox: {
    marginTop: 16,
  },
  bottomNav: {
    marginTop: 32,
    gap: 10,
  },
  continueBtn: {
    minHeight: 58,
  },
});
