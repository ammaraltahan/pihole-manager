---

description: "Task list for settings UX redesign"
---

# Tasks: Settings UX Redesign

**Input**: Design documents from `/specs/001-settings-ux-redesign/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize Expo/React Native project dependencies in package.json
- [ ] T003 [P] Configure TypeScript strict mode in tsconfig.json
- [ ] T004 [P] Add Redux Toolkit and RTK Query setup in src/store/
- [ ] T005 [P] Add React Navigation setup in src/screens/
- [ ] T006 [P] Add popular UI library (e.g., React Native Paper) to package.json and configure in src/components/

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T007 Implement dynamic Pi-hole server URL and session-based authentication in src/store/slices/settingsSlice.ts and src/store/api/baseQuery.ts
- [ ] T008 [P] Add support for both http and https protocols, including validation for hostnames and IPs in src/utils/probe.ts
- [ ] T009 [P] Implement hostname resolution and validation (support 'http://pi.hole' and custom hostnames) in src/utils/probe.ts
- [ ] T010 [P] Add WCAG AA accessibility checks for all screens in src/screens/

---

## Phase 3: User Story 1 - Seamless Pi-hole Connection (Priority: P1) 🎯 MVP

**Goal**: Guide user through a clear, step-by-step workflow to connect to a Pi-hole server
**Independent Test**: Connect to a new Pi-hole server and verify workflow completes with clear feedback and error handling

- [ ] T011 [P] [US1] Design step-by-step connection workflow UI in src/screens/SettingsScreen.tsx
- [ ] T012 [P] [US1] Implement server address input and validation in src/components/ServerProfileForm.tsx
- [ ] T013 [US1] Implement connection logic and error handling in src/store/api/baseQuery.ts
- [ ] T014 [US1] Add support for saving and managing multiple server profiles in src/store/slices/settingsSlice.ts
- [ ] T015 [US1] Add context preservation when switching servers in src/store/slices/settingsSlice.ts
- [ ] T016 [US1] Add feedback and retry options for failed connections in src/screens/SettingsScreen.tsx

---

## Phase 4: User Story 2 - Useful & Time-Saving Information (Priority: P2)

**Goal**: Display relevant, actionable Pi-hole information and controls in the settings screen
**Independent Test**: Connect to a Pi-hole server and verify all relevant info and controls are available and functional

- [ ] T017 [P] [US2] Design UI for displaying server health, blocking status, recent errors, and version info in src/screens/SettingsScreen.tsx
- [ ] T018 [P] [US2] Implement Pi-hole info fetch and display logic in src/store/api/piholeApi.ts
- [ ] T019 [US2] Add quick actions (restart DNS, flush logs, toggle blocking) in src/components/QuickActions.tsx
- [ ] T020 [US2] Implement error notification and resolution options in src/screens/SettingsScreen.tsx

---

## Phase 5: User Story 3 - Workflow Personalization & Feedback (Priority: P3)

**Goal**: Allow workflow customization and collect user feedback
**Independent Test**: Change workflow preferences and submit feedback, verify changes are reflected and acknowledged

- [ ] T021 [P] [US3] Design UI for workflow customization (default server, notification preferences, quick actions) in src/screens/SettingsScreen.tsx
- [ ] T022 [P] [US3] Implement UserPreferences entity and logic in src/store/slices/settingsSlice.ts
- [ ] T023 [US3] Add feedback submission form and logic in src/components/FeedbackForm.tsx
- [ ] T024 [US3] Implement feedback acknowledgment and update logic in src/store/slices/settingsSlice.ts

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T025 [P] Documentation updates in docs/
- [ ] T026 Code cleanup and refactoring
- [ ] T027 Performance optimization across all stories
- [ ] T028 [P] Additional accessibility and usability tests in src/screens/ and src/components/
- [ ] T029 Security hardening for server connection logic
- [ ] T030 Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies
- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities
- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tasks for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery
1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy
With multiple developers:
1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
