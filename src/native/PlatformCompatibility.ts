import { Platform } from 'react-native';

export interface PlatformFeatureSupport {
  featureName: string;
  androidSupported: boolean;
  androidImplementation: string;
  iosSupported: boolean;
  iosImplementation: string;
  offlineCapable: boolean;
  notes: string;
}

export const PLATFORM_COMPATIBILITY_MATRIX: PlatformFeatureSupport[] = [
  {
    featureName: 'Camera Access & Frame Processing',
    androidSupported: true,
    androidImplementation: 'CameraX / expo-camera with ImageAnalysis buffer',
    iosSupported: true,
    iosImplementation: 'AVFoundation / expo-camera with CMSampleBuffer',
    offlineCapable: true,
    notes: 'Runs 100% on device with no cloud transmission',
  },
  {
    featureName: 'Torch / Flashlight Control',
    androidSupported: true,
    androidImplementation: 'CameraManager.setTorchMode()',
    iosSupported: true,
    iosImplementation: 'AVCaptureDevice.torchMode',
    offlineCapable: true,
    notes: 'Permits manual user toggle or guidance recommendation in dark environments',
  },
  {
    featureName: 'On-Device ML Inference',
    androidSupported: true,
    androidImplementation: 'TensorFlow Lite / LiteRT with NNAPI / CPU XNNPACK delegate',
    iosSupported: true,
    iosImplementation: 'Core ML with Apple Neural Engine (ANE) / TFLite Metal delegate',
    offlineCapable: true,
    notes: 'Zero network calls. Model weights bundled locally in app container',
  },
  {
    featureName: 'Offline Speech Recognition',
    androidSupported: true,
    androidImplementation: 'Android SpeechRecognizer with EXTRA_PREFER_OFFLINE (en, hi)',
    iosSupported: true,
    iosImplementation: 'SFSpeechRecognizer.requiresOnDeviceRecognition (en, hi)',
    offlineCapable: true,
    notes: 'English & Hindi supported offline. Explicit fallback to accessible UI for other languages',
  },
  {
    featureName: 'Text-to-Speech (Audio Announcements)',
    androidSupported: true,
    androidImplementation: 'Android TextToSpeech engine with installed offline voices',
    iosSupported: true,
    iosImplementation: 'AVSpeechSynthesizer with system on-device voice assets',
    offlineCapable: true,
    notes: 'All 5 languages supported locally when voice packages are installed on device',
  },
  {
    featureName: 'Haptic Feedback',
    androidSupported: true,
    androidImplementation: 'Vibrator / VibrationEffect (API 28+)',
    iosSupported: true,
    iosImplementation: 'UIFeedbackGenerator / CoreHaptics',
    offlineCapable: true,
    notes: 'Distinguishable vibration patterns for success, failure, uncertainty, and wallet additions',
  },
  {
    featureName: 'Accelerometer & Gyroscope',
    androidSupported: true,
    androidImplementation: 'SensorManager (TYPE_ACCELEROMETER, TYPE_GYROSCOPE)',
    iosSupported: true,
    iosImplementation: 'CMMotionManager',
    offlineCapable: true,
    notes: 'Used to provide "Hold phone steady" spoken guidance during camera jitter',
  },
  {
    featureName: 'Local Data Persistence',
    androidSupported: true,
    androidImplementation: 'SQLite / encrypted local storage',
    iosSupported: true,
    iosImplementation: 'SQLite / encrypted local storage',
    offlineCapable: true,
    notes: 'Stores user preferences only. Cash totals are strictly in-memory per session',
  },
  {
    featureName: 'Screen Reader Support',
    androidSupported: true,
    androidImplementation: 'TalkBack semantics (accessible, accessibilityLabel, accessibilityHint, liveRegion)',
    iosSupported: true,
    iosImplementation: 'VoiceOver semantics (accessibilityTraits, accessibilityElementsHidden)',
    offlineCapable: true,
    notes: 'Full focus order validation. Entire app operable without visual sight',
  },
];

export const getPlatformDescription = (): string => {
  return `${Platform.OS.toUpperCase()} (v${Platform.Version})`;
};
