# Mobile App Build Guide

This guide explains how to build and run Apex Virtus as a native mobile app on iOS and Android.

## Prerequisites

### For iOS (Mac only)
- macOS computer
- [Xcode](https://apps.apple.com/us/app/xcode/id497799835) (latest version from App Store)
- Xcode Command Line Tools: `xcode-select --install`
- iOS Simulator (comes with Xcode)
- Physical iPhone for device testing (optional)

### For Android
- [Android Studio](https://developer.android.com/studio)
- Android SDK (comes with Android Studio)
- Java JDK 17 or later
- Android Emulator or physical Android device

## Quick Start

### iOS Development

1. **Build and open iOS project:**
   ```bash
   cd app
   npm run ios
   ```

   This will:
   - Build the web app
   - Sync files to iOS project
   - Open the project in Xcode

2. **In Xcode:**
   - Select a simulator or connected device from the top toolbar
   - Click the "Play" button (▶) to build and run
   - Wait for the app to compile and launch

3. **Testing on physical device:**
   - Connect your iPhone via USB
   - Select your device in Xcode
   - You may need to enable "Developer Mode" on your iPhone (Settings → Privacy & Security → Developer Mode)
   - First time: Go to iPhone Settings → General → VPN & Device Management → Trust your developer certificate

### Android Development

1. **Build and open Android project:**
   ```bash
   cd app
   npm run android
   ```

   This will:
   - Build the web app
   - Sync files to Android project
   - Open the project in Android Studio

2. **In Android Studio:**
   - Wait for Gradle sync to complete
   - Select an emulator or connected device from the top toolbar
   - Click the "Run" button (▶) to build and run
   - First build may take several minutes

3. **Testing on physical device:**
   - Enable Developer Options on your Android phone:
     - Settings → About Phone → Tap "Build Number" 7 times
   - Enable USB Debugging:
     - Settings → Developer Options → USB Debugging
   - Connect via USB
   - Accept the USB debugging prompt on your phone
   - Select your device in Android Studio

## Manual Build Process

If you want more control over the build process:

### 1. Build the web app
```bash
cd app
npm run build
```

This creates a static build in the `build/` directory.

### 2. Sync to native projects
```bash
# For iOS
npm run sync:ios

# For Android
npm run sync:android

# For both
npm run build:mobile
```

### 3. Open in IDE
```bash
# Open Xcode
npm run open:ios

# Open Android Studio
npm run open:android
```

## Development Workflow

When making changes to your app:

1. Make changes to your SvelteKit code
2. Rebuild and sync:
   ```bash
   npm run build:mobile
   ```
3. The native apps will automatically reload with your changes

**Tip:** For faster iteration, you can run the dev server and point the native apps to it:
1. Start dev server: `npm run dev`
2. Update `capacitor.config.ts` to use `http://localhost:5173`
3. Run `cap sync`

## Troubleshooting

### iOS Issues

**"Unable to boot simulator"**
- Open Xcode → Window → Devices and Simulators
- Delete and recreate the simulator

**"No development team selected"**
- Xcode → Settings → Accounts → Add Apple ID
- In project settings, select your team under "Signing & Capabilities"

**"Build failed"**
- Clean build folder: Xcode → Product → Clean Build Folder
- Try rebuilding

### Android Issues

**"SDK location not found"**
- Android Studio → Preferences → Appearance & Behavior → System Settings → Android SDK
- Note the SDK Location path
- Create `android/local.properties` with: `sdk.dir=/path/to/Android/sdk`

**"Gradle sync failed"**
- File → Invalidate Caches → Invalidate and Restart
- Delete `android/.gradle` folder and sync again

**"App not launching on device"**
- Check USB debugging is enabled
- Run `adb devices` to verify device connection
- Try running `adb kill-server` then `adb start-server`

## Environment Configuration

The mobile app will use your deployed API by default. To use a local backend:

1. Update API endpoints in your code to use your computer's local IP
2. Make sure your phone/emulator can reach your dev server
3. For iOS simulator: `http://localhost:3000` works
4. For Android emulator: Use `http://10.0.2.2:3000`
5. For physical devices: Use your computer's IP on the same WiFi network

## App Icons and Splash Screens

To customize app icons and splash screens:

1. Generate icons using a tool like [Capacitor Assets](https://github.com/ionic-team/capacitor-assets)
2. Place icons in appropriate directories:
   - iOS: `ios/App/App/Assets.xcassets/`
   - Android: `android/app/src/main/res/`

## Publishing

### iOS App Store
1. Archive the app in Xcode: Product → Archive
2. Upload to App Store Connect
3. Complete app listing and submit for review

### Google Play Store
1. Generate signed APK/Bundle in Android Studio: Build → Generate Signed Bundle/APK
2. Upload to Google Play Console
3. Complete app listing and submit for review

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Development Guide](https://developer.apple.com/ios/)
- [Android Development Guide](https://developer.android.com/guide)
