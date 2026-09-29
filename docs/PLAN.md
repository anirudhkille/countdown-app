# Countdown App — V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `subagent-driven-development` (recommended) or `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Expo (React Native) countdown app — a from-scratch reimplementation of the Play Store app `com.anirudhkille.countdown` ("Countdown Widget", Prometheus Interactive LLC) — minus the home screen widget, using bun as the package manager.

**Architecture:** Four-layer separation. `src/domain/` is pure TypeScript with zero React and zero database imports (date math, recurrence, unit calculation). `src/data/` owns SQLite and is the only layer that speaks SQL. `src/features/` contains screens and feature components. `src/ui/` holds theme tokens and shared primitives. The domain layer is deliberately isolated so it is unit-testable without a device and reusable later by a native Android widget.

**Tech Stack:** Expo SDK 57 · React Native 0.86 · React 19.2 · TypeScript (strict) · Expo Router · expo-sqlite · expo-notifications · expo-calendar · expo-sharing / expo-view-shot / expo-media-library · expo-font · @react-native-community/datetimepicker · bun

---

## Global Constraints

These apply to every task. Do not deviate without an explicit instruction.

- **Expo SDK 57.** Do not install any `expo-*` package at a version other than the one `expo install` resolves. Always install Expo packages with `bun expo install <pkg>`, never `bun add`.
- **Package manager is bun.** Never run `npm install`, `yarn`, or `pnpm`. Never commit `package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml`. The lockfile is `bun.lock`.
- **Node.js LTS must remain installed.** `bun create expo-app` and `bun expo prebuild` shell out to `npm pack`. Node 22.x is present and must stay present.
- **`expo-widgets` is NOT in scope.** It is iOS-only (`platforms: ['ios']`) in SDK 57. Do not install it. See "Out of Scope".
- **No home screen widget on either platform in V1.** See "Out of Scope".
- **`expo-calendar` requires a development build.** It is explicitly unsupported in Expo Go. Every other feature works in Expo Go. See "Environment Constraint" below.
- **Bun does not run dependency lifecycle scripts by default.** Any dependency needing a `postinstall` must be added to `trustedDependencies` in `package.json`, then `node_modules` and the lockfile deleted and reinstalled. Known cases in this project: none required at install time, but `@expo-google-fonts/*` packages are safe; if any package is added to `trustedDependencies`, follow the documented procedure.
- **`src/domain/` must never import from `react`, `react-native`, `expo-*`, or `src/data/`.** This is enforced by an ESLint `no-restricted-imports` rule set up in Task 1. It is the single most important structural rule in the project.
- **No new runtime dependencies beyond those listed.** In particular: no Reanimated, no React Navigation, no Zustand/Redux/Jotai, no Tailwind, no UI kit, no date library. Native `Date` only.
- **TypeScript `strict: true`.** No `any`. No non-null assertions (`!`) outside of `src/domain/` where a preceding guard makes them provably safe.
- **No `@ts-ignore`.**
- **Android is the primary verification target.** The developer is on Windows; Android emulator works locally. iOS code paths must be written and platform-guarded but are verified via cloud EAS Build only.
- **All SQL goes through the Bun-style tagged template API** (`db.sql<T>\`...\``) or parameterized `runAsync`/`getAllAsync`/`getFirstAsync`. Never string-concatenate user input into SQL.

---

## Critical Environment Constraints (verified)

| Fact | Consequence |
|---|---|
| `expo-widgets` `platforms: ['ios']` | No Android widget exists in Expo. Widget is out of scope for V1. |
| `expo-calendar` unsupported in Expo Go | Calendar import requires `npx expo prebuild` + `expo run:android`, or an EAS development build. Everything else runs in Expo Go. |
| `expo-sqlite` ships a Bun-style tagged template API in SDK 57 | Use `db.sql<T>` — it is injection-safe by construction and matches the bun toolchain. |
| `expo-sqlite/kv-store` is a drop-in AsyncStorage replacement | Use it for settings; do NOT add `@react-native-async-storage/async-storage`. |
| Bun 1.4.2 emits `bun.lock` (not `bun.lockb`) | EAS detects bun from this file. Commit it. |
| `expo-sqlite` has a DevTools inspector (Shift+M in the Expo CLI) | Use it to inspect the DB while developing instead of writing ad-hoc log statements. |

---

## File Structure

Files created by this plan, and the single responsibility of each:

```
app/                              Expo Router routes
  _layout.tsx                     Root layout: providers + notification bootstrap
  (tabs)/
    _layout.tsx                   Tabs shell
    index.tsx                     Countdown list/grid screen
    settings.tsx                  Settings + theme gallery entry
  countdown/[id].tsx              Create/edit a single countdown
  import.tsx                      Calendar import picker (modal)
  share/[id].tsx                  Share preview / share sheet target

src/
  domain/                         PURE TypeScript. No React, no expo, no SQL.
    types.ts                      All shared types & unions
    dateMath.ts                   daysInMonth, startOfDay, calendarDayDiff, addMonths, addYears, monthsBetween, yearsBetween
    recurrence.ts                 resolveOccurrence()
    countdown.ts                  calculateCountdown()
    format.ts                     formatCountdownValue(), pluralize()
    index.ts                      Barrel export

  data/
    db.ts                         openDatabase + migrate() + user_version handling
    countdownRepo.ts              CRUD over the countdowns table (returns domain types)
    settings.ts                   Key/value settings via expo-sqlite/kv-store

  ui/
    tokens.ts                     Spacing, radii, typography scale, type definitions
    themes.ts                     Theme catalog (id, label, colors) + DEFAULT_THEME_ID
    fonts.ts                      Font registry + FONT_OPTIONS
    ThemeProvider.tsx             React context: active theme + resolved per-countdown colors
    Card.tsx                      Surface primitive
    CountdownText.tsx             Big countdown number + unit label
    Segmented.tsx                 Segmented control primitive
    EmptyState.tsx                Empty/zero-state block

  features/
    countdowns/
      useCountdowns.ts            Repository -> React state, reload trigger
      CountdownCard.tsx           One card in the list/grid
      ViewToggle.tsx              List <-> grid switch
    editor/
      CountdownEditorScreen.tsx   The create/edit form
      DateTimeField.tsx           Date + optional time pickers
      OptionRow.tsx               Label + segmented/picker row
    notifications/
      notificationService.ts      Permission, channel, schedule, cancel, reconcile
      useNotificationBootstrap.ts Sets handler; re-arms reminders on foreground
    calendarImport/
      importEvents.ts             Permission + listEvents + map to Countdown drafts
      ImportScreen.tsx            Picker UI for choosing events
    share/
      shareText.ts                Build the plain-text share payload
      ShareCard.tsx               Off-screen view captured by expo-view-shot
      ShareScreen.tsx             Capture + share flow
    themes/
      ThemeGalleryScreen.tsx      Theme chooser

tests/
  domain/dateMath.test.ts
  domain/recurrence.test.ts
  domain/countdown.test.ts
  domain/format.test.ts

jest.config.js
eslint.config.js
app.json
package.json
tsconfig.json
```

---

## Task 1: Project scaffold with bun

**Files:**
- Create: everything under `D:/AnirudhKille/countdown-app` (project root)
- Delete: `D:/AnirudhKille/countdown-app/node_modules` (stale, contains no `expo`)
- Delete: `D:/AnirudhKille/countdown-app/scripts/reset-project.js` (leftover from an abandoned template run)

**Interfaces:**
- Consumes: nothing
- Produces: a working Expo SDK 57 + bun + jest + ESLint project with the directory guard in place.

- [ ] **Step 1: Remove the stale leftovers**

The existing `node_modules` has 179 packages but **no `expo`**, and there is no `package.json`. It is unusable. Confirm before deleting:

```powershell
Test-Path "D:\AnirudhKille\countdown-app\package.json"   # expect: False
Test-Path "D:\AnirudhKille\countdown-app\node_modules\expo\package.json"   # expect: False
```

```powershell
Remove-Item -Recurse -Force "D:\AnirudhKille\countdown-app\node_modules"
Remove-Item -Recurse -Force "D:\AnirudhKille\countdown-app\scripts"
```

- [ ] **Step 2: Scaffold the Expo project in place**

`create-expo-app` cannot write into a non-empty directory, so scaffold into a sibling temp directory and move the contents up.

```powershell
cd D:\AnirudhKille
bun create expo-app countdown-app-tmp --template blank-typescript
```

Then move everything from the temp folder into `countdown-app`:

```powershell
Move-Item -Path "D:\AnirudhKille\countdown-app-tmp\*" -Destination "D:\AnirudhKille\countdown-app" -Force
Move-Item -Path "D:\AnirudhKille\countdown-app-tmp\.*" -Destination "D:\AnirudhKille\countdown-app" -Force -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "D:\AnirudhKille\countdown-app-tmp"
cd D:\AnirudhKille\countdown-app
bun install
```

- [ ] **Step 3: Verify the SDK version before going further**

```powershell
bunx expo --version
(Get-Content node_modules\expo\package.json -Raw | ConvertFrom-Json).version
```

Expected: SDK **57.x**. If it is 56 or lower, stop and correct the version — the rest of this plan depends on the `db.sql` tagged-template API which landed in 57.

- [ ] **Step 4: Install the runtime dependencies**

```powershell
bun expo install expo-router expo-sqlite expo-notifications expo-calendar expo-sharing expo-view-shot expo-font expo-haptics expo-system-ui expo-crypto expo-status-bar expo-splash-screen react-native-safe-area-context @react-native-community/datetimepicker
bun add -d jest-expo jest @types/jest eslint eslint-config-expo
bun add @expo-google-fonts/inter @expo-google-fonts/space-grotesk @expo-google-fonts/playfair-display @expo-google-fonts/dm-serif-display
```

Notes on this install line:
- `expo install` must be used for every `expo-*` and `expo`-affiliated package so the SDK-matched version resolves. `bun add` is only for third-party packages with no Expo version pin.
- **Dev dependencies use `bun add -d`, not `expo install`.** `expo install jest-expo …` from the first draft of this plan would have written them to `dependencies` and resolved them against the Expo version matrix. `jest-expo` and `eslint` are not Expo SDK packages.
- `expo-status-bar`, `expo-splash-screen` and `react-native-safe-area-context` are required by the code in Tasks 9–10 but were missing from the original list. Without them `app/_layout.tsx` will not resolve its imports.
- `expo-media-library` and `expo-file-system` were in the original list but nothing in the plan imports them — the share flow uses `captureRef`, whose temporary `file://` URI `Sharing.shareAsync` consumes directly. They are deliberately not installed.

Verify no stray lockfiles were created:

```powershell
Get-ChildItem -Filter "*lock*"
```

Expected: only `bun.lock`. Delete `package-lock.json` / `yarn.lock` if any appeared.

- [ ] **Step 5: Configure `app.json`**

```json
{
  "expo": {
    "name": "Countdown",
    "slug": "countdown",
    "scheme": "countdown",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "android": {
      "package": "com.anirudhkille.countdown",
      "adaptiveIcon": { "foregroundImage": "./assets/adaptive-icon.png", "backgroundColor": "#0B0B0F" }
    },
    "ios": {
      "bundleIdentifier": "com.anirudhkille.countdown",
      "supportsTablet": true
    },
    "plugins": [
      "expo-router",
      [
        "expo-notifications",
        {
          "color": "#0B0B0F"
        }
      ],
      [
        "expo-calendar",
        {
          "calendarPermission": "Countdown needs calendar access so you can import events into your countdowns."
        }
      ],
      "expo-font"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

Then register Expo Router as the app entry point. The `blank-typescript` template does **not** do this, and every route in Tasks 10–15 depends on it. Without it the app boots a stale `App.tsx` and no route resolves:

```powershell
# package.json: set the entry point
(Get-Content package.json -Raw) -replace '"main":\s*"index\.ts"', '"main": "expo-router/entry"' | Set-Content package.json
```

Verify:

```powershell
(Get-Content package.json -Raw | ConvertFrom-Json).main
```

Expected: `expo-router/entry`

Delete the template's now-dead entry files:

```powershell
Remove-Item -Force App.tsx, index.ts -ErrorAction SilentlyContinue
```

- [ ] **Step 6: Configure jest**

`jest.config.js`:

```js
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
};
```

- [ ] **Step 7: Configure ESLint with the domain-layer guard**

`eslint.config.js`:

```js
const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    files: ['src/domain/**/*.ts', 'src/domain/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-native', 'expo', 'expo/*', '../data/*', '../../data/*'],
              message:
                'src/domain/ must stay pure TypeScript: no React, no Expo, no data-layer imports. This keeps the date maths testable and reusable by the future native widget.',
            },
          ],
        },
      ],
    },
  },
];
```

- [ ] **Step 8: Verify the toolchain**

```powershell
bun run test
```

Expected: Jest runs and reports "No tests found" (exit code 1 with `--passWithNoTests` absent is expected here; add `"test": "jest"` and confirm no config parse error). Then:

```powershell
bunx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 9: Commit**

