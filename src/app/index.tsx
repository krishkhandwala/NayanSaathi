import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useApp } from '../state/AppContext';
import { AccessibleButton } from '../components/AccessibleButton';
import { WalletSummary } from '../components/WalletSummary';
import { StatusAnnouncement } from '../components/StatusAnnouncement';
import { t } from '../localization/i18n';
import { ACCESSIBILITY_METRICS } from '../constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { preferences, theme, modelStatus, announce } = useApp();

  useEffect(() => {
    if (preferences.onboardingCompleted) {
      announce(
        `${t('app_name')}. ${t('home_wallet_heading')}.`,
        'NORMAL'
      );
    }
  }, [preferences.onboardingCompleted]);

  // If onboarding not completed, safely redirect via Expo Router component
  if (!preferences.onboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
      accessible={true}
    >
      {/* App Header Banner */}
      <View style={styles.header}>
        <Text
          accessibilityRole="header"
          style={[styles.appName, { color: theme.text }]}
        >
          {t('app_name')}
        </Text>
        <Text style={[styles.tagline, { color: theme.textSecondary }]}>
          {t('app_tagline')}
        </Text>
      </View>

      {/* Model & Offline Status Badge */}
      <StatusAnnouncement
        message={
          modelStatus.status === 'READY'
            ? t('model_ready')
            : t('model_missing')
        }
        type={modelStatus.status === 'READY' ? 'success' : 'warning'}
      />

      {/* Primary Action: START SCANNING NOTES */}
      <AccessibleButton
        label={t('home_start_scan')}
        accessibilityHint={t('home_start_scan_hint')}
        onPress={() => router.push('/scanner')}
        variant="primary"
        style={styles.scanButton}
        textStyle={styles.scanButtonText}
      />

      {/* Current Wallet Summary */}
      <WalletSummary />

      {/* Secondary Actions Grid */}
      <View style={styles.buttonStack}>
        <AccessibleButton
          label={t('nav_wallet')}
          accessibilityHint="View recent additions, undo last note, or clear wallet"
          onPress={() => router.push('/wallet')}
          variant="secondary"
        />

        <AccessibleButton
          label={t('nav_split')}
          accessibilityHint="Divide current cash total among 2 to 20 people"
          onPress={() => router.push('/split-cash')}
          variant="secondary"
        />

        <AccessibleButton
          label={t('nav_help')}
          accessibilityHint="Learn voice commands and accessibility shortcuts"
          onPress={() => router.push('/help')}
          variant="secondary"
        />

        <AccessibleButton
          label={t('nav_settings')}
          accessibilityHint="Adjust language, high contrast, and haptic feedback"
          onPress={() => router.push('/settings')}
          variant="outline"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
  },
  header: {
    marginBottom: 12,
  },
  appName: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.xxl,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.sm,
    fontWeight: '500',
    marginTop: 4,
  },
  scanButton: {
    minHeight: 64,
    marginVertical: 14,
    borderRadius: ACCESSIBILITY_METRICS.borderRadius * 1.5,
  },
  scanButtonText: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.lg,
    fontWeight: '800',
  },
  buttonStack: {
    marginTop: 8,
    gap: 8,
  },
});
