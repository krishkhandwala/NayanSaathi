import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useApp } from '../state/AppContext';
import { AccessibleButton } from '../components/AccessibleButton';
import { AccessibleDialog } from '../components/AccessibleDialog';
import { WalletSummary } from '../components/WalletSummary';
import { t, formatRupees } from '../localization/i18n';
import { WalletEntry } from '../types/wallet';
import { ACCESSIBILITY_METRICS } from '../constants/theme';

export default function WalletScreen() {
  const {
    theme,
    walletTotal,
    recentEntries,
    undoLastWalletAddition,
    clearWallet,
    announce,
  } = useApp();

  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const handleUndo = () => {
    undoLastWalletAddition();
  };

  const handleClearConfirm = () => {
    setClearDialogOpen(false);
    clearWallet();
  };

  const renderEntry = ({ item }: { item: WalletEntry }) => {
    const formattedDate = new Date(item.timestamp).toLocaleTimeString();
    return (
      <View
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={`Added ₹${item.totalValue} at ${formattedDate}`}
        style={[
          styles.entryCard,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor: theme.border,
          },
        ]}
      >
        <View>
          <Text style={[styles.entryDenom, { color: theme.text }]}>
            {item.quantity > 1 ? `${item.quantity} × ` : ''}₹{item.denomination}
          </Text>
          <Text style={[styles.entryTime, { color: theme.textMuted }]}>
            {formattedDate}
          </Text>
        </View>
        <Text style={[styles.entryTotal, { color: theme.accent }]}>
          {formatRupees(item.totalValue)}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Wallet Summary */}
      <WalletSummary />

      {/* Wallet Actions */}
      <View style={styles.actionRow}>
        <AccessibleButton
          label="Undo Last Note"
          accessibilityHint="Removes the most recently added banknote from total"
          onPress={handleUndo}
          variant="secondary"
          style={styles.actionBtn}
          disabled={recentEntries.length === 0}
        />

        <AccessibleButton
          label="Clear Wallet"
          accessibilityHint="Clears all cash in the current wallet session after confirmation"
          onPress={() => setClearDialogOpen(true)}
          variant="danger"
          style={styles.actionBtn}
          disabled={walletTotal === 0}
        />
      </View>

      {/* History Header */}
      <Text
        accessibilityRole="header"
        style={[styles.historyHeader, { color: theme.text }]}
      >
        {t('wallet_recent_entries')}
      </Text>

      {recentEntries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            {t('wallet_empty_state')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={recentEntries}
          keyExtractor={(item) => item.entryId}
          renderItem={renderEntry}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Confirmation Dialog for Destructive Clear Action */}
      <AccessibleDialog
        visible={clearDialogOpen}
        title={t('wallet_clear_title')}
        message={t('wallet_clear_prompt', { total: walletTotal })}
        confirmLabel={t('wallet_clear_confirm')}
        cancelLabel={t('wallet_clear_cancel')}
        onConfirm={handleClearConfirm}
        onCancel={() => setClearDialogOpen(false)}
        isDestructive={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
  },
  historyHeader: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.lg,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 12,
  },
  listContainer: {
    paddingBottom: 24,
  },
  entryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: ACCESSIBILITY_METRICS.borderRadius,
    borderWidth: 1,
    marginBottom: 10,
  },
  entryDenom: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.base,
    fontWeight: '700',
  },
  entryTime: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.xs,
    marginTop: 4,
  },
  entryTotal: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.lg,
    fontWeight: '800',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.base,
  },
});