```powershell
git init
git add -A
git commit -m "chore: scaffold Expo SDK 57 project with bun"
```

---

## Task 2: Domain types

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/index.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `Recurrence`, `Direction`, `Unit`, `ResolvedUnit`, `Countdown`, `CountdownDraft`, `CountdownValue`, `ThemeId`, `FontKey`

- [ ] **Step 1: Write the types**

`src/domain/types.ts`:

```ts
export type Recurrence = 'none' | 'weekly' | 'monthly' | 'yearly';

export type Direction = 'down' | 'up';

export type Unit = 'auto' | 'days' | 'weeks' | 'months' | 'years';

/** `Unit` with `auto` removed — what `calculateCountdown` actually resolves to. */
export type ResolvedUnit = Exclude<Unit, 'auto'>;

/**
 * A countdown exactly as persisted. `targetDate` is the date the user typed and is
 * NEVER mutated by recurrence resolution — the next occurrence is derived on read.
 */
export interface Countdown {
  id: string;
  title: string;
  notes: string | null;
  /** Epoch ms of the user-entered date. Immutable after creation unless the user edits it. */
  targetDate: number;
  /**
   * Day-of-month remembered so monthly/yearly recurrence does not drift.
   * Jan 31 + 1 month displays Feb 28 but the NEXT occurrence is still Mar 31.
   * `null` means "derive from targetDate".
   */
  anchorDay: number | null;
  recurrence: Recurrence;
  direction: Direction;
  unit: Unit;
  showTime: boolean;
  themeId: string;
  /** Per-countdown colour override; `null` inherits the theme's accent. */
  color: string | null;
  fontFamily: string | null;
  emoji: string | null;
  /** Epoch ms at which the reminder fires; `null` disables reminders for this countdown. */
  remindAt: number | null;
  /** Provenance for events imported from the device calendar. */
  calendarEventId: string | null;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}

/** The subset of fields the editor form owns; `id` is absent when creating. */
export type CountdownDraft = Omit<
  Countdown,
  'id' | 'createdAt' | 'updatedAt' | 'archived' | 'calendarEventId'
> & {
  id?: string;
  calendarEventId?: string | null;
};

export interface CountdownValue {
  /** The unit actually used after resolving `auto`. */
  unit: ResolvedUnit;
  /** Whole units remaining (direction `down`) or elapsed (direction `up`). Always >= 0. */
  value: number;
  /** Days left over below the chosen unit. */
  remainderDays: number;
  /** Total calendar days between anchor and now, for sorting. */
  totalDays: number;
  /**
   * True when there is nothing left to count down to (`down`, occurrence passed) or
   * nothing has been counted up to yet (`up`, occurrence still ahead).
   */
  isPast: boolean;
}

export type ThemeId = string;
export type FontKey = string;
```

`src/domain/index.ts`:

```ts
export * from './types';
export * from './dateMath';
export * from './recurrence';
export * from './countdown';
export * from './format';
```

- [ ] **Step 2: Verify it compiles**

```powershell
bunx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```powershell
git add src/domain
git commit -m "feat(domain): add shared countdown types"
```

---

## Task 3: Date math primitives

**Files:**
- Create: `src/domain/dateMath.ts`
- Test: `tests/domain/dateMath.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `daysInMonth(year: number, month0: number): number`
  - `startOfDay(d: Date): Date`
  - `calendarDayDiff(from: Date, to: Date): number`
  - `addDays(d: Date, days: number): Date`
  - `addMonths(d: Date, months: number, anchorDay?: number): Date`
  - `addYears(d: Date, years: number, anchorDay?: number): Date`
  - `monthsBetween(from: Date, to: Date): number`
  - `yearsBetween(from: Date, to: Date): number`

- [ ] **Step 1: Write the failing tests**

`tests/domain/dateMath.test.ts`:

```ts
import {
  daysInMonth,
  startOfDay,
  calendarDayDiff,
  addDays,
  addMonths,
  addYears,
  monthsBetween,
  yearsBetween,
} from '../../src/domain/dateMath';

const d = (s: string) => new Date(s);

describe('daysInMonth', () => {
  it('returns the correct length including leap years', () => {
    expect(daysInMonth(2024, 1)).toBe(29); // Feb 2024
    expect(daysInMonth(2025, 1)).toBe(28); // Feb 2025
    expect(daysInMonth(2026, 0)).toBe(31); // Jan
    expect(daysInMonth(2026, 3)).toBe(30); // Apr
  });
});

describe('startOfDay', () => {
  it('strips the time component', () => {
    expect(startOfDay(d('2026-03-14T18:45:12')).getHours()).toBe(0);
    expect(startOfDay(d('2026-03-14T00:00:00')).getDate()).toBe(14);
  });
});

describe('calendarDayDiff', () => {
  it('counts midnights, not 24-hour blocks', () => {
    // 6pm today -> 6pm tomorrow is exactly 1 calendar day even though only 24h apart
    expect(calendarDayDiff(d('2026-03-14T18:00:00'), d('2026-03-15T18:00:00'))).toBe(1);
    // late tonight -> early tomorrow morning is still 1 day
    expect(calendarDayDiff(d('2026-03-14T23:59:00'), d('2026-03-15T00:01:00'))).toBe(1);
  });

  it('is negative when `to` is before `from`', () => {
    expect(calendarDayDiff(d('2026-03-15T10:00:00'), d('2026-03-14T10:00:00'))).toBe(-1);
  });

  it('survives a daylight saving transition', () => {
    // US DST starts 2026-03-08: that local day is only 23 hours long.
    // Naive division by 86400000 yields 0.97 -> 1 with rounding; truncation would yield 0.
    expect(calendarDayDiff(d('2026-03-07T12:00:00'), d('2026-03-09T12:00:00'))).toBe(2);
  });
});

describe('addMonths', () => {
  it('clamps the day to the target month length', () => {
    expect(addMonths(d('2026-01-31T09:00:00'), 1).getMonth()).toBe(1); // Feb
    expect(addMonths(d('2026-01-31T09:00:00'), 1).getDate()).toBe(28);
  });

  it('honours anchorDay so the original day is not lost', () => {
    // From the clamped Feb 28, the anchor restores the 31st for March.
    const feb = addMonths(d('2026-01-31T09:00:00'), 1, 31);
    expect(feb.getDate()).toBe(28);
    const mar = addMonths(feb, 1, 31);
    expect(mar.getMonth()).toBe(2);
    expect(mar.getDate()).toBe(31);
  });

  it('crosses year boundaries in both directions', () => {
    expect(addMonths(d('2026-11-15T00:00:00'), 3).getFullYear()).toBe(2027);
    expect(addMonths(d('2026-01-15T00:00:00'), -3).getFullYear()).toBe(2025);
  });

  it('preserves the time of day', () => {
    expect(addMonths(d('2026-01-31T14:30:00'), 1).getHours()).toBe(14);
    expect(addMonths(d('2026-01-31T14:30:00'), 1).getMinutes()).toBe(30);
  });
});

describe('addYears', () => {
  it('clamps Feb 29 to Feb 28 in a non-leap year', () => {
    const r = addYears(d('2024-02-29T00:00:00'), 1);
    expect(r.getFullYear()).toBe(2025);
    expect(r.getDate()).toBe(28);
  });

  it('skips to the next leap year when the anchor day is 29 February', () => {
    // A Feb-29 birthday is observed every four years, not every year on the 28th.
    const r = addYears(d('2024-02-29T00:00:00'), 1, 29);
    expect(r.getFullYear()).toBe(2028);
    expect(r.getMonth()).toBe(1);
    expect(r.getDate()).toBe(29);
  });
});

describe('monthsBetween', () => {
  it('counts complete months only', () => {
    expect(monthsBetween(d('2026-01-01T00:00:00'), d('2026-03-01T00:00:00'))).toBe(2);
    expect(monthsBetween(d('2026-01-01T00:00:00'), d('2026-02-28T00:00:00'))).toBe(1);
  });

  it('does not count a month that has not completed', () => {
    expect(monthsBetween(d('2026-01-31T00:00:00'), d('2026-02-28T00:00:00'))).toBe(0);
  });

  it('requires the time of day to match when the day-of-month is equal', () => {
    expect(monthsBetween(d('2026-01-15T12:00:00'), d('2026-02-15T06:00:00'))).toBe(0);
    expect(monthsBetween(d('2026-01-15T06:00:00'), d('2026-02-15T12:00:00'))).toBe(1);
  });
});

describe('yearsBetween', () => {
  it('counts complete years only', () => {
    expect(yearsBetween(d('2020-06-01T00:00:00'), d('2026-06-01T00:00:00'))).toBe(6);
    expect(yearsBetween(d('2026-06-02T00:00:00'), d('2026-06-01T00:00:00'))).toBe(0);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```powershell
bun run test tests/domain/dateMath.test.ts
```

Expected: FAIL — "Cannot find module '../../src/domain/dateMath'".

- [ ] **Step 3: Implement**

`src/domain/dateMath.ts`:

```ts
const MS_PER_DAY = 86_400_000;

/** Length of `month0` (0-indexed) in `year`. */
export function daysInMonth(year: number, month0: number): number {
  // Day 0 of the following month is the last day of this one.
  return new Date(year, month0 + 1, 0).getDate();
}

/** Local midnight on the same calendar day. */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Number of calendar days from `from` to `to`, measured between local midnights.
 *
 * Deliberately NOT `Math.trunc((to - from) / MS_PER_DAY)`: that treats every day as
 * exactly 24 hours and breaks across daylight saving transitions. Both inputs are
 * normalised to local midnight first, so a 23-hour or 25-hour DST day still counts
 * as exactly one day.
 */
export function calendarDayDiff(from: Date, to: Date): number {
  const a = startOfDay(from).getTime();
  const b = startOfDay(to).getTime();
  return Math.round((b - a) / MS_PER_DAY);
}

function withClampedDay(year: number, month0: number, day: number, source: Date): Date {
  const clamped = Math.min(day, daysInMonth(year, month0));
  return new Date(
    year,
    month0,
    clamped,
    source.getHours(),
    source.getMinutes(),
    source.getSeconds(),
    source.getMilliseconds()
  );
}

export function addDays(d: Date, days: number): Date {
  return withClampedDay(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() + days,
    d
  );
}

/**
 * Add `months`, clamping the day-of-month into the target month.
 *
 * `anchorDay` preserves the caller's intended day-of-month across the clamp, so a
 * 31st-of-the-month event lands on the 28th in February but returns to the 31st in
 * March instead of drifting permanently.
 */
export function addMonths(d: Date, months: number, anchorDay?: number): Date {
  const totalMonths = d.getFullYear() * 12 + d.getMonth() + months;
  const year = Math.floor(totalMonths / 12);
  const month0 = ((totalMonths % 12) + 12) % 12;
  return withClampedDay(year, month0, anchorDay ?? d.getDate(), d);
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Add `years`, clamping the day-of-month.
 *
 * A February 29 anchor is preserved by advancing to the next leap year rather than
 * settling on February 28 forever — otherwise a leap-day birthday would only ever
 * be observed on the 28th.
 */
export function addYears(d: Date, years: number, anchorDay?: number): Date {
  const anchor = anchorDay ?? d.getDate();
  const month0 = d.getMonth();
  let year = d.getFullYear() + years;

  if (anchor === 29 && month0 === 1) {
    const inLeapYear = isLeapYear(year);
    if (!inLeapYear) {
      while (!isLeapYear(year)) year += 1;
    }
    return withClampedDay(year, month0, 29, d);
  }

  return withClampedDay(year, month0, anchor, d);
}

function timeOfDay(d: Date): number {
  return d.getHours() * 3_600_000 + d.getMinutes() * 60_000 + d.getSeconds() * 1000;
}

/** Complete calendar months from `from` to `to`. Negative when `to` precedes `from`. */
export function monthsBetween(from: Date, to: Date): number {
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) {
    months -= 1;
  } else if (to.getDate() === from.getDate() && timeOfDay(to) < timeOfDay(from)) {
    months -= 1;
  }
  return months;
}

