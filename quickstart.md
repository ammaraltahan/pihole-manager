# Pi-hole Manager Quickstart

This guide will help you set up, build, and run the Pi-hole Manager app.

## Prerequisites
- Node.js >= 18.x
- npm >= 9.x
- Expo CLI (`npm install -g expo-cli`)
- Pi-hole server (local or remote)

## Setup
1. **Clone the repository:**
   ```sh
   git clone https://github.com/ammaraltahan/pihole-manager.git
   cd pihole-manager
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Start the app (Expo):**
   ```sh
   npm start
   ```
   - Use Expo Go on your mobile device or an emulator to preview the app.

## Platform Targets
- **Android:** `npm run android`
- **iOS:** `npm run ios`
- **Web:** `npm run web`

## Configuration
- Go to **Settings** in the app.
- Add your Pi-hole server URL (e.g., `http://192.168.1.50` or `http://pi.hole`).
- Enter password if required by your Pi-hole setup.
- Save and test connection.

## Troubleshooting
- Ensure your device is on the same network as the Pi-hole server.
- Use the correct server URL (including `http://`).
- Check Pi-hole server status and network connectivity.

## Useful Commands
- `npm install` — Install dependencies
- `npm start` — Start Expo development server
- `npm run android` — Run on Android emulator/device
- `npm run ios` — Run on iOS simulator/device
- `npm run web` — Run in browser

## Support
- See `docs/README.md` for full documentation.
- For issues, open a ticket on GitHub.

---
