# NayanSaathi (नयनसाथी)
### Cross-Platform, Offline-First Currency Recognition & Cash Assistant for Blind and Visually Impaired Users
Published App Now Available

[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-brightgreen.svg)]()
[![License](https://img.shields.io/badge/License-MIT-blue.svg)]()
[![Accessibility](https://img.shields.io/badge/WCAG-2.1%20AAA-gold.svg)]()
[![Offline](https://img.shields.io/badge/Offline-100%25-success.svg)]()

**NayanSaathi** is an audio-first, accessibility-first, privacy-first mobile application built with React Native and Expo. It runs natively on **Android (API 28+)** and **Apple iOS**, empowering visually impaired individuals to recognize Indian paper currency banknotes independently, calculate cash totals, split cash among multiple people, and receive real-time camera framing guidance without internet connectivity.

---

## 🌟 Key Features

1. **Indian Currency Recognition (Mahatma Gandhi New Series)**:
   - Recognizes all 7 legal tender denominations: **₹10, ₹20, ₹50, ₹100, ₹200, ₹500, ₹2000**.
   - Dual recognition modes: **Single Note** scanning and **Multiple Note** detection with IoU overlap alerts.
   - Robust to folds, wrinkles, soiling, low light, and angles up to ±30 degrees.
   - Rejects coins and unknown objects with explicit feedback.

2. **Real-Time Spoken Camera Guidance**:
   - Accelerometer and gyroscope motion detection: *"Hold the phone steady."*
   - Ambient lighting analysis: *"The lighting is too dark. Turn on flashlight if needed."*
   - Framing and distance detection: *"Move the note into the center"*, *"Move the phone closer"*, *"Move the phone farther away."*
   - Overlap warnings: *"Notes are overlapping. Please separate them."*
   - 2.5-second guidance cooldown preventing acoustic clutter.

3. **Multi-Modal Feedback**:
   - Priority-queued Text-to-Speech (TTS) with queue preemption for critical alerts.
   - Distinct, tactually recognizable haptic vibration patterns for Confirmed, Uncertain, Failed, and Cash Addition.

4. **Cash Calculations & Wallet**:
   - Pure integer rupee math (no floating point errors).
   - "Undo Last Addition" to safely discard miscounted notes.
   - "Clear Wallet" with accessible modal confirmation.
   - Integer Cash Splitting among 2 to 20 people with exact remainder reporting:
     *"The total is ₹1000. Each person receives ₹333. The remaining amount is ₹1."*

5. **Multilingual Offline Voice Control**:
   - Operates in 5 Indian languages: **English**, **Hindi (हिन्दी)**, **Tamil (தமிழ்)**, **Marathi (मराठी)**, and **Bengali (বাংলা)**.
   - Deterministic offline regex intent parser for voice commands (*"Start scanning"*, *"What is my total?"*, *"Undo last"*, *"Divide by three"*, etc.).

6. **Privacy & Offline Guarantee**:
   - **Zero telemetry, zero cloud backends, zero user accounts, zero analytics.**
   - All frame processing and speech recognition runs strictly in volatile device memory.

---

## 📱 Architecture & Project Structure

```
nayansaathi/
├── assets/                  # Icons, splash screens, models
├── docs/                    # Architecture, setup, testing & offline audits
│   ├── architecture.md
│   ├── setup.md
│   ├── offline-capabilities.md
│   ├── accessibility-testing.md
│   ├── performance-testing.md
│   └── release-checklist.md
├── src/
│   ├── app/                 # Expo Router file-based screens
│   │   ├── _layout.tsx      # App shell with Theme & SafeArea
│   │   ├── index.tsx        # Home screen (immediate scanning priority)
│   │   ├── scanner.tsx      # Camera scanner with live guidance & torch
│   │   ├── wallet.tsx       # Cash wallet transaction history & undo
│   │   ├── split-cash.tsx   # Integer split among 2 to 20 people
│   │   ├── settings.tsx     # Language, contrast, haptics & speech rate
│   │   ├── help.tsx         # Voice commands reference & interactive tester
│   │   └── onboarding.tsx   # 4-step accessible onboarding flow
│   ├── components/          # Reusable WCAG AAA accessible components
│   │   ├── AccessibleButton.tsx
│   │   ├── AccessibleDialog.tsx
│   │   ├── StatusAnnouncement.tsx
│   │   ├── WalletSummary.tsx
│   │   ├── ScannerStatus.tsx
│   │   └── CameraGuidanceOverlay.tsx
│   ├── constants/           # Currencies, languages, themes & accessibility metrics
│   ├── localization/        # 5-language dictionaries & translation helper
│   ├── models/              # Model metadata, class labels & training docs
│   ├── native/              # Platform compatibility matrix
│   ├── services/            # Core business logic singletons
│   │   ├── camera/          # Real-time camera guidance engine
│   │   ├── haptics/         # Multi-pattern tactile feedback
│   │   ├── recognition/     # ML inference, stability filter & multi-note detector
│   │   ├── sensors/         # Gyroscope & accelerometer jitter monitoring
│   │   ├── speech/          # Offline deterministic voice command parser
│   │   ├── storage/         # Local encrypted preferences
│   │   ├── text-to-speech/  # Priority-queued audio feedback
│   │   └── wallet/          # Deterministic integer cash wallet
│   ├── state/               # AppContext global state provider
│   └── types/               # TypeScript domain interfaces
└── tests/                   # Automated unit & integration tests
    └── unit/
        ├── WalletService.test.ts
        ├── VoiceCommandParser.test.ts
        ├── ConfidenceStabilityFilter.test.ts
        └── MultipleNoteDetector.test.ts
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd nayansaathi
npm install
```

### 2. Run Automated Tests
```bash
npm test
```

### 3. Start Development Server
```bash
npm start
```
- Press `a` to run on connected Android device/emulator.
- Press `i` to run on iOS simulator.
- Press `w` to run web preview.

---

## ♿ Accessibility Compliance

NayanSaathi adheres strictly to **WCAG 2.1 Level AAA** criteria:
- **Contrast**: > 16:1 ratio between text and background.
- **Touch Target**: Every button is at least `48 × 48 dp`.
- **Screen Reader Semantics**: Complete support for Android TalkBack and Apple iOS VoiceOver with explicit roles, hints, and polite live regions.
- **Non-Visual Operability**: Tested and verified with screen brightness set to 0%.
