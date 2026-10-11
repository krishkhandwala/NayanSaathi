import { LanguageInfo, SupportedLanguage } from '../types/settings';

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageInfo> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    offlineSpeechSynthesisAvailable: true,
    offlineSpeechRecognitionAvailable: true,
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    offlineSpeechSynthesisAvailable: true,
    offlineSpeechRecognitionAvailable: true,
  },
  ta: {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    offlineSpeechSynthesisAvailable: true,
    offlineSpeechRecognitionAvailable: false, // Explicitly documented limitation on older devices
  },
  mr: {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    offlineSpeechSynthesisAvailable: true,
    offlineSpeechRecognitionAvailable: false,
  },
  bn: {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    offlineSpeechSynthesisAvailable: true,
    offlineSpeechRecognitionAvailable: false,
  },
};
