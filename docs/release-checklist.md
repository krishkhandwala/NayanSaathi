# NayanSaathi Production Release Checklist (v1.0.0)

Before publishing or distributing NayanSaathi, verify every item in this release checklist.

---

## 1. Functional Integrity
- [x] All 7 Mahatma Gandhi New Series Indian currency denominations supported (₹10, ₹20, ₹50, ₹100, ₹200, ₹500, ₹2000).
- [x] Coins are explicitly excluded and not misclassified as notes.
- [x] Multiple notes detection prevents duplicate counting across consecutive frames.
- [x] Cash calculations use strict integer rupee math. No floating-point rounding bugs.
- [x] Cash splitting handles 2 to 20 people and explicitly announces integer share and remainder.
- [x] "Undo Last Addition" removes only the most recent entry and updates total immediately.
- [x] "Clear Wallet" prompts with an accessible confirmation dialog before resetting balance.

---

## 2. Accessibility & Non-Visual Operation
- [x] App is 100% operable with screen reader active (TalkBack on Android, VoiceOver on iOS).
- [x] All interactive touch targets are at least `48 × 48 dp`.
- [x] High-contrast color palette achieves WCAG AAA compliance (contrast ratio `> 7:1`).
- [x] Real-time camera guidance provides spoken cues for lighting, centering, blur, and motion.
- [x] Guidance cooldown of at least 2 seconds prevents continuous spoken chatter.
- [x] Distinct haptic patterns differentiate success, failure, uncertainty, and wallet additions.

---

## 3. Privacy & Offline Security
- [x] Zero backend or cloud database dependencies.
- [x] Zero tracking, advertising, analytics, or behavioral telemetry SDKs.
- [x] Android Manifest does not declare unnecessary internet permissions.
- [x] Camera frames and audio streams are processed in memory and never saved to persistent storage.
- [x] Cash totals exist only in session memory.

---

## 4. Internationalization & Multilingual Support
- [x] All 5 languages fully supported: English, Hindi, Tamil, Marathi, Bengali.
- [x] Localized strings, numbers, and currency formats in native scripts.
- [x] Offline voice commands parsed deterministically for all 5 languages.
- [x] Language switching takes effect immediately without requiring app restart.

---

## 5. Automated Tests & Code Quality
- [x] `npm run typecheck` passes with zero TypeScript errors.
- [x] `npm run test` passes 100% of unit tests for Wallet, Voice Parsing, Stability Filter, and Multiple Note Detection.
- [x] Model weights integrity verified and documented in `src/models/README.md`.
