export type SupportedLanguage = 'en' | 'hi' | 'ta' | 'mr' | 'bn';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  offlineSpeechSynthesisAvailable: boolean;
  offlineSpeechRecognitionAvailable: boolean;
}

export interface UserPreference {
  preferredLanguage: SupportedLanguage;
  hapticsEnabled: boolean;
  speechRate: number; // 0.8 to 1.2
  highContrastEnabled: boolean;
  theme: 'dark' | 'light';
  autoTorchEnabled: boolean;
  onboardingCompleted: boolean;
}

export type ModelInitializationStatus =
  | 'UNINITIALIZED'
  | 'LOADING'
  | 'READY'
  | 'MODEL_FILE_MISSING'
  | 'HARDWARE_UNSUPPORTED'
  | 'FAILED';

export interface MLModelStatus {
  status: ModelInitializationStatus;
  version: string;
  modelSizeMB: number;
  isQuantized: boolean;
  accelerationMode: 'GPU' | 'NNAPI' | 'COREML' | 'CPU_FALLBACK' | 'NONE';
  errorMessage?: string;
}
