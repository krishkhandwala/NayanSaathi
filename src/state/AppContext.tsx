import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { SupportedLanguage, UserPreference, MLModelStatus } from '../types/settings';
import { WalletEntry, SplitResult } from '../types/wallet';
import { DenominationValue } from '../types/currency';
import { DARK_THEME, LIGHT_THEME, HIGH_CONTRAST_DARK_THEME, ThemeColors } from '../constants/theme';
import { setI18nLanguage, t } from '../localization/i18n';
import { localStorageService } from '../services/storage/LocalStorageService';
import { walletService } from '../services/wallet/WalletService';
import { audioFeedbackService } from '../services/text-to-speech/AudioFeedbackService';
import { hapticsService } from '../services/haptics/HapticsService';
import { currencyRecognitionService } from '../services/recognition/CurrencyRecognitionService';
import { voiceCommandService } from '../services/speech/VoiceCommandService';

interface AppContextValue {
  preferences: UserPreference;
  theme: ThemeColors;
  walletTotal: number;
  confirmedNoteCount: number;
  recentEntries: WalletEntry[];
  modelStatus: MLModelStatus;
  updatePreferences: (newPrefs: Partial<UserPreference>) => Promise<void>;
  changeLanguage: (lang: SupportedLanguage) => Promise<void>;
  addConfirmedNote: (denomination: DenominationValue) => WalletEntry;
  addConfirmedNotes: (notes: { denomination: DenominationValue }[]) => WalletEntry;
  undoLastWalletAddition: () => WalletEntry | null;
  clearWallet: () => { clearedTotal: number; clearedCount: number };
  splitCash: (people: number) => SplitResult;
  announce: (text: string, priority?: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'GUIDANCE', cancelPrevious?: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreference>(localStorageService.getPreferences());
  const [walletTotal, setWalletTotal] = useState<number>(0);
  const [confirmedNoteCount, setConfirmedNoteCount] = useState<number>(0);
  const [recentEntries, setRecentEntries] = useState<WalletEntry[]>([]);
  const [modelStatus, setModelStatus] = useState<MLModelStatus>(currencyRecognitionService.getModelStatus());

  useEffect(() => {
    const init = async () => {
      await localStorageService.initialize();
      const loadedPrefs = localStorageService.getPreferences();
      setPreferences(loadedPrefs);
      setI18nLanguage(loadedPrefs.preferredLanguage);
      audioFeedbackService.setLanguage(loadedPrefs.preferredLanguage);
      audioFeedbackService.setSpeechRate(loadedPrefs.speechRate);
      hapticsService.setEnabled(loadedPrefs.hapticsEnabled);
      voiceCommandService.setLanguage(loadedPrefs.preferredLanguage);

      const status = await currencyRecognitionService.initialize();
      setModelStatus(status);
    };
    init();
  }, []);

  const theme = useMemo<ThemeColors>(() => {
    if (preferences.highContrastEnabled) {
      return HIGH_CONTRAST_DARK_THEME;
    }
    return preferences.theme === 'light' ? LIGHT_THEME : DARK_THEME;
  }, [preferences.highContrastEnabled, preferences.theme]);

  const updatePreferences = async (newPrefs: Partial<UserPreference>) => {
    const updated = await localStorageService.savePreferences(newPrefs);
    setPreferences(updated);

    if (newPrefs.hapticsEnabled !== undefined) {
      hapticsService.setEnabled(newPrefs.hapticsEnabled);
    }
    if (newPrefs.speechRate !== undefined) {
      audioFeedbackService.setSpeechRate(newPrefs.speechRate);
    }
  };

  const changeLanguage = async (lang: SupportedLanguage) => {
    setI18nLanguage(lang);
    audioFeedbackService.setLanguage(lang);
    voiceCommandService.setLanguage(lang);
    await updatePreferences({ preferredLanguage: lang });
    audioFeedbackService.speak(t('settings_language'), 'HIGH');
  };

  const syncWalletState = () => {
    setWalletTotal(walletService.getCurrentTotal());
    setConfirmedNoteCount(walletService.getConfirmedNoteCount());
    setRecentEntries(walletService.getRecentEntries());
  };

  const addConfirmedNote = (denomination: DenominationValue) => {
    const entry = walletService.addConfirmedNote(denomination);
    syncWalletState();
    hapticsService.trigger('CONFIRMED');
    audioFeedbackService.speak(
      t('wallet_added_note', {
        denomination,
        total: walletService.getCurrentTotal(),
      }),
      'HIGH'
    );
    return entry;
  };

  const addConfirmedNotes = (notes: { denomination: DenominationValue }[]) => {
    const entry = walletService.addConfirmedNotes(notes);
    syncWalletState();
    hapticsService.trigger('CONFIRMED');
    audioFeedbackService.speak(
      t('wallet_added_multi', {
        count: notes.length,
        total: walletService.getCurrentTotal(),
      }),
      'HIGH'
    );
    return entry;
  };

  const undoLastWalletAddition = () => {
    const entry = walletService.undoLastAddition();
    syncWalletState();
    if (entry) {
      hapticsService.trigger('SUCCESS');
      audioFeedbackService.speak(
        t('wallet_undo_success', {
          amount: entry.totalValue,
          total: walletService.getCurrentTotal(),
        }),
        'HIGH'
      );
    } else {
      hapticsService.trigger('FAILURE');
      audioFeedbackService.speak(t('wallet_undo_empty'), 'NORMAL');
    }
    return entry;
  };

  const clearWallet = () => {
    const res = walletService.clearWallet();
    syncWalletState();
    hapticsService.trigger('SUCCESS');
    audioFeedbackService.speak(t('wallet_cleared'), 'HIGH');
    return res;
  };

  const splitCash = (people: number) => {
    try {
      const result = walletService.splitCurrentTotal(people);
      hapticsService.trigger('SPLIT');
      audioFeedbackService.speak(
        t('split_result_announcement', {
          total: result.totalAmount,
          share: result.shareAmount,
          remainder: result.remainder,
        }),
        'HIGH'
      );
      return result;
    } catch (err: any) {
      hapticsService.trigger('FAILURE');
      const msg = err.message || t('split_zero_wallet_error');
      audioFeedbackService.speak(msg, 'HIGH');
      throw err;
    }
  };

  const announce = (
    text: string,
    priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'GUIDANCE' = 'NORMAL',
    cancelPrevious = false
  ) => {
    audioFeedbackService.speak(text, priority, cancelPrevious);
  };

  return (
    <AppContext.Provider
      value={{
        preferences,
        theme,
        walletTotal,
        confirmedNoteCount,
        recentEntries,
        modelStatus,
        updatePreferences,
        changeLanguage,
        addConfirmedNote,
        addConfirmedNotes,
        undoLastWalletAddition,
        clearWallet,
        splitCash,
        announce,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