/** Complete calendar years from `from` to `to`. */
export function yearsBetween(from: Date, to: Date): number {
  return Math.floor(monthsBetween(from, to) / 12);
}

export { MS_PER_DAY };
```

- [ ] **Step 4: Run the tests to verify they pass**

```powershell
bun run test tests/domain/dateMath.test.ts
```

Expected: PASS, all suites green.

- [ ] **Step 5: Lint the domain boundary**

```powershell
bunx eslint src/domain --max-warnings=0
```

Expected: no output (clean).

- [ ] **Step 6: Commit**

```powershell
git add src/domain tests/domain
git commit -m "feat(domain): add DST-safe calendar date math primitives"
```

---

## Task 4: Recurrence engine

**Files:**
- Create: `src/domain/recurrence.ts`
- Test: `tests/domain/recurrence.test.ts`

**Interfaces:**
- Consumes: `addDays`, `addMonths`, `addYears` from Task 3; `Recurrence` from Task 2
- Produces: `resolveOccurrence(targetDate: number, recurrence: Recurrence, now: number, anchorDay: number | null): number`

- [ ] **Step 1: Write the failing tests**

`tests/domain/recurrence.test.ts`:

```ts
import { resolveOccurrence } from '../../src/domain/recurrence';

const ms = (s: string) => new Date(s).getTime();
const iso = (n: number) => new Date(n).toISOString().slice(0, 10);

