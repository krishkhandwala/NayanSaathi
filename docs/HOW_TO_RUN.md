# NayanSaathi — How to Run (Laptop & Mobile)

> **Project Path**: `C:\Users\Krish Khandwala\.gemini\antigravity-ide\scratch\nayansaathi`
> **GitHub**: https://github.com/krishkhandwala/NayanSaathi.git
> **Expo Account**: ranveer01

---

## Prerequisites

| Tool | Version | Check Command |
|------|---------|---------------|
| Node.js | ≥ 18.x | `node --version` |
| npm | ≥ 9.x | `npm --version` |
| Git | any | `git --version` |
| Expo Go (mobile) | latest | Install from Play Store / App Store |

---

## 1. First-Time Setup (Run Once)

Open PowerShell and run these commands **in order**:

```powershell
# Step 1: Navigate to the project folder
cd "C:\Users\Krish Khandwala\.gemini\antigravity-ide\scratch\nayansaathi"

# Step 2: Install all dependencies
npm install --legacy-peer-deps

# Step 3: Set your Expo authentication token (persists across sessions)
[System.Environment]::SetEnvironmentVariable('EXPO_TOKEN', 'TRBuS5aUxxsjJG-5T9o17c-lHJEoqRX5j32aTedH', 'User')

# Step 4: Verify you are logged in as ranveer01
$env:EXPO_TOKEN = "TRBuS5aUxxsjJG-5T9o17c-lHJEoqRX5j32aTedH"
npx expo whoami
# Expected output: ranveer01

# Step 5: Run the automated tests to verify everything works
npm test
# Expected: 4 test suites, 36 tests, all passing
```

---

## 2. Running on Your Laptop (Browser Preview)

```powershell
# Navigate to project
cd "C:\Users\Krish Khandwala\.gemini\antigravity-ide\scratch\nayansaathi"

# Set credentials
$env:EXPO_TOKEN = "TRBuS5aUxxsjJG-5T9o17c-lHJEoqRX5j32aTedH"

# Start the development server
npx expo start -c

# Then open your browser at:
# http://localhost:8081
```

> Press **`Ctrl + Shift + R`** in your browser if you see raw JSON instead of the app UI (hard refresh).

---

## 3. Running on Your Mobile Phone (Expo Go via Wi-Fi)

> **Requirement**: Your phone and laptop must be on the **same Wi-Fi network**.

```powershell
# Navigate to project
cd "C:\Users\Krish Khandwala\.gemini\antigravity-ide\scratch\nayansaathi"

# Set credentials and bind to Wi-Fi interface
$env:EXPO_TOKEN = "TRBuS5aUxxsjJG-5T9o17c-lHJEoqRX5j32aTedH"
$env:REACT_NATIVE_PACKAGER_HOSTNAME = "192.168.10.9"

# Start the dev server on LAN mode (clears cache)
npx expo start --lan -c
```

Then on your phone:
1. Open **Expo Go** and log in as **ranveer01**
2. Pull to refresh the Home tab
3. Tap **nayansaathi** under "Development servers"
4. Or tap **"Enter URL manually"** and type: `exp://192.168.10.9:8081`

---

## 4. Running on Your Mobile Phone (Tunnel — Any Network)

Use this when your phone and laptop are **NOT on the same Wi-Fi**:

```powershell
# Navigate to project
cd "C:\Users\Krish Khandwala\.gemini\antigravity-ide\scratch\nayansaathi"

# Set credentials
$env:EXPO_TOKEN = "TRBuS5aUxxsjJG-5T9o17c-lHJEoqRX5j32aTedH"

# Start with ngrok tunnel (works globally over internet)
npx expo start --tunnel -c
```

Then in Expo Go:
1. Log in as **ranveer01**
2. Pull to refresh → tap **nayansaathi**, or tap "Enter URL manually" and enter the `exp://xxxx.exp.direct` URL shown in the terminal

---

## 5. Running Tests

```powershell
cd "C:\Users\Krish Khandwala\.gemini\antigravity-ide\scratch\nayansaathi"

# Run all unit tests (36 tests across 4 suites)
npm test

# Watch mode (re-runs on file save)
npm run test:watch

# Coverage report
npm run test:coverage
```

---

## 6. Type Checking

```powershell
cd "C:\Users\Krish Khandwala\.gemini\antigravity-ide\scratch\nayansaathi"

# TypeScript check — must return 0 errors
npm run typecheck
```

---

## 7. Git — Push Changes to GitHub

```powershell
cd "C:\Users\Krish Khandwala\.gemini\antigravity-ide\scratch\nayansaathi"

git status
git add .
git commit -m "your message here"
git push origin main
```

---

## 8. Pull Latest Changes from GitHub

```powershell
cd "C:\Users\Krish Khandwala\.gemini\antigravity-ide\scratch\nayansaathi"

git pull origin main
npm install --legacy-peer-deps
```

---

## 9. Troubleshooting

| Problem | Fix |
|---------|-----|
| Shows raw JSON in browser | Press `Ctrl + Shift + R` to hard refresh |
| Phone says "Could not connect" | Ensure same Wi-Fi, or use `--tunnel` |
| `Cannot find module 'ajv/...'` | `npm install ajv@^8.12.0 --legacy-peer-deps` |
| Expo Go says SDK mismatch | Update Expo Go to latest version from app store |
| Port 8081 already in use | `npx kill-port 8081` then retry |
| `Not logged in` error | `$env:EXPO_TOKEN = "TRBuS5aUxxsjJG-5T9o17c-lHJEoqRX5j32aTedH"` |
| `Uncaught Error: navigate before mount` | Hard refresh browser (`Ctrl+Shift+R`) — already patched |

---

## 10. Quick Reference Cheatsheet

```powershell
# One-time setup
npm install --legacy-peer-deps

# Browser (laptop)
$env:EXPO_TOKEN="TRBuS5aUxxsjJG-5T9o17c-lHJEoqRX5j32aTedH"; npx expo start -c

# Phone — same Wi-Fi
$env:EXPO_TOKEN="TRBuS5aUxxsjJG-5T9o17c-lHJEoqRX5j32aTedH"; $env:REACT_NATIVE_PACKAGER_HOSTNAME="192.168.10.9"; npx expo start --lan -c

# Phone — any network
$env:EXPO_TOKEN="TRBuS5aUxxsjJG-5T9o17c-lHJEoqRX5j32aTedH"; npx expo start --tunnel -c

# Tests
npm test

# TypeScript check
npm run typecheck

# Push to GitHub
git add .; git commit -m "update"; git push origin main
```
