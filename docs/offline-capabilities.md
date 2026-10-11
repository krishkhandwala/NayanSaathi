# NayanSaathi Offline Capabilities & Privacy Audit

## 1. Zero Network Architecture

NayanSaathi is engineered from the ground up as a **100% offline-first application**. It contains:
- **No cloud backend**
- **No external API calls**
- **No user authentication services**
- **No tracking or analytics SDKs** (e.g. Firebase, Mixpanel, Sentry)
- **No crash reporting telemetry sending device identifiers over the wire**

The network permission is completely absent from the Android manifest permissions list.

---

## 2. Feature-by-Feature Offline Audit

| Subsystem | Offline Capability | Implementation Mechanism | Fallback Behavior |
| :--- | :--- | :--- | :--- |
| **Camera & Frame Analysis** | 100% Offline | Native CameraX (Android) / AVFoundation (iOS). Live image buffers processed in volatile memory. | None needed. Frames never saved to persistent disk. |
| **Currency ML Recognition** | 100% Offline | Bundled INT8 Quantized MobileNetV3 (single-note) and SSD-MobileNet (multi-note). | If model asset is missing, UI enters an explicit `MODEL_FILE_MISSING` state with instructions. |
| **Text-to-Speech (TTS)** | 100% Offline | Android TextToSpeech engine / iOS AVSpeechSynthesizer using pre-installed on-device voice data. | System default fallback voice if specific regional voice is uninstalled. |
| **Voice Command Parsing** | 100% Offline | Deterministic regex-based pattern matching engine with normalized phonetics across 5 languages. | Fallback to accessible on-screen buttons if speech-to-text service is unavailable. |
| **Speech-to-Text (STT)** | Offline for En & Hi | Android SpeechRecognizer with `EXTRA_PREFER_OFFLINE`; iOS `requiresOnDeviceRecognition`. | Explicit spoken prompt informing user that spoken input is operating via accessible touch controls. |
| **Cash Calculation & Wallet** | 100% Offline | Pure deterministic integer rupee arithmetic running strictly on-device in application process memory. | None needed. Always functional. |
| **Settings Persistence** | 100% Offline | Local encrypted key-value store / AsyncStorage for user preferences (language, contrast, haptics). | Defaults to high-contrast dark mode and English. |

---

## 3. Data Flow & Security Guarantee

1. **Transient Processing**: Camera frames are passed to `ImagePreprocessService` and the ML inference engine as ephemeral memory buffers. Once classified, the buffer is freed by the garbage collector immediately.
2. **Local Session Scope**: Cash wallet balance exists in application memory during the active session. If the user exits or clears the app, all running transaction records are wiped clean.
3. **Regulatory Compliance**: Full compliance with the Digital Personal Data Protection Act (DPDP) and strict privacy guidelines for assistive technologies.
