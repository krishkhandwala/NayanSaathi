# NayanSaathi Architecture & Technical Specifications

## 1. System Overview

NayanSaathi is an accessibility-first, privacy-first, offline-first mobile application designed to empower blind and visually impaired users to recognize Indian paper currency notes and manage physical cash totals independently.

The application is architected with a strict **separation of concerns**:
- **Presentation Layer**: Expo Router (`src/app/`), Accessible Components (`src/components/`), TalkBack and VoiceOver semantics.
- **State Management**: Context-based reactive architecture (`src/state/AppContext.tsx`).
- **Domain & Services Layer**:
  - `WalletService`: Pure integer rupee cash calculations, undo transaction stack, cash splitting.
  - `AudioFeedbackService`: Centralized priority queue speech synthesizer with duplicate suppression and cooldowns.
  - `VoiceCommandService`: Deterministic offline intent parser supporting English, Hindi, Tamil, Marathi, and Bengali.
  - `CameraGuidanceEngine`: Sensor-backed real-time guidance (lighting, blur, jitter, distance).
  - `ConfidenceStabilityFilter`: Multi-frame consecutive prediction verification.
  - `MultipleNoteDetector`: Multi-object spatial tracking and IoU overlap handling.
  - `LocalStorageService`: Local preference persistence with zero telemetry.
- **Hardware & Platform Abstraction Layer**:
  - Android (CameraX, LiteRT/TFLite, Android TTS, SpeechRecognizer, SensorManager, Vibrator).
  - iOS (AVFoundation, Core ML, AVSpeechSynthesizer, SFSpeechRecognizer, CMMotionManager, CoreHaptics).

---

## 2. Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                           NAYANSAATHI MOBILE APP                                  |
+-----------------------------------------------------------------------------------+
|  UI & Navigation (Expo Router / React Native)                                      |
|  - Home Screen         - Currency Scanner      - Cash Wallet                      |
|  - Split Cash          - Voice Help & QA       - Accessible Settings & Onboarding |
+-----------------------------------------------------------------------------------+
|  Accessibility Layer                                                              |
|  - TalkBack & VoiceOver Semantic Roles, Hints & Live Regions                      |
|  - WCAG AAA High-Contrast Palette & Min 48x48 dp Touch Targets                   |
+-----------------------------------------------------------------------------------+
|  Central State Management (`AppContext`)                                          |
+-----------------------------------------------------------------------------------+
       |                        |                         |
       v                        v                         v
+------------------+   +-------------------+    +--------------------+
|  Wallet Service  |   | Audio & Haptics   |    | Offline Voice      |
|  - Integer INR   |   | - Priority Queue  |    | Command Parser     |
|  - Undo Stack    |   | - Duplicate Guard |    | - Regex Intent Map |
|  - Integer Split |   | - Distinct Haptic |    | - 5 Indian Langs   |
+------------------+   +-------------------+    +--------------------+
       ^                        ^                         ^
       |                        |                         |
+-----------------------------------------------------------------------------------+
|  Computer Vision & ML Pipeline                                                    |
|  +---------------------------+       +-----------------------------------------+  |
|  | Image Preprocessing       | ----> | MobileNetV3 Quantized INT8 Classifier   |  |
|  | - Luminance / Glare check |       | (₹10, ₹20, ₹50, ₹100, ₹200, ₹500, ₹2000)|  |
|  | - Blur / Sharpness proxy  |       +-----------------------------------------+  |
|  +---------------------------+                            |                       |
|               |                                           v                       |
|               |                      +-----------------------------------------+  |
|               v                      | Temporal Stability Filter               |  |
|  +---------------------------+       | - Min Confidence >= 0.85                |  |
|  | Camera Guidance Engine    |       | - 3 Consecutive Stable Frames           |  |
|  | - Motion / Gyro Sensor    |       | - 2000ms Announcement Cooldown          |  |
|  | - Centering / Distance    |       +-----------------------------------------+  |
|  +---------------------------+                                                    |
+-----------------------------------------------------------------------------------+
|  Platform Native Adapters                                                         |
|  - Android 9+ (API 28+): CameraX, LiteRT/TFLite, Android TTS                      |
|  - Apple iOS: AVFoundation, Core ML / Metal, AVSpeechSynthesizer                  |
+-----------------------------------------------------------------------------------+
```

---

## 3. Core Design Principles

1. **Audio-First**: All vital states, detections, confirmations, and errors are announced through clear speech. Visual controls serve as a supplementary layer.
2. **Deterministic Cash Logic**: Money is modeled exclusively as integers (`10, 20, 50, 100, 200, 500, 2000`). Float division and floating point rounding inaccuracies are strictly eliminated.
3. **No False Certainty**: Low-confidence predictions (`< 0.85`) or unstable single-frame blips are never announced as confirmed facts and are never added to the cash wallet.
4. **Complete Privacy & Offline Guarantee**:
   - Zero network connectivity required.
   - Raw camera frames and microphone audio streams are held in volatile memory only and discarded immediately after processing.
   - Cash balances and transaction histories exist only in session memory by default.
