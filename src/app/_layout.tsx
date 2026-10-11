import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '../state/AppContext';

function RootLayoutContent() {
  const { theme, preferences } = useApp();

  return (
    <>
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
    </>
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
