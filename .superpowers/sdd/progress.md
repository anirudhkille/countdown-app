# Subagent-Driven Development — Progress Ledger

Plan: `docs/PLAN.md` (16 tasks)
Branch: main (single-branch execution, not a worktree — plan targets a greenfield dir)

## Pre-flight fixes applied to the plan

Mechanical defects found by scanning the plan before Task 1, corrected in
`docs/PLAN.md` so implementers inherit correct instructions:

1. **Task 1 Step 4 — `bun expo install -- --dev` is not a real command**, and
   `expo install jest-expo …` would have written dev deps to `dependencies` and
   resolved them against the Expo version matrix. Replaced with `bun add -d`.
2. **Task 1 Step 4 — three packages the code imports were never installed**:
   `expo-status-bar`, `expo-splash-screen`, `react-native-safe-area-context`.
   Tasks 9–10 would not have resolved their imports.
3. **Task 1 Step 4 — `expo-media-library` and `expo-file-system` removed.**
   Nothing in the plan imports them; the share flow uses `captureRef`, whose
   temporary `file://` URI `Sharing.shareAsync` consumes directly. Installing
   unused native modules adds build surface for nothing.
4. **Task 1 Step 5 — Expo Router was never registered as the entry point.** The
   `blank-typescript` template ships `"main": "index.ts"`, so every route in
   Tasks 10–15 would have been dead. Added the `package.json` rewrite and the
   removal of the template's `App.tsx` / `index.ts`.
5. **Task 1 Step 5 — `notification-icon.png` does not exist** in the template, so
   the `expo-notifications` plugin config would fail at prebuild. Dropped the
   `icon` key, kept `color`.
6. **Task 5 — `formatUnitLabel` had a broken singular lookup.** The original
   `SINGULAR` map declared eight keys but the code did
   `SINGULAR[base.slice(0, -1)]`, producing `day`/`week`/`month`/`year` keys
   that did exist — but only by accident, and `unit === 'days' ? SINGULAR.days : unit`
   was a no-op. Replaced with explicit `PLURAL`/`SINGULAR` maps keyed by
   `ResolvedUnit`, so an out-of-range unit is a type error rather than a
   `?? base` silent fallback.
7. **Task 5 — the weeks-remainder test asserted the wrong number.** 2026-03-14 →
   2026-05-13 is 60 calendar days, so 8 whole weeks leaves **4** days, not 5.
   Corrected, and added an explicit `totalDays` assertion so the arithmetic is
   pinned rather than implied.
8. **Task 5 — `countdown.ts` re-exported `MS_PER_DAY` and `addDays`** with no
   consumer. Removed, along with the now-unused imports.
9. **Task 10 — a broken first draft of `app/_layout.tsx` with two default
   exports** preceded its own correction. Replaced with the single valid file.
10. **Task 15 — `FileSystem` and `MediaLibrary` were imported but unused.**
    Removed, with the reason stated inline.

## Execution decisions (human, pre-flight)

1. **Plan bugs: fix and keep going.** The controller presented 9 plan defects as one
   batch; the human chose "fix them and keep going". Every deviation from the plan's
   literal text is recorded in the "Deviations" log below.
2. **Device verification: `expo start` only.** The human chose to attempt
   `bun run start` (bundle compiles) and skip emulator / `adb` / EAS / physical-device
   steps. Those are recorded UNVERIFIED in the Deviations log with the exact command.
3. **Branch: `feat/countdown-v1`.** Repo already `git init`ed on `main` with zero
   commits; branch `feat/countdown-v1` created before Task 1. `main` stays unborn.

## Deviations from the plan (running log)

(filled in as tasks land)

## Unverified (needs an emulator / device / EAS)

- [ ] T06 S3 — SQLite inspector check of the `countdowns` table (`expo start` + Shift+M)
- [ ] T07 S2 — hand-verify repo read/write against the inspector
- [ ] T10 S7 — `bun run start`, boot in Expo Go, empty state visible
- [ ] T11 S6 — manual editor round-trip across an app restart
- [ ] T12 S4 — `adb shell dumpsys notification`, force-stop, relaunch, alarm survives
- [ ] T14 S5 — `bun expo prebuild --platform android` + `bun expo run:android`
- [ ] T15 S6 — visual check of the shared image and text
- [ ] T16 S4 — EAS release APK
- [ ] T16 S5 — the full manual acceptance checklist

## Task status

(entries appended as each task's review comes back clean)