describe('resolveOccurrence', () => {
  it('returns the target unchanged for a one-off event', () => {
    const t = ms('2026-12-25T00:00:00');
    expect(resolveOccurrence(t, 'none', ms('2026-03-01T00:00:00'), null)).toBe(t);
  });

  it('returns a one-off event unchanged even after it has passed', () => {
    const t = ms('2020-01-01T00:00:00');
    expect(resolveOccurrence(t, 'none', ms('2026-03-01T00:00:00'), null)).toBe(t);
  });

  it('advances weekly past the current occurrence', () => {
    const anchor = ms('2026-01-01T09:00:00'); // a Thursday
    const r = resolveOccurrence(anchor, 'weekly', ms('2026-03-04T12:00:00'), null);
    expect(iso(r)).toBe('2026-03-05');
  });

  it('advances yearly for a birthday', () => {
    const anchor = ms('1990-06-15T00:00:00');
    const r = resolveOccurrence(anchor, 'yearly', ms('2026-06-16T00:00:00'), 15);
    expect(iso(r)).toBe('2027-06-15');
  });

  it('does not drift a 31st-of-the-month event across a short month', () => {
    const anchor = ms('2026-01-31T00:00:00');
    const r = resolveOccurrence(anchor, 'monthly', ms('2026-02-15T00:00:00'), 31);
    expect(iso(r)).toBe('2026-02-28');
  });

  it('returns to the 31st the following month rather than staying on the 28th', () => {
    const anchor = ms('2026-01-31T00:00:00');
    const r = resolveOccurrence(anchor, 'monthly', ms('2026-02-28T12:00:00'), 31);
    expect(iso(r)).toBe('2026-03-31');
  });

  it('keeps a leap-day birthday on the leap day', () => {
    const anchor = ms('2024-02-29T00:00:00');
    const r = resolveOccurrence(anchor, 'yearly', ms('2026-06-01T00:00:00'), 29);
    expect(iso(r)).toBe('2028-02-29');
  });

  it('derives the anchor day from targetDate when anchorDay is null', () => {
    const anchor = ms('2026-01-20T00:00:00');
    const r = resolveOccurrence(anchor, 'monthly', ms('2026-02-25T00:00:00'), null);
    expect(iso(r)).toBe('2026-03-20');
  });

  it('terminates instead of looping forever on a pathological recurrence', () => {
    // `weekly` from 1970 to 2026 is ~2900 steps; the guard must still return promptly.
    const anchor = ms('1970-01-01T00:00:00');
    const started = Date.now();
    const r = resolveOccurrence(anchor, 'weekly', ms('2026-03-01T00:00:00'), null);
    expect(Date.now() - started).toBeLessThan(1000);
    expect(iso(r)).toBe('2026-03-04');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```powershell
bun run test tests/domain/recurrence.test.ts
```

Expected: FAIL — "Cannot find module '../../src/domain/recurrence'".

- [ ] **Step 3: Implement**

`src/domain/recurrence.ts`:

```ts
import type { Recurrence } from './types';
import { addDays, addMonths, addYears } from './dateMath';

/**
 * Upper bound on resolution steps. Weekly recurrence over a 50-year span is under
 * 3000 steps, so 5000 is generous; the cap exists purely so a corrupt row can never
 * spin the render loop.
 */
const MAX_ITERATIONS = 5000;

function step(date: Date, recurrence: Exclude<Recurrence, 'none'>, anchor: number): Date {
  switch (recurrence) {
    case 'weekly':
      return addDays(date, 7);
    case 'monthly':
      return addMonths(date, 1, anchor);
    case 'yearly':
      return addYears(date, 1, anchor);
  }
}

/**
 * The occurrence of `targetDate` that is still upcoming at `now`.
 *
 * `targetDate` is the user-entered date and is never mutated: this function derives
 * the next occurrence on every read. That is why editing an event in 2027 still
 * shows the 2026 date the user originally typed instead of a silently advanced one.
 */
export function resolveOccurrence(
  targetDate: number,
  recurrence: Recurrence,
  now: number,
  anchorDay: number | null
): number {
  if (recurrence === 'none') return targetDate;

  const anchor = anchorDay ?? new Date(targetDate).getDate();
  let current = new Date(targetDate);

  for (let i = 0; i < MAX_ITERATIONS; i += 1) {
    if (current.getTime() > now) break;
    current = step(current, recurrence, anchor);
  }

  return current.getTime();
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```powershell
bun run test tests/domain/recurrence.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/domain tests/domain
git commit -m "feat(domain): add recurrence resolution with day-anchor preservation"
```

---

## Task 5: Countdown calculation and formatting

**Files:**
- Create: `src/domain/countdown.ts`
- Create: `src/domain/format.ts`
- Test: `tests/domain/countdown.test.ts`
- Test: `tests/domain/format.test.ts`

**Interfaces:**
- Consumes: `calendarDayDiff`, `addDays`, `addMonths`, `addYears`, `monthsBetween`, `yearsBetween` (Task 3); `Direction`, `Unit`, `ResolvedUnit`, `CountdownValue` (Task 2)
- Produces:
  - `calculateCountdown(input: { occurrence: number; now: number; direction: Direction; unit: Unit; anchorDay?: number | null }): CountdownValue`
  - `formatCountdownValue(value: number): string`
  - `formatUnitLabel(unit: ResolvedUnit, count: number, direction: Direction): string`

- [ ] **Step 1: Write the failing tests**

`tests/domain/countdown.test.ts`:

```ts
import { calculateCountdown } from '../../src/domain/countdown';

const ms = (s: string) => new Date(s).getTime();

const calc = (occurrence: string, now: string, extra: object = {}) =>
  calculateCountdown({ occurrence: ms(occurrence), now: ms(now), direction: 'down', unit: 'auto', ...extra });

describe('calculateCountdown — auto unit selection', () => {
  it('uses days for anything under a month', () => {
    const r = calc('2026-03-25T00:00:00', '2026-03-14T00:00:00');
    expect(r.unit).toBe('days');
    expect(r.value).toBe(11);
  });

  it('uses months between one month and one year', () => {
    const r = calc('2026-06-14T00:00:00', '2026-03-14T00:00:00');
    expect(r.unit).toBe('months');
    expect(r.value).toBe(3);
  });

  it('uses years at one year or more', () => {
    const r = calc('2027-03-14T00:00:00', '2026-03-14T00:00:00');
    expect(r.unit).toBe('years');
    expect(r.value).toBe(1);
  });

  it('never auto-selects weeks', () => {
    // 90 days out: must read "3 months", not "12 weeks".
    const r = calc('2026-06-12T00:00:00', '2026-03-14T00:00:00');
    expect(r.unit).toBe('months');
  });
});

describe('calculateCountdown — explicit units', () => {
  it('honours an explicit weeks unit', () => {
    const r = calc('2026-05-13T00:00:00', '2026-03-14T00:00:00', { unit: 'weeks' });
    expect(r.unit).toBe('weeks');
    // 2026-03-14 -> 2026-05-13 is 60 calendar days. 60 / 7 = 8 whole weeks, 4 days left.
    expect(r.totalDays).toBe(60);
    expect(r.value).toBe(8);
    expect(r.remainderDays).toBe(4);
  });

  it('honours an explicit days unit', () => {
    const r = calc('2026-03-14T00:00:00', '2026-03-04T00:00:00', { unit: 'days' });
    expect(r.unit).toBe('days');
    expect(r.value).toBe(10);
  });
});

describe('calculateCountdown — calendar days', () => {
  it('shows 1 for an event later today', () => {
    const r = calc('2026-03-14T18:00:00', '2026-03-14T09:00:00');
    expect(r.value).toBe(0);
    expect(r.isPast).toBe(false);
  });

  it('shows 1 for an event at 6pm tomorrow, all day tomorrow', () => {
    const r = calc('2026-03-15T18:00:00', '2026-03-14T09:00:00');
    expect(r.value).toBe(1);
  });

  it('does not flip to 0 at midnight before a tomorrow event', () => {
    const evening = calc('2026-03-15T18:00:00', '2026-03-14T23:59:00');
    const midnight = calc('2026-03-15T18:00:00', '2026-03-15T00:00:00');
    expect(evening.value).toBe(1);
    expect(midnight.value).toBe(1);
  });
});

describe('calculateCountdown — count-up direction', () => {
  it('counts elapsed days since a past event', () => {
    const r = calculateCountdown({
      occurrence: ms('2026-01-14T00:00:00'),
      now: ms('2026-03-14T00:00:00'),
      direction: 'up',
      unit: 'days',
    });
    expect(r.value).toBe(59);
    expect(r.isPast).toBe(false);
  });

  it('reports isPast when the count-up target has not happened yet', () => {
    const r = calculateCountdown({
      occurrence: ms('2027-01-14T00:00:00'),
      now: ms('2026-03-14T00:00:00'),
      direction: 'up',
      unit: 'days',
    });
    expect(r.isPast).toBe(true);
    expect(r.value).toBeGreaterThan(0);
  });
});

describe('calculateCountdown — past events', () => {
  it('flags a missed one-off and still reports the elapsed magnitude', () => {
    const r = calc('2026-03-01T00:00:00', '2026-03-14T00:00:00');
    expect(r.isPast).toBe(true);
    expect(r.value).toBe(13);
  });
});

describe('calculateCountdown — remainder', () => {
  it('reports leftover days below the chosen unit', () => {
    const r = calc('2027-05-14T00:00:00', '2026-03-14T00:00:00');
    expect(r.unit).toBe('years');
    expect(r.value).toBe(1);
    // 2027-03-14 -> 2027-05-14 is 61 days (Mar 17 + Apr 30 + May 14)
    expect(r.remainderDays).toBe(61);
  });
});
```

`tests/domain/format.test.ts`:

```ts
import { formatCountdownValue, formatUnitLabel } from '../../src/domain/format';

describe('formatCountdownValue', () => {
  it('groups thousands', () => {
    expect(formatCountdownValue(1204)).toBe('1,204');
    expect(formatCountdownValue(999)).toBe('999');
  });
});

describe('formatUnitLabel', () => {
  it('pluralises correctly', () => {
    expect(formatUnitLabel('days', 1, 'down')).toBe('day left');
    expect(formatUnitLabel('days', 5, 'down')).toBe('days left');
    expect(formatUnitLabel('days', 1, 'up')).toBe('day since');
    expect(formatUnitLabel('years', 3, 'up')).toBe('years since');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```powershell
bun run test tests/domain/countdown.test.ts tests/domain/format.test.ts
```

Expected: FAIL — "Cannot find module '../../src/domain/countdown'".

- [ ] **Step 3: Implement `countdown.ts`**

`src/domain/countdown.ts`:

```ts
import type { CountdownValue, Direction, ResolvedUnit, Unit } from './types';
import {
  addMonths,
  addYears,
  calendarDayDiff,
  monthsBetween,
  yearsBetween,
} from './dateMath';

export interface CalculateCountdownInput {
  /** Resolved occurrence — the output of `resolveOccurrence`, not the raw anchor. */
  occurrence: number;
  now: number;
  direction: Direction;
  unit: Unit;
  /** Remembered day-of-month; required for correct month/year remainder maths. */
  anchorDay?: number | null;
}

/**
 * `auto` deliberately skips weeks: a countdown 90 days out reads "3 months", never
 * "12 weeks". Weeks remain available as an explicit user choice.
 */
function pickAutoUnit(from: Date, to: Date): ResolvedUnit {
  if (yearsBetween(from, to) >= 1) return 'years';
  if (monthsBetween(from, to) >= 1) return 'months';
  return 'days';
}

/** Days consumed by `value` whole units, used to derive the leftover remainder. */
function consumedDays(
  from: Date,
  unit: ResolvedUnit,
  value: number,
  anchor: number
): number {
  switch (unit) {
    case 'days':
      return value;
    case 'weeks':
      return value * 7;
    case 'months':
      return calendarDayDiff(from, addMonths(from, value, anchor));
    case 'years':
      return calendarDayDiff(from, addYears(from, value, anchor));
  }
}

export function calculateCountdown(input: CalculateCountdownInput): CountdownValue {
  const { occurrence, now, direction, unit } = input;
  const anchor = input.anchorDay ?? new Date(occurrence).getDate();

  // Normalise so `from` is always the earlier instant and `to` the later one.
  const earlier = direction === 'down' ? now : occurrence;
  const later = direction === 'down' ? occurrence : now;

  const from = new Date(earlier);
  const to = new Date(later);

  const totalDays = Math.abs(calendarDayDiff(from, to));
  const chosen: ResolvedUnit = unit === 'auto' ? pickAutoUnit(from, to) : unit;

  let value: number;
  switch (chosen) {
    case 'days':
      value = totalDays;
      break;
    case 'weeks':
      value = Math.floor(totalDays / 7);
      break;
    case 'months':
      value = Math.max(0, monthsBetween(from, to));
      break;
    case 'years':
      value = Math.max(0, yearsBetween(from, to));
      break;
  }

  const remainderDays = Math.max(0, totalDays - consumedDays(from, chosen, value, anchor));

  // Nothing to count toward (`down`, target passed) or nothing counted yet (`up`, target ahead).
  const isPast = direction === 'down' ? occurrence < now : now < occurrence;

  return { unit: chosen, value, remainderDays, totalDays, isPast };
}
```

- [ ] **Step 4: Implement `format.ts`**

`src/domain/format.ts`:

```ts
import type { Direction, ResolvedUnit } from './types';

/** Plural unit word, keyed by the resolved unit. */
const PLURAL: Record<ResolvedUnit, string> = {
  days: 'days',
  weeks: 'weeks',
  months: 'months',
  years: 'years',
};

const SINGULAR: Record<ResolvedUnit, string> = {
  days: 'day',
  weeks: 'week',
  months: 'month',
  years: 'year',
};

/** `1204` -> `"1,204"`. Negative values keep their sign. */
export function formatCountdownValue(value: number): string {
  return Math.abs(Math.trunc(value)).toLocaleString('en-US');
}

/**
 * `"5 days left"` for a countdown, `"5 days since"` for a count-up.
 * The singular form is selected from `count`, so "1 day left" never reads "1 days left".
 */
export function formatUnitLabel(
  unit: ResolvedUnit,
  count: number,
  direction: Direction
): string {
  const word = Math.abs(count) === 1 ? SINGULAR[unit] : PLURAL[unit];
  return direction === 'down' ? `${word} left` : `${word} since`;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

```powershell
bun run test tests/domain/countdown.test.ts tests/domain/format.test.ts
```

Expected: PASS. The `61` in the years-remainder test is verified: 2026-03-14 → 2027-05-14 is 426 calendar days, of which `addYears` consumes 365, leaving 61.

- [ ] **Step 6: Run the whole domain suite**

```powershell
bun run test tests/domain
bunx eslint src/domain --max-warnings=0
bunx tsc --noEmit
```

Expected: all green.

- [ ] **Step 7: Commit**

```powershell
git add src/domain tests/domain
git commit -m "feat(domain): add countdown value calculation and formatting"
```

---

## Task 6: SQLite database and migrations

**Files:**
- Create: `src/data/db.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `getDb(): Promise<SQLite.SQLiteDatabase>` — memoised connection, runs migrations on first call
  - `DATABASE_VERSION` (currently `2`)
  - `CountdownRow` interface

- [ ] **Step 1: Implement `db.ts`**

```ts
import * as SQLite from 'expo-sqlite';

/** Bump this whenever a migration is appended below. */
export const DATABASE_VERSION = 2;

export interface CountdownRow {
  id: string;
  title: string;
  notes: string | null;
  target_date: number;
  anchor_day: number | null;
  recurrence: string;
  direction: string;
  unit: string;
  show_time: number;
  theme_id: string;
  color: string | null;
  font_family: string | null;
  emoji: string | null;
  remind_at: number | null;
  calendar_event_id: string | null;
  archived: number;
  created_at: number;
  updated_at: number;
}

let connection: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;

  if (version === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE countdowns (
        id                TEXT PRIMARY KEY NOT NULL,
        title             TEXT NOT NULL,
        notes             TEXT,
        target_date       INTEGER NOT NULL,
        anchor_day        INTEGER,
        recurrence        TEXT NOT NULL DEFAULT 'none',
        direction         TEXT NOT NULL DEFAULT 'down',
        unit              TEXT NOT NULL DEFAULT 'auto',
        show_time         INTEGER NOT NULL DEFAULT 0,
        theme_id          TEXT NOT NULL DEFAULT 'default',
        color             TEXT,
        font_family       TEXT,
        emoji             TEXT,
        remind_at         INTEGER,
        calendar_event_id TEXT,
        archived          INTEGER NOT NULL DEFAULT 0,
        created_at        INTEGER NOT NULL,
        updated_at        INTEGER NOT NULL
      );

      CREATE INDEX idx_countdowns_archived ON countdowns (archived);
      CREATE INDEX idx_countdowns_remind_at ON countdowns (remind_at);
    `);
    version = 1;
  }

  // v1 -> v2: `anchor_day` was added so monthly/yearly recurrence stops drifting.
  // It is written on save; existing rows fall back to deriving it from `target_date`.
  if (version === 1) {
    await db.execAsync('ALTER TABLE countdowns ADD COLUMN anchor_day INTEGER;');
    version = 2;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!connection) {
    connection = SQLite.openDatabaseAsync('countdown.db').then(async (db) => {
      await migrate(db);
      return db;
    });
  }
  return connection;
}
```

- [ ] **Step 2: Verify it type-checks**

```powershell
bunx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Smoke-test the migration in the app**

Start the dev server and open Expo Go on an Android emulator:

```powershell
bunx expo start
```

Confirm the DB exists: press **Shift+M** in the CLI, choose **expo-sqlite**, and verify the `countdowns` table with all 18 columns.

- [ ] **Step 4: Commit**

```powershell
git add src/data
git commit -m "feat(data): add SQLite connection and versioned migrations"
```

---

## Task 7: Countdown repository

**Files:**
- Create: `src/data/countdownRepo.ts`

**Interfaces:**
- Consumes: `getDb` (Task 6); `Countdown`, `CountdownDraft`, `Recurrence`, `Direction`, `Unit` (Task 2)
- Produces:
  - `listCountdowns(): Promise<Countdown[]>`
  - `getCountdown(id: string): Promise<Countdown | null>`
  - `createCountdown(draft: CountdownDraft): Promise<Countdown>`
  - `updateCountdown(id: string, draft: CountdownDraft): Promise<void>`
  - `deleteCountdown(id: string): Promise<void>`
  - `setArchived(id: string, archived: boolean): Promise<void>`
  - `toRow(c: Countdown): CountdownRow`, `fromRow(r: CountdownRow): Countdown` (exported for tests)

- [ ] **Step 1: Implement the repository**

`src/data/countdownRepo.ts`:

```ts
import { getDb, type CountdownRow } from './db';
import type {
  Countdown,
  CountdownDraft,
  Direction,
  Recurrence,
  Unit,
} from '../domain/types';

export function fromRow(r: CountdownRow): Countdown {
  return {
    id: r.id,
    title: r.title,
    notes: r.notes,
    targetDate: r.target_date,
    anchorDay: r.anchor_day,
    recurrence: r.recurrence as Recurrence,
    direction: r.direction as Direction,
    unit: r.unit as Unit,
    showTime: r.show_time === 1,
    themeId: r.theme_id,
    color: r.color,
    fontFamily: r.font_family,
    emoji: r.emoji,
    remindAt: r.remind_at,
    calendarEventId: r.calendar_event_id,
    archived: r.archived === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toRow(c: Countdown): CountdownRow {
  return {
    id: c.id,
    title: c.title,
    notes: c.notes,
    target_date: c.targetDate,
    anchor_day: c.anchorDay,
    recurrence: c.recurrence,
    direction: c.direction,
    unit: c.unit,
    show_time: c.showTime ? 1 : 0,
    theme_id: c.themeId,
    color: c.color,
    font_family: c.fontFamily,
    emoji: c.emoji,
    remind_at: c.remindAt,
    calendar_event_id: c.calendarEventId,
    archived: c.archived ? 1 : 0,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  };
}

export async function listCountdowns(): Promise<Countdown[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<CountdownRow>(
    'SELECT * FROM countdowns WHERE archived = 0'
  );
  return rows.map(fromRow);
}

export async function getCountdown(id: string): Promise<Countdown | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<CountdownRow>(
    'SELECT * FROM countdowns WHERE id = ?',
    id
  );
  return row ? fromRow(row) : null;
}

export async function createCountdown(
  draft: CountdownDraft,
  id: string,
  now: number
): Promise<Countdown> {
  const record: Countdown = {
    ...draft,
    id,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
  const db = await getDb();
  const r = toRow(record);
  await db.runAsync(
    `INSERT INTO countdowns (
      id, title, notes, target_date, anchor_day, recurrence, direction, unit,
      show_time, theme_id, color, font_family, emoji, remind_at, calendar_event_id,
      archived, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    r.id, r.title, r.notes, r.target_date, r.anchor_day, r.recurrence, r.direction, r.unit,
    r.show_time, r.theme_id, r.color, r.font_family, r.emoji, r.remind_at, r.calendar_event_id,
    r.archived, r.created_at, r.updated_at
  );
  return record;
}

export async function updateCountdown(
  id: string,
  draft: CountdownDraft,
  now: number
): Promise<void> {
  const db = await getDb();
  const r = toRow({ ...draft, id, archived: false, createdAt: now, updatedAt: now });
  await db.runAsync(
    `UPDATE countdowns SET
      title = ?, notes = ?, target_date = ?, anchor_day = ?, recurrence = ?,
      direction = ?, unit = ?, show_time = ?, theme_id = ?, color = ?,
      font_family = ?, emoji = ?, remind_at = ?, calendar_event_id = ?, updated_at = ?
    WHERE id = ?`,
    r.title, r.notes, r.target_date, r.anchor_day, r.recurrence, r.direction, r.unit,
    r.show_time, r.theme_id, r.color, r.font_family, r.emoji, r.remind_at,
    r.calendar_event_id, r.updated_at, id
  );
}

export async function deleteCountdown(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM countdowns WHERE id = ?', id);
}

export async function setArchived(id: string, archived: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE countdowns SET archived = ?, updated_at = ? WHERE id = ?',
    archived ? 1 : 0,
    Date.now(),
    id
  );
}
```

- [ ] **Step 2: Verify by hand in the app**

Create a throwaway row through the SQLite inspector (Shift+M), then confirm it appears in a temporary `console.log(await listCountdowns())` in `app/index.tsx`. **Remove the debug log before committing.**

- [ ] **Step 3: Commit**

```powershell
git add src/data
git commit -m "feat(data): add countdown repository with row mapping"
```

---

## Task 8: Settings and theme catalog

**Files:**
- Create: `src/data/settings.ts`
- Create: `src/ui/themes.ts`
- Create: `src/ui/tokens.ts`
- Create: `src/ui/fonts.ts`

**Interfaces:**
- Consumes: `expo-sqlite/kv-store`
- Produces:
  - `getSetting<T>(key: string, fallback: T): Promise<T>` / `setSetting(key, value): Promise<void>` / `getViewMode() / setViewMode() / getActiveThemeId() / setActiveThemeId()`
  - `Theme { id, label, background, surface, surfaceAlt, text, textMuted, accent, accentText, border }`
  - `THEMES: Theme[]`, `DEFAULT_THEME_ID`, `getTheme(id: string): Theme`
  - `FONT_OPTIONS: { key: string; label: string }[]`

- [ ] **Step 1: Implement `settings.ts`**

```ts
import Storage from 'expo-sqlite/kv-store';
import type { ThemeId } from '../domain/types';

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const raw = await Storage.getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await Storage.setItem(key, JSON.stringify(value));
}

export type ViewMode = 'grid' | 'list';

export const getViewMode = () => getSetting<ViewMode>('viewMode', 'grid');
export const setViewMode = (mode: ViewMode) => setSetting('viewMode', mode);

export const getActiveThemeId = () => getSetting<ThemeId>('activeThemeId', 'default');
export const setActiveThemeId = (id: ThemeId) => setSetting('activeThemeId', id);
```

- [ ] **Step 2: Implement `themes.ts`**

```ts
import type { ThemeId } from '../domain/types';

export interface Theme {
  id: ThemeId;
  label: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  accent: string;
  accentText: string;
  border: string;
}

export const THEMES: Theme[] = [
  {
    id: 'default',
    label: 'Midnight',
    background: '#0B0B0F',
    surface: '#16161D',
    surfaceAlt: '#1F1F29',
    text: '#F5F5F7',
    textMuted: '#8E8E99',
    accent: '#6C5CE7',
    accentText: '#FFFFFF',
    border: '#2A2A36',
  },
  {
    id: 'sunrise',
    label: 'Sunrise',
    background: '#FFF8F0',
    surface: '#FFFFFF',
    surfaceAlt: '#F3E8DA',
    text: '#2B1B12',
    textMuted: '#8A7461',
    accent: '#E8590C',
    accentText: '#FFFFFF',
    border: '#EADFD2',
  },
  {
    id: 'forest',
    label: 'Forest',
    background: '#0E1512',
    surface: '#151E1A',
    surfaceAlt: '#1D2A24',
    text: '#EAF3EE',
    textMuted: '#8AA396',
    accent: '#2F9E68',
    accentText: '#06120C',
    border: '#27362E',
  },
  {
    id: 'mono',
    label: 'Mono',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    surfaceAlt: '#EBEBEB',
    text: '#111111',
    textMuted: '#767676',
    accent: '#111111',
    accentText: '#FFFFFF',
    border: '#DEDEDE',
  },
];

export const DEFAULT_THEME_ID = 'default';

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
```

- [ ] **Step 3: Implement `tokens.ts`**

```ts
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 8, md: 14, lg: 22, pill: 999 } as const;

export const typography = {
  hero: { fontSize: 56, lineHeight: 60, fontWeight: '700' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
} as const;
```

- [ ] **Step 4: Implement `fonts.ts`**

```ts
export interface FontOption {
  key: string;
  label: string;
}

/**
 * `key` values are the `useFonts` map keys registered in `app/_layout.tsx`.
 * The first entry maps to no key at all and resolves to the platform system font.
 */
export const FONT_OPTIONS: FontOption[] = [
  { key: 'System', label: 'System' },
  { key: 'Inter_400Regular', label: 'Inter' },
  { key: 'SpaceGrotesk_700Bold', label: 'Space Grotesk' },
  { key: 'PlayfairDisplay_700Bold', label: 'Playfair' },
  { key: 'DMSerifDisplay_400Regular', label: 'DM Serif' },
];

export function fontFamilyFor(key: string | null | undefined): string | undefined {
  if (!key || key === 'System') return undefined;
  return key;
}
```

- [ ] **Step 5: Verify and commit**

```powershell
bunx tsc --noEmit
git add src/data src/ui
git commit -m "feat(ui): add settings store, theme catalog, tokens and font registry"
```

---

## Task 9: Theme provider and UI primitives

**Files:**
- Create: `src/ui/ThemeProvider.tsx`
- Create: `src/ui/Card.tsx`
- Create: `src/ui/CountdownText.tsx`
- Create: `src/ui/Segmented.tsx`
- Create: `src/ui/EmptyState.tsx`

**Interfaces:**
- Consumes: `getActiveThemeId` (Task 8); `Theme`, `getTheme` (Task 8); `CountdownValue`, `formatCountdownValue`, `formatUnitLabel` (Tasks 2, 5); `typography` (Task 8)
- Produces:
  - `useTheme(): Theme`
  - `<Card theme style>`, `<CountdownText theme value direction fontFamily color />`, `<Segmented theme options value onChange />`, `<EmptyState theme title message />`

- [ ] **Step 1: Implement `ThemeProvider.tsx`**

```tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { getActiveThemeId, setActiveThemeId } from '../data/settings';
import { DEFAULT_THEME_ID, getTheme, type Theme } from './themes';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  setThemeId: (id: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const [themeId, setThemeIdState] = useState<string>(DEFAULT_THEME_ID);

  useEffect(() => {
    let active = true;
    getActiveThemeId().then((id) => {
      if (active) setThemeIdState(id);
    });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: getTheme(themeId),
      isDark: scheme !== 'light',
      setThemeId: async (id: string) => {
        setThemeIdState(id);
        await setActiveThemeId(id);
      },
    }),
    [themeId, scheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx.theme;
}

export function useThemeControls(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeControls must be used inside <ThemeProvider>');
  return ctx;
}
```

- [ ] **Step 2: Implement `Card.tsx`**

```tsx
import React from 'react';
import { StyleSheet, View, type ViewStyle, type StyleProp } from 'react-native';
import { radius, spacing } from './tokens';
import type { Theme } from './themes';

export function Card({
  theme,
  style,
  children,
}: {
  theme: Theme;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
});
```

- [ ] **Step 3: Implement `CountdownText.tsx`**

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatCountdownValue, formatUnitLabel } from '../domain/format';
import type { CountdownValue, Direction } from '../domain/types';
import { typography } from './tokens';
import type { Theme } from './themes';

export function CountdownText({
  theme,
  value,
  direction,
  fontFamily,
  color,
}: {
  theme: Theme;
  value: CountdownValue;
  direction: Direction;
  fontFamily?: string;
  color?: string | null;
}) {
  const tint = color ?? theme.accent;
  return (
    <View style={styles.wrap}>
      <Text style={[typography.hero, { color: tint }, fontFamily ? { fontFamily } : null]}>
        {formatCountdownValue(value.value)}
      </Text>
      <Text style={[typography.label, { color: theme.textMuted }]}>
        {formatUnitLabel(value.unit, value.value, direction)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2 },
});
```

- [ ] **Step 4: Implement `Segmented.tsx`**

```tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography } from './tokens';
import type { Theme } from './themes';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export function Segmented<T extends string>({
  theme,
  options,
  value,
  onChange,
}: {
  theme: Theme;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <View style={[styles.track, { backgroundColor: theme.surfaceAlt }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[
              styles.item,
              selected && { backgroundColor: theme.accent },
            ]}
          >
            <Text
              style={[
                typography.label,
                { color: selected ? theme.accentText : theme.textMuted },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: radius.pill,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
});
```

- [ ] **Step 5: Implement `EmptyState.tsx`**

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from './tokens';
import type { Theme } from './themes';

export function EmptyState({
  theme,
  title,
  message,
}: {
  theme: Theme;
  title: string;
  message: string;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={[typography.title, { color: theme.text }]}>{title}</Text>
      <Text style={[typography.body, { color: theme.textMuted, textAlign: 'center' }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
});
```

- [ ] **Step 6: Verify and commit**

```powershell
bunx tsc --noEmit
git add src/ui
git commit -m "feat(ui): add theme provider and shared primitives"
```

---

## Task 10: Router layout and countdown list/grid screen

**Files:**
- Create: `app/_layout.tsx`
- Create: `app/(tabs)/_layout.tsx`
- Create: `app/(tabs)/index.tsx`
- Create: `src/features/countdowns/useCountdowns.ts`
- Create: `src/features/countdowns/CountdownCard.tsx`
- Create: `src/features/countdowns/ViewToggle.tsx`

**Interfaces:**
- Consumes: `listCountdowns` (Task 7); `resolveOccurrence`, `calculateCountdown` (Tasks 4, 5); `Card`, `CountdownText`, `EmptyState`, `Segmented` (Task 9); `getViewMode`, `setViewMode` (Task 8)
- Produces: `useCountdowns(): { countdowns: Countdown[]; loading: boolean; reload: () => void }`

- [ ] **Step 1: Implement `useCountdowns.ts`**

```ts
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { listCountdowns } from '../../data/countdownRepo';
import type { Countdown } from '../../domain/types';

export function useCountdowns() {
  const [countdowns, setCountdowns] = useState<Countdown[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const rows = await listCountdowns();
    setCountdowns(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
    // Returning from the background can mean a recurrence has rolled over.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void reload();
    });
    return () => sub.remove();
  }, [reload]);

  return { countdowns, loading, reload };
}
```

- [ ] **Step 2: Implement `CountdownCard.tsx`**

```tsx
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Card } from '../../ui/Card';
import { CountdownText } from '../../ui/CountdownText';
import { getTheme } from '../../ui/themes';
import { spacing, typography } from '../../ui/tokens';
import { fontFamilyFor } from '../../ui/fonts';
import { calculateCountdown } from '../../domain/countdown';
import { resolveOccurrence } from '../../domain/recurrence';
import type { Countdown } from '../../domain/types';

export function CountdownCard({
  countdown,
  onPress,
}: {
  countdown: Countdown;
  onPress: () => void;
}) {
  const theme = getTheme(countdown.themeId);

  const value = useMemo(() => {
    const now = Date.now();
    const occurrence = resolveOccurrence(
      countdown.targetDate,
      countdown.recurrence,
      now,
      countdown.anchorDay
    );
    return calculateCountdown({
      occurrence,
      now,
      direction: countdown.direction,
      unit: countdown.unit,
      anchorDay: countdown.anchorDay,
    });
  }, [countdown]);

  const target = new Date(
    resolveOccurrence(
      countdown.targetDate,
      countdown.recurrence,
      Date.now(),
      countdown.anchorDay
    )
  );

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card theme={theme}>
        <Text style={[typography.label, { color: theme.textMuted }]}>
          {countdown.emoji ? `${countdown.emoji} ` : ''}
          {countdown.title}
        </Text>
        <CountdownText
          theme={theme}
          value={value}
          direction={countdown.direction}
          fontFamily={fontFamilyFor(countdown.fontFamily)}
          color={countdown.color}
        />
        <Text style={[typography.caption, { color: theme.textMuted, marginTop: spacing.sm }]}>
          {target.toLocaleDateString(undefined, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
          {countdown.recurrence !== 'none' ? ` · every ${countdown.recurrence.slice(0, -2)}` : ''}
        </Text>
      </Card>
    </Pressable>
  );
}
```

- [ ] **Step 3: Implement `ViewToggle.tsx`**

```tsx
import React from 'react';
import { Segmented } from '../../ui/Segmented';
import type { ViewMode } from '../../data/settings';
import type { Theme } from '../../ui/themes';

export function ViewToggle({
  theme,
  value,
  onChange,
}: {
  theme: Theme;
  value: ViewMode;
  onChange: (next: ViewMode) => void;
}) {
  return (
    <Segmented
      theme={theme}
      value={value}
      onChange={onChange}
      options={[
        { value: 'grid', label: 'Grid' },
        { value: 'list', label: 'List' },
      ]}
    />
  );
}
```

- [ ] **Step 4: Implement `app/_layout.tsx`**

The `ThemeProvider` must wrap the navigator, so screen options are read from a nested `Navigator` component rather than from `RootLayout` itself (which cannot call `useTheme` before the provider exists).

```tsx
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Inter_400Regular } from '@expo-google-fonts/inter';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display';
import { ThemeProvider, useTheme } from '../src/ui/ThemeProvider';

function Navigator() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="countdown/[id]" options={{ title: 'Countdown' }} />
      <Stack.Screen name="import" options={{ presentation: 'modal', title: 'Import' }} />
      <Stack.Screen name="share/[id]" options={{ presentation: 'modal', title: 'Share' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    SpaceGrotesk_700Bold,
    PlayfairDisplay_700Bold,
    DMSerifDisplay_400Regular,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar style="auto" />
        <Navigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 5: Implement `app/(tabs)/_layout.tsx`**

```tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '../../src/ui/ThemeProvider';

export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
        sceneStyle: { backgroundColor: theme.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Countdowns' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
```

- [ ] **Step 6: Implement `app/(tabs)/index.tsx`**

```tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCountdowns } from '../../src/features/countdowns/useCountdowns';
import { CountdownCard } from '../../src/features/countdowns/CountdownCard';
import { ViewToggle } from '../../src/features/countdowns/ViewToggle';
import { EmptyState } from '../../src/ui/EmptyState';
import { getViewMode, setViewMode, type ViewMode } from '../../src/data/settings';
import { radius, spacing, typography } from '../../src/ui/tokens';
import { useTheme } from '../../src/ui/ThemeProvider';
import { calculateCountdown } from '../../src/domain/countdown';
import { resolveOccurrence } from '../../src/domain/recurrence';
import type { Countdown } from '../../src/domain/types';

export default function CountdownsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { countdowns, loading, reload } = useCountdowns();
  const [viewMode, setViewModeState] = useState<ViewMode>('grid');

  useEffect(() => {
    getViewMode().then(setViewModeState);
  }, []);

  const changeView = useCallback(async (next: ViewMode) => {
    setViewModeState(next);
    await setViewMode(next);
  }, []);

  /** Nearest deadline first — the thing the user actually cares about. */
  const sorted = useMemo(() => {
    const now = Date.now();
    return [...countdowns].sort((a, b) => {
      const valueOf = (c: Countdown) => {
        const occurrence = resolveOccurrence(c.targetDate, c.recurrence, now, c.anchorDay);
        return calculateCountdown({
          occurrence,
          now,
          direction: c.direction,
          unit: 'days',
          anchorDay: c.anchorDay,
        }).totalDays;
      };
      return valueOf(a) - valueOf(b);
    });
  }, [countdowns]);

  if (!loading && sorted.length === 0) {
    return (
      <View style={[styles.empty, { paddingTop: insets.top }]}>
        <EmptyState
          theme={theme}
          title="No countdowns yet"
          message="Tap + to add a birthday, a holiday, or anything you're looking forward to."
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[typography.title, { color: theme.text }]}>Countdowns</Text>
        <View style={styles.headerActions}>
          <ViewToggle theme={theme} value={viewMode} onChange={changeView} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add countdown"
            onPress={() => router.push('/countdown/new')}
            style={[styles.add, { backgroundColor: theme.accent }]}
          >
            <Text style={{ color: theme.accentText, fontSize: 24, lineHeight: 28 }}>+</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={sorted}
        key={viewMode}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        columnWrapperStyle={viewMode === 'grid' ? styles.column : undefined}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: insets.bottom + spacing.xl }}
        renderItem={({ item }) => (
          <CountdownCard
            countdown={item}
            onPress={() => {
              void Haptics.selectionAsync();
              router.push(`/countdown/${item.id}`);
            }}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center' },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  column: { gap: spacing.md },
  add: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 7: Verify and commit**

```powershell
bunx tsc --noEmit
bun run start
```

Expected: the app boots in Expo Go with the empty state visible. Tapping `+` navigates to a route that does not exist yet (Task 11) — a router warning is expected at this point and is not a failure.

```powershell
git add app src/features
git commit -m "feat(ui): add countdown list and grid screen with view toggle"
```

---

## Task 11: Countdown editor

**Files:**
- Create: `app/countdown/[id].tsx`
- Create: `src/features/editor/CountdownEditorScreen.tsx`
- Create: `src/features/editor/DateTimeField.tsx`
- Create: `src/features/editor/OptionRow.tsx`

**Interfaces:**
- Consumes: `createCountdown`, `updateCountdown`, `getCountdown`, `deleteCountdown` (Task 7); `Segmented`, `Card` (Task 9); `FONT_OPTIONS` (Task 8); `getTheme` (Task 8); `scheduleForCountdown`, `cancelForCountdown` (Task 12 — **if Task 12 is not yet done, import these from a temporary stub that is replaced in Task 12**)
- Produces: route `/countdown/new` (creates) and `/countdown/:id` (edits)

- [ ] **Step 1: Implement `OptionRow.tsx`**

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '../../ui/tokens';
import type { Theme } from '../../ui/themes';

export function OptionRow({
  theme,
  label,
  hint,
  children,
}: {
  theme: Theme;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={[typography.label, { color: theme.textMuted }]}>{label}</Text>
      {children}
      {hint ? (
        <Text style={[typography.caption, { color: theme.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
});
```

- [ ] **Step 2: Implement `DateTimeField.tsx`**

```tsx
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { radius, spacing, typography } from '../../ui/tokens';
import type { Theme } from '../../ui/themes';

export function DateTimeField({
  theme,
  value,
  showTime,
  onChange,
}: {
  theme: Theme;
  value: Date;
  showTime: boolean;
  onChange: (next: Date) => void;
}) {
  const [mode, setMode] = React.useState<'date' | 'time'>('date');

  const handle = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setMode('date');
    if (event.type === 'dismissed' || !selected) return;
    onChange(selected);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          onPress={() => setMode('date')}
          style={[styles.chip, { backgroundColor: theme.surfaceAlt }]}
        >
          <Text style={[typography.body, { color: theme.text }]}>
            {value.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </Pressable>
        {showTime ? (
          <Pressable
            onPress={() => setMode('time')}
            style={[styles.chip, { backgroundColor: theme.surfaceAlt }]}
          >
            <Text style={[typography.body, { color: theme.text }]}>
              {value.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {mode === 'date' ? (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handle}
        />
      ) : (
        <DateTimePicker
          value={value}
          mode="time"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handle}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
});
```

- [ ] **Step 3: Implement `CountdownEditorScreen.tsx`**

```tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import {
  createCountdown,
  deleteCountdown,
  getCountdown,
  updateCountdown,
} from '../../data/countdownRepo';
import { cancelForCountdown, scheduleForCountdown } from '../notifications/notificationService';
import { resolveOccurrence } from '../../domain/recurrence';
import type { CountdownDraft, Direction, Recurrence, Unit } from '../../domain/types';
import { Card } from '../../ui/Card';
import { Segmented } from '../../ui/Segmented';
import { getTheme, THEMES } from '../../ui/themes';
import { radius, spacing, typography } from '../../ui/tokens';
import { useTheme } from '../../ui/ThemeProvider';
import { FONT_OPTIONS } from '../../ui/fonts';
import { DateTimeField } from './DateTimeField';
import { OptionRow } from './OptionRow';

const REMINDER_OPTIONS: { value: string; label: string; hours: number | null }[] = [
  { value: 'none', label: 'Off', hours: null },
  { value: '1h', label: '1h', hours: 1 },
  { value: '1d', label: '1d', hours: 24 },
  { value: '1w', label: '1w', hours: 168 },
];

export function CountdownEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const activeTheme = useTheme();
  const isNew = id === 'new';

  const [title, setTitle] = useState('');
  const [target, setTarget] = useState(() => new Date());
  const [showTime, setShowTime] = useState(false);
  const [recurrence, setRecurrence] = useState<Recurrence>('none');
  const [direction, setDirection] = useState<Direction>('down');
  const [unit, setUnit] = useState<Unit>('auto');
  const [reminder, setReminder] = useState<string>('none');
  const [themeId, setThemeId] = useState(activeTheme.id);
  const [color, setColor] = useState<string | null>(null);
  const [fontFamily, setFontFamily] = useState<string | null>(null);
  const [emoji, setEmoji] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    getCountdown(id).then((c) => {
      if (!c) return;
      setTitle(c.title);
      setTarget(new Date(c.targetDate));
      setShowTime(c.showTime);
      setRecurrence(c.recurrence);
      setDirection(c.direction);
      setUnit(c.unit);
      setThemeId(c.themeId);
      setColor(c.color);
      setFontFamily(c.fontFamily);
      setEmoji(c.emoji ?? '');
      if (c.remindAt === null) return;
      const hours = Math.round((c.remindAt - c.targetDate) / 3_600_000);
      const match = REMINDER_OPTIONS.find((o) => o.hours === -hours);
      setReminder(match?.value ?? 'none');
    });
  }, [id, isNew]);

  const theme = getTheme(themeId);
  const reminderHours = useMemo(
    () => REMINDER_OPTIONS.find((o) => o.value === reminder)?.hours ?? null,
    [reminder]
  );

  async function save() {
    if (!title.trim()) {
      Alert.alert('Title required', 'Give this countdown a name.');
      return;
    }
    setSaving(true);
    const now = Date.now();
    const targetDate = target.getTime();

    const draft: CountdownDraft = {
      title: title.trim(),
      notes: null,
      targetDate,
      anchorDay: recurrence === 'none' ? null : target.getDate(),
      recurrence,
      direction,
      unit,
      showTime,
      themeId,
      color,
      fontFamily,
      emoji: emoji.trim() || null,
      remindAt:
        reminderHours === null
          ? null
          : targetDate - reminderHours * 3_600_000,
    };

    try {
      if (isNew) {
        const created = await createCountdown(draft, Crypto.randomUUID(), now);
        await scheduleForCountdown(created);
      } else {
        await updateCountdown(id, draft, now);
        const updated = await getCountdown(id);
        await cancelForCountdown(id);
        if (updated) await scheduleForCountdown(updated);
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Delete countdown?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await cancelForCountdown(id);
          await deleteCountdown(id);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
      keyboardShouldPersistTaps="handled"
    >
      <Card theme={theme}>
        <View style={{ gap: spacing.sm }}>
          <Text style={[typography.label, { color: theme.textMuted }]}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Anna's birthday"
            placeholderTextColor={theme.textMuted}
            style={[typography.title, { color: theme.text }]}
          />
          <TextInput
            value={emoji}
            onChangeText={setEmoji}
            placeholder="Emoji (optional)"
            placeholderTextColor={theme.textMuted}
            style={[typography.body, { color: theme.textMuted }]}
          />
        </View>
      </Card>

      <Card theme={theme}>
        <OptionRow theme={theme} label="Date">
          <DateTimeField
            theme={theme}
            value={target}
            showTime={showTime}
            onChange={setTarget}
          />
          <Segmented
            theme={theme}
            value={showTime ? 'time' : 'date'}
            onChange={(v) => setShowTime(v === 'time')}
            options={[
              { value: 'date', label: 'Date only' },
              { value: 'time', label: 'Include time' },
            ]}
          />
        </OptionRow>
      </Card>

      <Card theme={theme}>
        <OptionRow theme={theme} label="Repeats">
          <Segmented
            theme={theme}
            value={recurrence}
            onChange={setRecurrence}
            options={[
              { value: 'none', label: 'Never' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly' },
            ]}
          />
        </OptionRow>

        <OptionRow theme={theme} label="Direction" hint="Count up to track time since an event.">
          <Segmented
            theme={theme}
            value={direction}
            onChange={setDirection}
            options={[
              { value: 'down', label: 'Counting down' },
              { value: 'up', label: 'Counting up' },
            ]}
          />
        </OptionRow>

        <OptionRow theme={theme} label="Show in" hint="Auto picks the largest sensible unit.">
          <Segmented
            theme={theme}
            value={unit}
            onChange={setUnit}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'days', label: 'Days' },
              { value: 'weeks', label: 'Weeks' },
              { value: 'months', label: 'Months' },
              { value: 'years', label: 'Years' },
            ]}
          />
        </OptionRow>

        <OptionRow theme={theme} label="Remind me">
          <Segmented
            theme={theme}
            value={reminder}
            onChange={setReminder}
            options={REMINDER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
        </OptionRow>
      </Card>

      <Card theme={theme}>
        <OptionRow theme={theme} label="Theme">
          <Segmented
            theme={theme}
            value={themeId}
            onChange={setThemeId}
            options={THEMES.map((t) => ({ value: t.id, label: t.label }))}
          />
        </OptionRow>

        <OptionRow theme={theme} label="Font">
          <Segmented
            theme={theme}
            value={fontFamily ?? 'System'}
            onChange={(v) => setFontFamily(v === 'System' ? null : v)}
            options={FONT_OPTIONS.map((f) => ({ value: f.key, label: f.label }))}
          />
        </OptionRow>

        <OptionRow theme={theme} label="Accent colour" hint="Overrides the theme accent for this countdown.">
          <View style={styles.swatches}>
            {[null, '#6C5CE7', '#E8590C', '#2F9E68', '#D6336C', '#1C7ED6'].map((swatch) => (
              <Pressable
                key={swatch ?? 'inherit'}
                accessibilityRole="button"
                accessibilityLabel={swatch ?? 'Theme default'}
                onPress={() => setColor(swatch)}
                style={[
                  styles.swatch,
                  {
                    backgroundColor: swatch ?? theme.surfaceAlt,
                    borderColor: color === swatch ? theme.accent : theme.border,
                    borderWidth: color === swatch ? 3 : 1,
                  },
                ]}
              />
            ))}
          </View>
        </OptionRow>
      </Card>

      <Pressable
        accessibilityRole="button"
        disabled={saving}
        onPress={save}
        style={[styles.primary, { backgroundColor: theme.accent, opacity: saving ? 0.6 : 1 }]}
      >
        <Text style={[typography.title, { color: theme.accentText }]}>Save</Text>
      </Pressable>

      {!isNew ? (
        <Pressable accessibilityRole="button" onPress={confirmDelete} style={styles.delete}>
          <Text style={[typography.body, { color: '#E03131' }]}>Delete countdown</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  primary: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  delete: { paddingVertical: spacing.md, alignItems: 'center' },
  swatches: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  swatch: { width: 40, height: 40, borderRadius: radius.pill },
});
```

- [ ] **Step 4: Implement the route**

`app/countdown/[id].tsx`:

```tsx
import React from 'react';
import { CountdownEditorScreen } from '../../src/features/editor/CountdownEditorScreen';

export default function CountdownRoute() {
  return <CountdownEditorScreen />;
}
```

- [ ] **Step 5: Create a temporary notification stub so this task compiles**

`src/features/notifications/notificationService.ts`:

```ts
import type { Countdown } from '../../domain/types';

/** Placeholder — replaced with the real implementation in Task 12. */
export async function scheduleForCountdown(_countdown: Countdown): Promise<void> {}
export async function cancelForCountdown(_id: string): Promise<void> {}
```

- [ ] **Step 6: Verify and commit**

```powershell
bunx tsc --noEmit
bun run start
```

Manual check: create a countdown with a yearly recurrence on the 31st, set a reminder, and confirm it persists across an app restart.

```powershell
git add app src/features
git commit -m "feat(editor): add create and edit countdown screen"
```

---

## Task 12: Notifications

**Files:**
- Modify: `src/features/notifications/notificationService.ts` (replace the stub)
- Create: `src/features/notifications/useNotificationBootstrap.ts`
- Modify: `app/_layout.tsx`

**Interfaces:**
- Consumes: `Countdown` (Task 2); `listCountdowns` (Task 7); `resolveOccurrence` (Task 4)
- Produces:
  - `ensurePermissions(): Promise<boolean>`
  - `ensureChannel(): Promise<void>`
  - `scheduleForCountdown(countdown: Countdown): Promise<void>`
  - `cancelForCountdown(id: string): Promise<void>`
  - `reconcileAll(): Promise<void>`
  - `useNotificationBootstrap(): void`

- [ ] **Step 1: Replace the stub with the real implementation**

```ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { listCountdowns } from '../../data/countdownRepo';
import { resolveOccurrence } from '../../domain/recurrence';
import type { Countdown } from '../../domain/types';

const CHANNEL_ID = 'countdown-reminders';
/**
 * The reminder identifier embeds the countdown id, so a save can cancel exactly the
 * notifications belonging to that countdown without a side table of ids.
 */
const idFor = (countdownId: string) => `countdown:${countdownId}`;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensurePermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Countdown reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function scheduleForCountdown(countdown: Countdown): Promise<void> {
  await cancelForCountdown(countdown.id);
  if (countdown.remindAt === null) return;
  if (countdown.archived) return;

  // An occurrence that has already rolled past while the app was closed must not fire
  // a stale reminder — re-arm against the live occurrence instead.
  const now = Date.now();
  const occurrence = resolveOccurrence(
    countdown.targetDate,
    countdown.recurrence,
    now,
    countdown.anchorDay
  );
  const fireAt = countdown.remindAt + (occurrence - countdown.targetDate);
  if (fireAt <= now) return;

  const granted = await ensurePermissions();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    identifier: idFor(countdown.id),
    content: {
      title: countdown.title,
      body: countdown.recurrence === 'none' ? 'Your countdown is today.' : 'Your countdown is coming up.',
      data: { countdownId: countdown.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(fireAt),
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelForCountdown(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(idFor(id));
}

/**
 * Re-arm every reminder from scratch. Called on launch and whenever the app returns to
 * the foreground, so occurrences that elapsed in the background are rolled forward
 * rather than leaving a notification pointing at a date in the past.
 */
export async function reconcileAll(): Promise<void> {
  await ensureChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();
  const countdowns = await listCountdowns();
  for (const countdown of countdowns) {
    await scheduleForCountdown(countdown);
  }
}
```

- [ ] **Step 2: Implement `useNotificationBootstrap.ts`**

```ts
import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { ensureChannel, ensurePermissions, reconcileAll } from './notificationService';

export function useNotificationBootstrap(): void {
  useEffect(() => {
    void (async () => {
      await ensureChannel();
      await ensurePermissions();
      await reconcileAll();
    })();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void reconcileAll();
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const id = response.notification.request.content.data?.countdownId;
      if (typeof id === 'string') {
        // Deep-link into the editor. Wired in Task 11's route via expo-router.
        console.log('Reminder tapped for', id);
      }
    });

    return () => {
      sub.remove();
      responseSub.remove();
    };
  }, []);
}
```

- [ ] **Step 3: Wire it into the root layout**

Add to `app/_layout.tsx`, inside `Navigator`:

```tsx
import { useNotificationBootstrap } from '../src/features/notifications/useNotificationBootstrap';

// ...inside Navigator, before the return:
useNotificationBootstrap();
```

- [ ] **Step 4: Verify manually on an Android emulator**

1. Create a countdown 2 days out with a `1d` reminder.
2. Confirm via `adb shell dumpsys notification` that a scheduled alarm exists.
3. Kill the app (`adb shell am force-stop <package>`), wait, relaunch, and confirm the alarm is still scheduled.

This is the behaviour that is easy to get subtly wrong, so do not skip it.

- [ ] **Step 5: Commit**

```powershell
git add src/features app
git commit -m "feat(notifications): schedule and reconcile per-countdown reminders"
```

---

## Task 13: Settings screen and theme gallery

**Files:**
- Create: `app/(tabs)/settings.tsx`
- Create: `src/features/themes/ThemeGalleryScreen.tsx`

**Interfaces:**
- Consumes: `useThemeControls` (Task 9); `THEMES`, `getTheme` (Task 8); `Segmented`, `Card` (Task 9)
- Produces: route `/settings` with a live theme switcher

- [ ] **Step 1: Implement `ThemeGalleryScreen.tsx`**

```tsx
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useThemeControls } from '../../ui/ThemeProvider';
import { THEMES } from '../../ui/themes';
import { radius, spacing, typography } from '../../ui/tokens';

export function ThemeGalleryScreen() {
  const { theme, setThemeId } = useThemeControls();

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
      {THEMES.map((candidate) => {
        const active = candidate.id === theme.id;
        return (
          <Pressable
            key={candidate.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => void setThemeId(candidate.id)}
            style={[styles.tile, { borderColor: active ? candidate.accent : candidate.border, borderWidth: active ? 2 : 1 }]}
          >
            <View style={[styles.preview, { backgroundColor: candidate.background }]}>
              <View style={[styles.card, { backgroundColor: candidate.surface }]}>
                <Text style={[typography.label, { color: candidate.textMuted }]}>Birthday</Text>
                <Text style={[typography.hero, { color: candidate.accent, fontSize: 32 }]}>128</Text>
                <Text style={[typography.caption, { color: candidate.textMuted }]}>days left</Text>
              </View>
            </View>
            <Text style={[typography.body, { color: candidate.text }]}>{candidate.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tile: { borderRadius: radius.lg, padding: spacing.sm, gap: spacing.sm },
  preview: { borderRadius: radius.md, padding: spacing.md },
  card: { borderRadius: radius.md, padding: spacing.md },
});
```

- [ ] **Step 2: Implement `app/(tabs)/settings.tsx`**

```tsx
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeGalleryScreen } from '../../src/features/themes/ThemeGalleryScreen';
import { Card } from '../../src/ui/Card';
import { typography } from '../../src/ui/tokens';
import { useTheme } from '../../src/ui/ThemeProvider';

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingTop: insets.top + spacing.md }}
    >
      <Text style={[typography.title, { color: theme.text }]}>Themes</Text>
      <ThemeGalleryScreen />

      <Card theme={theme}>
        <View style={{ gap: spacing.xs }}>
          <Text style={[typography.label, { color: theme.textMuted }]}>About</Text>
          <Text style={[typography.body, { color: theme.text }]}>
            All countdowns are stored on this device. Nothing is uploaded and no account is required.
          </Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({});
```

- [ ] **Step 3: Verify and commit**

```powershell
bunx tsc --noEmit
git add app src/features
git commit -m "feat(ui): add settings screen with live theme gallery"
```

---

## Task 14: Calendar import

**Files:**
- Create: `src/features/calendarImport/importEvents.ts`
- Create: `src/features/calendarImport/ImportScreen.tsx`
- Create: `app/import.tsx`

**Interfaces:**
- Consumes: `expo-calendar` (new SDK 57 API); `createCountdown` (Task 7); `scheduleForCountdown` (Task 12)
- Produces: `listImportableEvents(from: Date, to: Date): Promise<ImportableEvent[]>`

> **Environment constraint:** `expo-calendar` is unsupported in Expo Go. This feature requires a development build (`bun expo prebuild` then `bun expo run:android`, or an EAS development build). All other features work in Expo Go.

- [ ] **Step 1: Implement `importEvents.ts`**

The SDK 57 API is class-based. `getCalendarsAsync`, `getEventsAsync` and the other `*Async` top-level functions are **deprecated and throw at runtime** in SDK 57 — do not use them.

```ts
import * as Calendar from 'expo-calendar';

export interface ImportableEvent {
  id: string;
  title: string;
  date: number;
  allDay: boolean;
  notes: string | null;
}

export async function hasCalendarPermission(): Promise<boolean> {
  const status = await Calendar.getCalendarPermissions();
  if (status.granted) return true;
  const requested = await Calendar.requestCalendarPermissions();
  return requested.granted;
}

export async function listImportableEvents(
  from: Date,
  to: Date
): Promise<ImportableEvent[]> {
  const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
  if (calendars.length === 0) return [];

  const events = await Calendar.listEvents(calendars, from, to);

  return events
    .map((e) => ({
      id: e.id,
      title: e.title,
      date: new Date(e.startDate).getTime(),
      allDay: e.allDay,
      notes: e.notes,
    }))
    // All-day events recur every year, which is what people actually want from a
    // "birthdays" or "holidays" import.
    .sort((a, b) => a.date - b.date);
}
```

- [ ] **Step 2: Implement `ImportScreen.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { createCountdown } from '../../data/countdownRepo';
import { scheduleForCountdown } from '../notifications/notificationService';
import { getTheme } from '../../ui/themes';
import { spacing, typography } from '../../ui/tokens';
import { useTheme } from '../../ui/ThemeProvider';
import { hasCalendarPermission, listImportableEvents, type ImportableEvent } from './importEvents';

export function ImportScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [events, setEvents] = useState<ImportableEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const granted = await hasCalendarPermission();
      if (!granted) {
        Alert.alert(
          'Calendar access needed',
          'Grant calendar access to pick events from your device.'
        );
        setLoading(false);
        return;
      }
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear() + 2, now.getMonth() + 1, 1);
      setEvents(await listImportableEvents(start, end));
      setLoading(false);
    })();
  }, []);

  async function importEvent(event: ImportableEvent) {
    const now = Date.now();
    const date = new Date(event.date);
    const created = await createCountdown(
      {
        title: event.title,
        notes: event.notes,
        targetDate: event.date,
        anchorDay: date.getDate(),
        recurrence: event.allDay ? 'yearly' : 'none',
        direction: 'down',
        unit: 'auto',
        showTime: !event.allDay,
        themeId: theme.id,
        color: null,
        fontFamily: null,
        emoji: null,
        remindAt: null,
        calendarEventId: event.id,
      },
      Crypto.randomUUID(),
      now
    );
    await scheduleForCountdown(created);
    router.back();
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {loading ? (
        <Text style={[typography.body, { color: theme.textMuted, padding: spacing.lg }]}>
          Reading your calendar…
        </Text>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => void importEvent(item)}
              style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[typography.body, { color: theme.text }]}>{item.title}</Text>
                <Text style={[typography.caption, { color: theme.textMuted }]}>
                  {new Date(item.date).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                  {item.allDay ? ' · all day' : ''}
                </Text>
              </View>
              <Text style={[typography.title, { color: theme.accent }]}>+</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
```

- [ ] **Step 3: Implement `app/import.tsx`**

```tsx
import React from 'react';
import { ImportScreen } from '../src/features/calendarImport/ImportScreen';

export default function ImportRoute() {
  return <ImportScreen />;
}
```

- [ ] **Step 4: Add the entry point to the home screen**

In `app/(tabs)/index.tsx`, add a second header button next to the `+`:

```tsx
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Import from calendar"
  onPress={() => router.push('/import')}
  style={[styles.add, { backgroundColor: theme.surfaceAlt }]}
>
  <Text style={{ color: theme.text, fontSize: 16 }}>⇩</Text>
</Pressable>
```

- [ ] **Step 5: Verify on a development build**

```powershell
bun expo prebuild --platform android
bun expo run:android
```

Confirm: importing an all-day event creates a yearly-recurring countdown; importing a timed event creates a one-off with time enabled.

- [ ] **Step 6: Commit**

```powershell
git add app src/features
git commit -m "feat(import): add calendar event import"
```

> Note: `prebuild` generates `android/`. Commit it or add it to `.gitignore` — pick one and stay consistent. If committed, remember that `expo prebuild` in SDK 57 **clears and regenerates** the native folders by default; pass `--no-clean` to modify in place.

---

## Task 15: Sharing

**Files:**
- Create: `src/features/share/shareText.ts`
- Create: `src/features/share/ShareCard.tsx`
- Create: `src/features/share/ShareScreen.tsx`
- Create: `app/share/[id].tsx`

**Interfaces:**
- Consumes: `getCountdown` (Task 7); `resolveOccurrence`, `calculateCountdown` (Tasks 4, 5); `formatCountdownValue`, `formatUnitLabel` (Task 5); `expo-view-shot`, `expo-sharing`, `expo-file-system`
- Produces: `buildShareText(countdown, value): string` and the `/share/:id` modal route

- [ ] **Step 1: Implement `shareText.ts`**

```ts
import { formatCountdownValue, formatUnitLabel } from '../../domain/format';
import type { Countdown, CountdownValue } from '../../domain/types';

export function buildShareText(countdown: Countdown, value: CountdownValue): string {
  const date = new Date(countdown.targetDate).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return [
    `${countdown.title}`,
    `${formatCountdownValue(value.value)} ${formatUnitLabel(value.unit, value.value, countdown.direction)}`,
    `${countdown.recurrence !== 'none' ? `Repeats ${countdown.recurrence} · ` : ''}${date}`,
  ].join('\n');
}
```

- [ ] **Step 2: Implement `ShareCard.tsx`**

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getTheme } from '../../ui/themes';
import { fontFamilyFor } from '../../ui/fonts';
import { radius, spacing, typography } from '../../ui/tokens';
import { formatCountdownValue, formatUnitLabel } from '../../domain/format';
import type { Countdown, CountdownValue } from '../../domain/types';

/** Rendered off-screen and captured with expo-view-shot. */
export function ShareCard({
  countdown,
  value,
}: {
  countdown: Countdown;
  value: CountdownValue;
}) {
  const theme = getTheme(countdown.themeId);
  const font = fontFamilyFor(countdown.fontFamily);
  return (
    <View style={[styles.card, { backgroundColor: theme.background }]}>
      <Text style={[typography.label, { color: theme.textMuted }]}>
        {countdown.emoji ? `${countdown.emoji} ` : ''}
        {countdown.title}
      </Text>
      <Text style={[typography.hero, { color: countdown.color ?? theme.accent }, font ? { fontFamily: font } : null]}>
        {formatCountdownValue(value.value)}
      </Text>
      <Text style={[typography.body, { color: theme.textMuted }]}>
        {formatUnitLabel(value.unit, value.value, countdown.direction)}
      </Text>
      <View style={[styles.rule, { backgroundColor: theme.border }]} />
      <Text style={[typography.caption, { color: theme.textMuted }]}>
        {new Date(countdown.targetDate).toLocaleDateString(undefined, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 360,
    height: 360,
    padding: spacing.lg,
    borderRadius: radius.lg,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  rule: { height: 1, marginVertical: spacing.md },
});
```

- [ ] **Step 3: Implement `ShareScreen.tsx`**

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'expo-view-shot';
import { getCountdown } from '../../data/countdownRepo';
import { resolveOccurrence } from '../../domain/recurrence';
import { calculateCountdown } from '../../domain/countdown';
import type { Countdown, CountdownValue } from '../../domain/types';
import { radius, spacing, typography } from '../../ui/tokens';
import { getTheme } from '../../ui/themes';
import { buildShareText } from './shareText';
import { ShareCard } from './ShareCard';

export function ShareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const viewRef = useRef<View>(null);
  const [countdown, setCountdown] = useState<Countdown | null>(null);
  const [value, setValue] = useState<CountdownValue | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getCountdown(id).then((c) => {
      if (!c) {
        router.back();
        return;
      }
      setCountdown(c);
      const now = Date.now();
      const occurrence = resolveOccurrence(c.targetDate, c.recurrence, now, c.anchorDay);
      setValue(
        calculateCountdown({
          occurrence,
          now,
          direction: c.direction,
          unit: c.unit,
          anchorDay: c.anchorDay,
        })
      );
    });
  }, [id, router]);

  async function shareText() {
    if (!countdown || !value) return;
    await Share.share({ message: buildShareText(countdown, value) });
  }

  async function shareImage() {
    if (!countdown || !value || !viewRef.current) return;
    setBusy(true);
    try {
      const uri = await captureRef(viewRef, { format: 'png', quality: 1 });
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Sharing unavailable', 'This device cannot share images.');
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: countdown.title });
    } catch (error) {
      Alert.alert('Could not share image', String(error));
    } finally {
      setBusy(false);
    }
  }

  if (!countdown || !value) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const theme = getTheme(countdown.themeId);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.previewWrap} pointerEvents="none">
        <View ref={viewRef} collapsable={false}>
          <ShareCard countdown={countdown} value={value} />
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Pressable
          accessibilityRole="button"
          onPress={shareImage}
          style={[styles.primary, { backgroundColor: theme.accent }]}
        >
          <Text style={[typography.title, { color: theme.accentText }]}>
            {busy ? 'Preparing…' : 'Share as image'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={shareText}
          style={[styles.secondary, { borderColor: theme.border }]}
        >
          <Text style={[typography.body, { color: theme.text }]}>Share as text</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  previewWrap: { alignItems: 'center', paddingTop: spacing.xl },
  primary: { borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  secondary: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
```

`captureRef` returns a temporary `file://` URI that `Sharing.shareAsync` consumes
directly, so no media-library write or file-system copy is needed. The `ref` target is
marked `collapsable={false}` because view-shot cannot capture a view Android has
flattened out of the native hierarchy.

- [ ] **Step 4: Implement `app/share/[id].tsx`**

```tsx
import React from 'react';
import { ShareScreen } from '../../../src/features/share/ShareScreen';

export default function ShareRoute() {
  return <ShareScreen />;
}
```

- [ ] **Step 5: Add the entry point**

In `src/features/countdowns/CountdownCard.tsx`, wrap the card body in a long-press handler, or add a share affordance. Use the long-press approach — it keeps the card clean:

Add to the `Pressable` in `CountdownCard`:

```tsx
onLongPress={() => router.push(`/share/${countdown.id}`)}
```

and add `import { useRouter } from 'expo-router';` plus `const router = useRouter();` at the top of the component.

- [ ] **Step 6: Verify and commit**

```powershell
bunx tsc --noEmit
git add app src/features
git commit -m "feat(share): add image and text sharing for countdowns"
```

---

## Task 16: Final verification

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add ignores**

```
node_modules/
.expo/
dist/
web-build/
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*
.env*.local
.superpowers/
```

- [ ] **Step 2: Run the full verification suite**

```powershell
bun run test
bunx tsc --noEmit
bunx eslint . --max-warnings=0
```

Expected: all domain tests pass, no type errors, no lint errors.

- [ ] **Step 3: Confirm the domain boundary actually holds**

```powershell
bunx eslint src/domain --rule "no-restricted-imports:error" --max-warnings=0
```

Expected: clean. Then deliberately verify the guard bites:

```powershell
# temporary check — add `import { View } from 'react-native';` to src/domain/dateMath.ts
bunx eslint src/domain
# Expected: the no-restricted-imports error described in Global Constraints
# Then revert the import.
```

- [ ] **Step 4: Build a release APK**

```powershell
bun expo prebuild --platform android --clean
bunx eas-cli build --platform android --profile preview
```

- [ ] **Step 5: Manual acceptance checklist**

Verify each on a physical device or emulator:

- [ ] Create, edit, and delete a countdown
- [ ] A yearly countdown on Jan 31 resolves to Feb 28, then back to Mar 31 — not Mar 28
- [ ] A Feb-29 countdown resolves to the next leap day
- [ ] `auto` reads "3 months" at 90 days, never "12 weeks"
- [ ] An event at 6pm tomorrow reads `1` all day tomorrow, including at 00:01
- [ ] Count-up direction shows elapsed time since a past event
- [ ] A reminder fires, and after force-stopping the app the reminder survives a relaunch
- [ ] Switching themes restyles every screen live
- [ ] Grid and list views persist across app restarts
- [ ] Calendar import works (requires a development build)
- [ ] Sharing produces a correct image and correct text
- [ ] **The app works in Expo Go with every feature except calendar import**

- [ ] **Step 6: Commit**

```powershell
git add -A
git commit -m "chore: add gitignore and complete v1"
```

---

## Out of Scope (explicitly)

Do **not** implement these. They are recorded here so they are not "quietly added".

| Excluded | Why |
|---|---|
| **Home screen widget (Android)** | No Expo support exists. Requires a hand-written Kotlin `AppWidgetProvider` + `RemoteViews`/Glance, a JS→native data bridge, and a config plugin. This is a separate v2 project. The `src/domain/` isolation in this plan exists so that project can reuse the same date maths. |
| **Home screen widget (iOS)** | `expo-widgets` exists in SDK 57 but is **iOS-only** and requires a development build. Out of scope per the agreed plan. |
| **Live Activities** | Same reason. |
| **Accounts, backend, cloud sync** | Local-only by decision. The repository boundary in `src/data/` is the seam if that changes later. |
| **Ads and in-app purchases** | The original app is ad-supported with a £14.99/week subscription — a detail its own reviewers complain about. Not in v1. |
| **Import/export of countdowns as a file** | Not in the agreed scope. |
| **Multiple locales / i18n** | v1 is English-only. `formatUnitLabel` is the single place to change. |

---

## Self-Review

**1. Spec coverage.** Every requirement from the agreed scope maps to a task:

| Requirement | Task |
|---|---|
| Expo + bun project | 1 |
| Core countdowns, CRUD, list/grid views | 7, 10, 11 |
| Units days/weeks/months/years + auto | 5 |
| Count-up direction | 5, 11 |
| Recurring events | 4, 11 |
| Local notifications | 12 |
| Per-countdown colours + fonts | 8, 11 |
| Theme gallery | 9, 13 |
| Import from device calendar | 14 |
| Share a countdown | 15 |
| Local-only storage | 6, 7, 8 |

**2. Placeholder scan.** No `TBD`, no "handle edge cases", no "write tests for the above". Every code step contains the actual file contents. The only forward references are deliberate and bounded: Task 11 imports `scheduleForCountdown`/`cancelForCountdown` from a stub created in Step 5 of that same task and replaced in Task 12, and Task 12 extends `app/_layout.tsx` written in Task 10.

**3. Type consistency.** Names used across tasks:
- `resolveOccurrence(targetDate, recurrence, now, anchorDay)` — defined Task 4, used Tasks 10, 11, 12, 15. Consistent.
- `calculateCountdown({ occurrence, now, direction, unit, anchorDay? })` — defined Task 5, used Tasks 10, 15. Consistent.
- `formatCountdownValue` / `formatUnitLabel` — defined Task 5, used Tasks 9, 15. Consistent.
- `scheduleForCountdown` / `cancelForCountdown` / `reconcileAll` — stubbed Task 11, implemented Task 12, used Tasks 11, 12, 14. Consistent.
- `createCountdown(draft, id, now)` — the `id` and `now` parameters are always supplied explicitly rather than generated inside the repository, which keeps `expo-crypto` out of the data layer. Task 7, 11, 14 all pass both.
- `CountdownRow` fields are snake_case and match the Task 6 DDL exactly.
