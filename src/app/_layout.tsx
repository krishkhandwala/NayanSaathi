import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '../state/AppContext';
import { VoiceAssistantModal } from '../components/VoiceAssistantModal';

function RootLayoutContent() {
  const { theme, preferences } = useApp();
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={preferences.theme === 'light' ? 'dark' : 'light'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.surface,
          },
          headerTintColor: theme.text,
          headerTitleStyle: {
            fontWeight: '800',
            fontSize: 20,
          },
          contentStyle: {
            backgroundColor: theme.background,
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'NayanSaathi',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="scanner"
          options={{
            title: 'Currency Scanner',
            headerBackTitle: 'Home',
          }}
        />
        <Stack.Screen
          name="wallet"
          options={{
            title: 'Cash Wallet',
            headerBackTitle: 'Home',
          }}
        />
        <Stack.Screen
          name="split-cash"
          options={{
            title: 'Split Cash',
            headerBackTitle: 'Home',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: 'Settings & Accessibility',
            headerBackTitle: 'Home',
          }}
        />
        <Stack.Screen
          name="help"
          options={{
            title: 'Voice Commands & Help',
            headerBackTitle: 'Home',
          }}
        />
        <Stack.Screen
          name="onboarding"
          options={{
            title: 'Welcome to NayanSaathi',
            headerShown: false,
          }}
        />
      </Stack>

      {/* Global Accessible Floating Voice Assistant Button */}
      <TouchableOpacity
        style={styles.floatingVoiceBtn}
        onPress={() => setVoiceModalVisible(true)}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Open Voice Assistant"
        accessibilityHint="Speak a command or tap quick actions to be spoken aloud via speaker"
      >
        <Text style={styles.floatingVoiceIcon}>🎙️</Text>
        <Text style={styles.floatingVoiceText}>Voice</Text>
      </TouchableOpacity>

      <VoiceAssistantModal
        visible={voiceModalVisible}
        onClose={() => setVoiceModalVisible(false)}
      />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <RootLayoutContent />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  floatingVoiceBtn: {
    position: 'absolute',
    bottom: 24,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#38bdf8',
    zIndex: 999,
    gap: 6,
  },
  floatingVoiceIcon: {
    fontSize: 20,
  },
  floatingVoiceText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
});
