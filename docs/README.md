# Pi-hole Manager Documentation

This folder contains documentation for the Pi-hole Manager app.

## Overview
Pi-hole Manager is a React Native (Expo) app for monitoring and controlling a Pi-hole server. It features multi-profile support, dynamic server connection, quick actions, error notification, and accessibility compliance.

## Key Features
- Connect to multiple Pi-hole servers
- View server health, blocking status, version, and recent errors
- Perform quick actions: restart DNS, flush logs, toggle blocking
- Robust error handling and retry logic
- WCAG AA accessibility compliance

## Getting Started
See `quickstart.md` for setup and usage instructions.

## Developer Guide
- Architecture: See `/specs/001-settings-ux-redesign/plan.md`
- API: See `src/store/api/piholeApi.ts`
- UI/UX: See `src/screens/SettingsScreen.tsx` and `src/components/`

## Contributing
Please read the contributing guidelines before submitting issues or pull requests.

## License
See `LICENSE` in the project root.
