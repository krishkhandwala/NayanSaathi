import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useApp } from '../state/AppContext';
import { AccessibleButton } from '../components/AccessibleButton';
import { WalletSummary } from '../components/WalletSummary';
import { t, formatRupees } from '../localization/i18n';
import { SplitResult } from '../types/wallet';
import { ACCESSIBILITY_METRICS } from '../constants/theme';

export default function SplitCashScreen() {
  const { theme, walletTotal, splitCash } = useApp();
  const [numPeople, setNumPeople] = useState<number>(3);
  const [splitResult, setSplitResult] = useState<SplitResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const incrementPeople = () => {
    if (numPeople < 20) {
      setNumPeople((prev) => prev + 1);
      setSplitResult(null);
      setErrorMessage(null);
    }
  };

  const decrementPeople = () => {
    if (numPeople > 2) {
      setNumPeople((prev) => prev - 1);
      setSplitResult(null);
      setErrorMessage(null);
    }
  };

  const handleCalculate = () => {
    try {
      setErrorMessage(null);
      const res = splitCash(numPeople);
      setSplitResult(res);
    } catch (err: any) {
      setErrorMessage(err.message || t('split_zero_wallet_error'));
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
      <WalletSummary />

      <Text style={[styles.desc, { color: theme.textSecondary }]}>
        {t('split_desc', { total: walletTotal })}
      </Text>

      {/* Stepper for number of people (2 to 20) */}
      <View
        accessible={true}
        accessibilityRole="adjustable"
        accessibilityLabel={`${t('split_num_people')}: ${numPeople}`}
        accessibilityHint="Use increase and decrease buttons to select between 2 and 20 people"
        style={[
          styles.stepperContainer,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <Text style={[styles.stepperLabel, { color: theme.text }]}>
          {t('split_num_people')}
        </Text>

        <View style={styles.controlsRow}>
          <AccessibleButton
            label="-"
            accessibilityHint="Decrease number of people"
            onPress={decrementPeople}
            disabled={numPeople <= 2}
            variant="secondary"
            style={styles.stepBtn}
          />

          <Text style={[styles.peopleCount, { color: theme.accent }]}>
            {numPeople}
          </Text>

          <AccessibleButton
            label="+"
            accessibilityHint="Increase number of people"
            onPress={incrementPeople}
            disabled={numPeople >= 20}
            variant="secondary"
            style={styles.stepBtn}
          />
        </View>
      </View>

      <AccessibleButton
        label={t('split_calculate')}
        accessibilityHint="Calculates the integer share and remaining rupees for each person"
        onPress={handleCalculate}
        variant="primary"
        style={styles.calcBtn}
        disabled={walletTotal === 0}
      />

      {/* Error Announcement */}
      {errorMessage && (
        <View
          accessible={true}
          accessibilityRole="alert"
          style={[styles.errorBox, { backgroundColor: theme.surfaceElevated, borderColor: theme.error }]}
        >
          <Text style={[styles.errorText, { color: theme.error }]}>
            {errorMessage}
          </Text>
        </View>
      )}

      {/* Spoken Split Result */}
      {splitResult && (
        <View
          accessible={true}
          accessibilityRole="text"
          accessibilityLiveRegion="assertive"
          style={[
            styles.resultCard,
            {
              backgroundColor: theme.surfaceElevated,
              borderColor: theme.accent,
            },
          ]}
        >
          <Text style={[styles.resultTitle, { color: theme.text }]}>
            Split Summary
          </Text>
          <Text style={[styles.resultDetail, { color: theme.textSecondary }]}>
            Each person receives: <Text style={{ color: theme.accent, fontWeight: '800' }}>{formatRupees(splitResult.shareAmount)}</Text>
          </Text>
          <Text style={[styles.resultDetail, { color: theme.textSecondary }]}>
            Remaining remainder: <Text style={{ color: theme.warning, fontWeight: '800' }}>{formatRupees(splitResult.remainder)}</Text>
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
  },
  desc: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.base,
    marginBottom: 16,
    lineHeight: ACCESSIBILITY_METRICS.lineHeight.base,
  },
  stepperContainer: {
    padding: 20,
    borderRadius: ACCESSIBILITY_METRICS.borderRadius * 1.5,
    borderWidth: 1,
    marginBottom: 20,
  },
  stepperLabel: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.base,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  peopleCount: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.huge,
    fontWeight: '900',
  },
  calcBtn: {
    minHeight: 56,
  },
  errorBox: {
    padding: 16,
    borderRadius: ACCESSIBILITY_METRICS.borderRadius,
    borderWidth: 2,
    marginTop: 16,
  },
  errorText: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.base,
    fontWeight: '700',
  },
  resultCard: {
    padding: 20,
    borderRadius: ACCESSIBILITY_METRICS.borderRadius * 1.5,
    borderWidth: 2,
    marginTop: 20,
  },
  resultTitle: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.lg,
    fontWeight: '800',
    marginBottom: 10,
  },
  resultDetail: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.base,
    marginVertical: 4,
  },
});
