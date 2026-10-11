import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useApp } from '../state/AppContext';
import { AccessibleButton } from '../components/AccessibleButton';
import { StatusAnnouncement } from '../components/StatusAnnouncement';
import { voiceCommandService } from '../services/speech/VoiceCommandService';
import { t } from '../localization/i18n';
import { ACCESSIBILITY_METRICS } from '../constants/theme';

export default function HelpScreen() {
  const { theme, preferences, announce } = useApp();
  const [testInput, setTestInput] = useState('');
  const [lastParsedResult, setLastParsedResult] = useState<string | null>(null);

  const voiceCommandsList = [
    { cmd: '"Start counting" or "Start scanning"', desc: 'Activates camera recognition' },
    { cmd: '"Stop" or "Pause"', desc: 'Pauses live frame recognition' },
    { cmd: '"What is my total?"', desc: 'Speaks your current cash wallet balance' },
    { cmd: '"Undo last"', desc: 'Removes the last added note from the wallet' },
    { cmd: '"Clear wallet"', desc: 'Prompts to clear current cash total' },
    { cmd: '"Confirm" / "Cancel"', desc: 'Answers confirmation prompts' },
    { cmd: '"Divide by 3" (2–20 people)', desc: 'Calculates cash split and remainder' },
    { cmd: '"Change language"', desc: 'Opens language selection' },
    { cmd: '"Repeat"', desc: 'Repeats the last announcement' },
    { cmd: '"What can I say?"', desc: 'Speaks available voice commands' },
  ];

  const handleTestCommand = () => {
    if (!testInput.trim()) return;
    const parsed = voiceCommandService.parseCommand(testInput);
    const resultMsg = `Matched Intent: ${parsed.intent}${
      parsed.numericArg ? ` (Arg: ${parsed.numericArg})` : ''
    } | Confidence: ${Math.round(parsed.confidence * 100)}%`;
    setLastParsedResult(resultMsg);
    announce(resultMsg, 'HIGH');
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
      accessible={true}
    >
      <Text
        accessibilityRole="header"
        style={[styles.header, { color: theme.text }]}
      >
        Voice Commands Guide
      </Text>

      <StatusAnnouncement
        message={
          voiceCommandService.isOfflineReady()
            ? t('voice_offline_notice')
            : t('voice_offline_limited')
        }
        type={voiceCommandService.isOfflineReady() ? 'success' : 'info'}
      />

      {/* Voice Commands Table / List */}
      <View style={styles.list}>
        {voiceCommandsList.map((item, idx) => (
          <View
            key={idx}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel={`${item.cmd}: ${item.desc}`}
            style={[
              styles.cmdCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.cmdTitle, { color: theme.accent }]}>
              {item.cmd}
            </Text>
            <Text style={[styles.cmdDesc, { color: theme.textSecondary }]}>
              {item.desc}
            </Text>
          </View>
        ))}
      </View>

      {/* Interactive Command Tester for Accessibility QA */}
      <Text
        accessibilityRole="header"
        style={[styles.subHeader, { color: theme.text }]}
      >
        Offline Intent Parser Tester
      </Text>

      <TextInput
        accessible={true}
        accessibilityLabel="Type a test voice phrase"
        accessibilityHint="Test how the deterministic offline engine parses this sentence"
        value={testInput}
        onChangeText={setTestInput}
        placeholder="e.g. divide by 4 or कुल बताओ"
        placeholderTextColor={theme.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            color: theme.text,
          },
        ]}
      />

      <AccessibleButton
        label="Test Offline Intent"
        onPress={handleTestCommand}
        variant="primary"
        disabled={!testInput.trim()}
      />

      {lastParsedResult && (
        <View
          accessible={true}
          accessibilityRole="text"
          style={[styles.resultCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.accent }]}
        >
          <Text style={[styles.resultText, { color: theme.text }]}>
            {lastParsedResult}
          </Text>
        </View>
      )}

      {/* Screen Reader Navigation Advice */}
      <Text
        accessibilityRole="header"
        style={[styles.subHeader, { color: theme.text }]}
      >
        Screen Reader Navigation Tips
      </Text>

      <Text style={[styles.tipsText, { color: theme.textSecondary }]}>
        • TalkBack (Android): Swipe right or left to move focus between controls. Double-tap anywhere to activate.
        {'\n'}• VoiceOver (iOS): Swipe right or left with one finger. Double tap to activate. Two-finger scrub to go back.
        {'\n'}• All controls in NayanSaathi have minimum 48×48 dp touch targets.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
  },
  header: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.xl,
    fontWeight: '800',
    marginBottom: 12,
  },
  subHeader: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.lg,
    fontWeight: '800',
    marginTop: 24,
    marginBottom: 12,
  },
  list: {
    gap: 10,
    marginVertical: 12,
  },
  cmdCard: {
    padding: 14,
    borderRadius: ACCESSIBILITY_METRICS.borderRadius,
    borderWidth: 1,
  },
  cmdTitle: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.base,
    fontWeight: '700',
    marginBottom: 4,
  },
  cmdDesc: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.sm,
  },
  input: {
    minHeight: ACCESSIBILITY_METRICS.minTouchTargetSize,
    borderRadius: ACCESSIBILITY_METRICS.borderRadius,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: ACCESSIBILITY_METRICS.fontSize.base,
    marginBottom: 10,
  },
  resultCard: {
    padding: 16,
    borderRadius: ACCESSIBILITY_METRICS.borderRadius,
    borderWidth: 2,
    marginTop: 10,
  },
  resultText: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.base,
    fontWeight: '700',
  },
  tipsText: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.base,
    lineHeight: ACCESSIBILITY_METRICS.lineHeight.base,
    marginTop: 8,
    marginBottom: 30,
  },
});
