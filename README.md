# Countdown

A local-first countdown app for Android and iOS. Add the dates that matter, pick a unit, and the app keeps the number live. Recurring events roll forward automatically, reminders fire on device, and countdowns can be shared as an image or text.

There is no account, no backend, and no tracking. Everything lives in SQLite on the device.

## Running it

```bash
bun install
bun start            # Expo Go or a development build
bun run typecheck
bun run lint
bun test
```

Reminders and calendar import need a development build. `expo-notifications` and `expo-calendar` are not available in Expo Go on Android.

```bash
bunx expo run:android
# or, in the cloud
bunx eas-cli build --profile development --platform android
```

## What it does

- Countdowns in days, weeks, months, or years, with automatic unit selection
- Count down to a date or up from it
- Weekly, monthly, and yearly repeats that keep the original day of month
- Per-countdown colour, notes, time of day, and reminder
- Grid and list views, sorted by what happens next
- Calendar import for the next two years
- Share a countdown as a rendered card or as text
- Dark and light themes, five countdown typefaces

## How it fits together

```
src/app/          Expo Router routes
src/domain/       Pure date maths, recurrence, countdown formatting
src/data/         SQLite schema, repositories, key-value settings
src/features/     Screen logic: countdowns, editor, notifications, import, share
src/ui/           Theme, tokens, and shared primitives
tests/            Domain and notification unit tests
```

The domain layer has no React, Expo, or SQL imports. Dates are stored as epoch milliseconds. A countdown stores the date the user entered and derives its next occurrence on read, so recurring events never drift between launches. `calendarDayDiff` works on local midnights, which keeps day counts correct across daylight-saving changes.

## Design

The interface is built around an instrument-dial motif: a tick bezel, a progress arc, and the number at the centre. Each countdown can carry its own colour, which is used for the arc.

- Background and text: `#0F1419` / `#F3F1EA` in dark, `#F4F2EC` / `#141A20` in light
- Accent: brass `#D9B44A` (dark) and `#C39A2B` (light)
- Type: Space Grotesk for the masthead, the device's UI face for interface text, and the chosen countdown face for numbers
- Structure comes from hairlines and spacing, not from a border on every element

Theme and font are app-wide settings; colour is per countdown.

## Builds and over-the-air updates

`eas.json` defines three profiles, each with its own channel and environment:

| Profile | Distribution | Channel | Use |
| --- | --- | --- | --- |
| `development` | internal APK | `development` | Dev client with fast refresh |
| `preview` | internal APK | `preview` | Test builds before release |
| `production` | store build | `production` | Play Store / App Store |

`runtimeVersion` follows `appVersion`. JavaScript, styling, and asset changes can ship over the air to a build with the same version. Adding a native module, changing a config plugin, or upgrading the SDK requires a new build and a version bump.

```bash
bunx eas-cli build --profile preview --platform android
bunx eas-cli update --channel preview --environment preview --message "Polish the editor"
bunx eas-cli build --profile production --platform android
bunx eas-cli submit --platform android --profile production
```

An installed build checks for an update on launch and applies it on the next cold start. If a new update does not appear, fully close and reopen the app twice.

## Verification

```bash
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js . --max-warnings=0
node node_modules/jest/bin/jest.js --ci
bunx expo-doctor
```

The domain and notification suites run on every change. Device checks still needed before a store release: reminders after a force-stop, calendar permission and import, share-sheet image quality, and the grid on a narrow screen.

## Known limits

- No Android home-screen widget. Expo has no widget API for Android; that needs a native module or a config plugin.
- Home-screen widgets on iOS would need `expo-widgets` and a development build.
- Reminders are scheduled locally. Reinstalling the app or clearing data removes them.
