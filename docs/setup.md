# NayanSaathi Development & Build Setup Guide

This guide describes how to configure, develop, test, and build NayanSaathi on Windows, macOS, Android, and iOS.

---

## 1. Prerequisites

- **Node.js**: v18.x or v20.x+ (verified on Node v22.17.0)
- **Package Manager**: npm v9+
- **Git**: Installed and available in PATH
- **Expo CLI**: Installed globally or executed via `npx expo`
- **JDK**: Java Development Kit 17 (for native Android builds)
- **Android Studio & SDK**: Android SDK Platforms 28–34, Android Build Tools 34.0.0
- **Xcode** (macOS only): Xcode 15+ with iOS 16+ SDK and CocoaPods (for local iOS builds)

---

## 2. Quickstart Installation

1. Navigate to the project root:
   ```bash
   cd nayansaathi
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Verify TypeScript types:
   ```bash
   npm run typecheck
   ```

4. Run automated test suite:
   ```bash
   npm run test
   ```

---

## 3. Local Development

Start the Expo development server:
```bash
npm run start
```

- **Running on Physical Android Device**:
  Connect your phone via USB with USB Debugging enabled, then run:
  ```bash
  npm run android
  ```
- **Running on iOS Simulator / Device (macOS)**:
  ```bash
  npm run ios
  ```
- **Web Fallback (for rapid UI & audio simulation)**:
  ```bash
  npm run web
  ```

---

## 4. Building Production Binaries

### 4.1 Android APK / AAB
1. Generate the native Android project via prebuild:
   ```bash
   npx expo prebuild --platform android
   ```
2. Build release APK with Gradle:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
   The APK output is located at:
   `android/app/build/outputs/apk/release/app-release.apk`

### 4.2 Apple iOS (Local on macOS)
1. Generate the native iOS workspace:
   ```bash
   npx expo prebuild --platform ios
   ```
2. Install CocoaPods:
   ```bash
   cd ios && pod install
   ```
3. Build release archive:
   ```bash
   xcodebuild -workspace NayanSaathi.xcworkspace -scheme NayanSaathi -configuration Release -archivePath build/NayanSaathi.xcarchive archive
   ```

### 4.3 Cloud-based iOS Build (from Windows / Linux via EAS)
If developing on Windows without a local Mac machine:
1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Log in and configure build:
   ```bash
   eas login
   eas build:configure
   ```
3. Run remote cloud build for iOS:
   ```bash
   eas build --platform ios --profile production
   ```
