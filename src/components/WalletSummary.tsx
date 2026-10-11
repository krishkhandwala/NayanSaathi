import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../state/AppContext';
import { formatRupees, t } from '../localization/i18n';
import { ACCESSIBILITY_METRICS } from '../constants/theme';

export const WalletSummary: React.FC = () => {
  const { walletTotal, confirmedNoteCount, theme } = useApp();

  const formattedAmount = formatRupees(walletTotal);
  const accessibilityDescription =
    walletTotal === 0
      ? t('home_empty_wallet')
      : t('wallet_total_announcement', {
          total: walletTotal,
          count: confirmedNoteCount,
        });

  return (
    <View
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={accessibilityDescription}
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      <Text style={[styles.label, { color: theme.textSecondary }]}>
        {t('home_wallet_heading')}
      </Text>
      <Text style={[styles.amount, { color: theme.accent }]}>
        {formattedAmount}
      </Text>
      <Text style={[styles.notesCount, { color: theme.textMuted }]}>
        {confirmedNoteCount} {confirmedNoteCount === 1 ? 'note' : 'notes'} confirmed
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: ACCESSIBILITY_METRICS.borderRadius * 1.5,
    borderWidth: 2,
    marginVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  amount: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.huge,
    fontWeight: '900',
    marginBottom: 4,
  },
  notesCount: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.base,
    fontWeight: '500',
  },
});
