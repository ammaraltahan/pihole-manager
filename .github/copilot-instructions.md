
# Copilot Instructions for Pi-hole Manager

## Project Overview
- **Pi-hole Manager** is a mobile-first React Native (Expo) app for monitoring and controlling Pi-hole servers.
- Supports multi-profile connections, dynamic server URLs, quick actions, error notification, and accessibility (WCAG AA).

## Architecture & Data Flow
- **App.tsx**: Entry point; sets up Redux provider and navigation (React Navigation, bottom tabs).
- **src/store/**: Redux Toolkit store, RTK Query API, and slices:
  - `api/piholeApi.ts`: All Pi-hole API endpoints (RTK Query), including metrics, actions, and system info. Uses a custom base query for dynamic server URLs and session authentication.
  - `api/baseQuery.ts`: Custom base query that injects the Pi-hole server URL and session ID (`X-FTL-SID` header) from Redux state into requests. Handles error propagation and connection/auth status updates.
  - `slices/settingsSlice.ts`: Manages server profiles, connection status, and config.
  - `slices/authSlice.ts`: Manages authentication/session state.
- **src/screens/**: Main screens (Dashboard, Health, Settings). Example: `SettingsScreen.tsx` implements multi-profile management, connection workflow, error notification, and quick actions.
- **src/components/**: Reusable UI elements (charts, status cards, toggles, quick actions, error notification).
- **src/types/**: Shared TypeScript types for API responses, config, and state.
- **src/utils/probe.ts**: Server reachability and validation helpers.

## Key Patterns & Conventions
- **Dynamic API base URL**: All API requests use the server URL from Redux state (`settings.piHoleConfig.baseUrl`).
- **Session authentication**: Session ID (`auth.sid`) sent as `X-FTL-SID` header for authenticated requests.
- **Multi-profile support**: Users can add, edit, and switch between multiple Pi-hole server profiles.
- **Error handling**: API/network errors update Redux state and trigger user alerts. Retry logic is built into quick actions and connection workflow.
- **Polling**: Dashboard and recent blocked data auto-refresh using RTK Query's `pollingInterval`.
- **Skip logic**: API hooks use `skip` to avoid requests when not connected/authenticated.
- **Mutation patterns**: Actions (enable/disable blocking, flush logs, restart DNS) use RTK Query mutations and refetch relevant data after completion.
- **Accessibility**: All interactive elements use proper accessibility roles/labels. UI is tested for WCAG AA compliance.

## Developer Workflows
- **Start app**: `npm start` or `expo start` (see `package.json` scripts).
- **Platform targets**: `npm run android`, `npm run ios`, `npm run web`.
- **Configuration**: Add server profiles in Settings. Enter URL and password (if required), test connection, and save.
- **No automated tests or custom build steps detected.**

## Integration Points
- **Pi-hole API**: All backend communication via HTTP requests to Pi-hole server. Endpoints defined in `src/store/api/piholeApi.ts`.
- **External dependencies**: See `package.json` for libraries (Expo, React Native, Redux Toolkit, RTK Query, React Navigation, React Native Paper, etc.).

## Examples
- To add a new Pi-hole API endpoint, update `src/store/api/piholeApi.ts` and use the generated hook in a screen/component:
  ```tsx
  const { data, error } = useGetSummaryQuery();
  ```
- To access server config or session, use Redux selectors:
  ```tsx
  const { piHoleConfig } = useAppSelector(state => state.settings);
  const { sid } = useAppSelector(state => state.auth);
  ```
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
- Types: `src/types/`
- Utils: `src/utils/probe.ts`

---
_If any section is unclear, incomplete, or missing, please provide feedback to improve these instructions._
