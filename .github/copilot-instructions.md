# Copilot Instructions for Pi-hole Manager

## Project Overview
- **Pi-hole Manager** is a React Native app (Expo) for monitoring and controlling a Pi-hole server.
- Uses **Redux Toolkit** and **RTK Query** for state and API management.
- Navigation is handled via **React Navigation** (bottom tabs).

## Architecture & Data Flow
- **App.tsx**: Entry point, sets up Redux provider and navigation.
- **src/store/**: Redux store setup, slices, and API integration.
  - `api/piholeApi.ts`: Defines all Pi-hole API endpoints using RTK Query. Uses a custom base query for dynamic server URLs and authentication.
  - `api/baseQuery.ts`: Custom base query that injects the Pi-hole server URL and session ID from Redux state into requests.
  - `slices/`: Contains `settingsSlice` (server config, connection status) and `authSlice` (authentication/session).
- **Screens**: UI logic for dashboard, health, and settings. Example: `DashboardScreen.tsx` fetches summary, blocking status, and recent blocked domains using RTK Query hooks.
- **Components**: Reusable UI elements (charts, status cards, toggles).

## Key Patterns & Conventions
- **Dynamic API base URL**: All API requests use the server URL from Redux state (`settings.piHoleConfig.baseUrl`).
- **Session authentication**: Session ID (`auth.sid`) is sent as `X-FTL-SID` header for authenticated requests.
- **Error handling**: API errors update connection/auth status in Redux and show user alerts.
- **Polling**: Dashboard data is auto-refreshed using RTK Query's `pollingInterval`.
- **Skip logic**: API hooks use `skip` option to avoid requests when not connected/authenticated.
- **Mutation patterns**: Actions like enabling/disabling blocking use RTK Query mutations and refetch data after completion.

## Developer Workflows
- **Start app**: `npm start` or `expo start` (see `package.json` scripts).
- **Platform targets**: `npm run android`, `npm run ios`, `npm run web`.
- **No tests or custom build steps detected.**

## Integration Points
- **Pi-hole API**: All backend communication is via HTTP requests to the Pi-hole server, with endpoints defined in `piholeApi.ts`.
- **External dependencies**: See `package.json` for libraries (Expo, React Native, Redux Toolkit, RTK Query, React Navigation, etc.).

## Examples
- To add a new Pi-hole API endpoint, update `src/store/api/piholeApi.ts` and use the generated hook in a screen/component.
- To access server config or session, use Redux selectors (`useAppSelector`).
- To trigger a mutation (e.g., enable blocking):
  ```tsx
  const [enableBlocking] = useEnableBlockingMutation();
  await enableBlocking().unwrap();
  ```

## File References
- Entry: `App.tsx`
- Store: `src/store/index.ts`
- API: `src/store/api/piholeApi.ts`, `src/store/api/baseQuery.ts`
- Slices: `src/store/slices/settingsSlice.ts`, `src/store/slices/authSlice.ts`
- Screens: `src/screens/`
- Components: `src/components/`

---
_If any section is unclear or missing, please provide feedback to improve these instructions._
