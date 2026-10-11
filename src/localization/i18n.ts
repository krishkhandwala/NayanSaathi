import { SupportedLanguage } from '../types/settings';
import en from './en.json';
import hi from './hi.json';
import ta from './ta.json';
import mr from './mr.json';
import bn from './bn.json';

export type TranslationKey = keyof typeof en;

const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en,
  hi,
  ta,
  mr,
  bn,
};

let currentLanguage: SupportedLanguage = 'en';

export const setI18nLanguage = (lang: SupportedLanguage): void => {
  if (TRANSLATIONS[lang]) {
    currentLanguage = lang;
  }
};

export const getI18nLanguage = (): SupportedLanguage => {
  return currentLanguage;
};

export const t = (
  key: TranslationKey,
  params?: Record<string, string | number>,
  overrideLanguage?: SupportedLanguage
): string => {
  const lang = overrideLanguage || currentLanguage;
  const table = TRANSLATIONS[lang] || TRANSLATIONS.en;
  let text = table[key] || TRANSLATIONS.en[key] || key;

  if (params) {
    Object.keys(params).forEach((paramKey) => {
      const placeholder = `%{${paramKey}}`;
      text = text.replace(new RegExp(placeholder, 'g'), String(params[paramKey]));
    });
  }

  return text;
};

export const formatRupees = (amount: number, lang: SupportedLanguage = currentLanguage): string => {
  const integerAmount = Math.floor(amount);
  return `₹${integerAmount.toLocaleString('en-IN')}`;
};
