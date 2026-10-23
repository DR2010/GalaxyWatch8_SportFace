# Samsung Galaxy Watch 8 - Sport & Fitness Watch Face & Studio

An interactive visual designer, live simulator, and official **Watch Face Format (WFF v2.0)** generator built specifically for the **Samsung Galaxy Watch 8** (Wear OS 5 & Wear OS 6).

![Galaxy Watch 8 Watch Face Simulator](https://img.shields.io/badge/Platform-Wear%20OS%205%20%2F%206-00FFA3?style=for-the-badge&logo=android)
![Watch Face Format](https://img.shields.io/badge/Specification-Watch%20Face%20Format%202.0-00E5FF?style=for-the-badge)

---

## ⚡ Features

- **Realistic Galaxy Watch 8 Hardware Chassis**:
  - 450x450 Super AMOLED circular display with sapphire crystal glass reflection.
  - Brushed Titanium, Phantom Black, and Silver finishes.
  - Dual tactile hardware buttons (including the signature orange sport action pusher).
  - Fluted silicone sport bands in customizable colors.
- **Sport & Fitness Telemetry**:
  - **Triple Activity Rings**: Calories burned (`[CALORIES]`), Workout minutes (`[ACTIVE_MINUTES]`), and Steps (`[STEP_COUNT]`).
  - **BioActive Heart Rate Monitor**: Real-time animated ECG pulse wave and 5-tier heart rate training zones (Warmup, Fat Burn, Cardio, Anaerobic, Peak VO2).
  - **Athletic Split Digital Clock**: High-contrast bold typography with live seconds indicator and date pill.
  - **Weather & Environmental Telemetry**: Real-time temperature and UV index.
  - **Battery Meter**: Circular gauge, low battery warnings, and fast wireless charging indicators.
  - **Interactive Samsung Health Popups**: Tap any complication on the watch to open simulated Samsung Health screens.
- **Always-On Display (AOD) Mode & OPR Validator**:
  - Live preview of low-power OLED mode.
  - Automatic calculation of **On-Pixel Ratio (OPR %)** to guarantee compliance with Google/Samsung's strict `< 15%` battery policy.
- **Official Watch Face Format (WFF) Declarative XML**:
  - Produces 100% standards-compliant `watchface.xml` for Wear OS 5 & 6.
  - One-click copy or download `watchface.xml`.
- **Pre-Packaged Android Studio Project**:
  - Download a ready-to-build `.zip` or browse the included `android-wearos-project/` directory to compile directly with Android Studio or sideload with ADB.

---

## 🚀 Running the Web Simulator Locally

```bash
# 1. Install dependencies
npm install

# 2. Start local dev server
npm run dev

# 3. Open in your browser
http://localhost:5175/
```

---

## ⌚ How to Sideload to Samsung Galaxy Watch 8

### Method 1: Wireless ADB (Direct Installation)

1. **Enable Developer Options on your Galaxy Watch 8**:
   - On the watch, go to **Settings > About watch > Software info**.
   - Tap **Software version** 7 times until you see "Developer mode turned on".
2. **Enable Wireless Debugging**:
   - Go to **Settings > Developer options**.
   - Enable **ADB debugging** and **Wireless debugging**.
   - Make sure your watch and PC are connected to the same Wi-Fi network.
   - Tap **Pair new device** to note the `<WATCH_IP>`, `<PAIRING_PORT>`, and 6-digit `<PAIRING_CODE>`.
3. **Pair and Connect from PC Terminal**:
   ```bash
   adb pair <WATCH_IP>:<PAIRING_PORT> <PAIRING_CODE>
   adb connect <WATCH_IP>:<CONNECTION_PORT>
   ```
4. **Compile & Sideload the Included Project**:
   ```bash
   cd android-wearos-project
   ./gradlew installDebug
   ```
   Or open `android-wearos-project/` in Android Studio and click **Run (Shift + F10)**.

### Method 2: Samsung Watch Face Studio (WFS)

1. Open **Samsung Watch Face Studio**.
2. Create a new 450x450 round project.
3. Import the assets or configure elements corresponding to `app/src/main/res/xml/watchface.xml`.
4. Click **Run on Device** or export as a signed `.apk` / `.aab`.

---

## 📁 Project Structure

```
WatchFace/
├── index.html                     # Main interactive studio page
├── package.json                   # Vite build configuration
├── src/
│   ├── main.js                    # Application bootstrapper
│   ├── style.css                  # Modern athletic design system
│   ├── watchface/
│   │   ├── state.js               # Reactive telemetry & theme store
│   │   ├── renderer.js            # 60fps Canvas AMOLED renderer & AOD OPR calculator
│   │   ├── wffGenerator.js        # Declarative WFF XML v2.0 generator
│   │   └── projectBundler.js      # JSZip Android Studio project packager
│   └── components/
│       ├── studioControls.js      # Biometric sliders & Samsung Health modals
│       └── codeModal.js           # WFF XML viewer & APK export modal
└── android-wearos-project/        # Native ready-to-build Android Studio project
    ├── build.gradle.kts
    ├── settings.gradle.kts
    └── app/
        ├── build.gradle.kts
        └── src/main/
            ├── AndroidManifest.xml
            └── res/xml/watchface.xml
```
