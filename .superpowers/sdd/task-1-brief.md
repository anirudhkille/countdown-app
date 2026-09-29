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

Expected: SDK **57.x**. If it is 56 or lower, stop and correct the version â€” the rest of this plan depends on the `db.sql` tagged-template API which landed in 57.

- [ ] **Step 4: Install the runtime dependencies**

```powershell
bun expo install expo-router expo-sqlite expo-notifications expo-calendar expo-sharing expo-view-shot expo-font expo-haptics expo-system-ui expo-crypto expo-status-bar expo-splash-screen react-native-safe-area-context @react-native-community/datetimepicker
bun add -d jest-expo jest @types/jest eslint eslint-config-expo
bun add @expo-google-fonts/inter @expo-google-fonts/space-grotesk @expo-google-fonts/playfair-display @expo-google-fonts/dm-serif-display
```

Notes on this install line:
- `expo install` must be used for every `expo-*` and `expo`-affiliated package so the SDK-matched version resolves. `bun add` is only for third-party packages with no Expo version pin.
- **Dev dependencies use `bun add -d`, not `expo install`.** `expo install jest-expo â€¦` from the first draft of this plan would have written them to `dependencies` and resolved them against the Expo version matrix. `jest-expo` and `eslint` are not Expo SDK packages.
- `expo-status-bar`, `expo-splash-screen` and `react-native-safe-area-context` are required by the code in Tasks 9â€“10 but were missing from the original list. Without them `app/_layout.tsx` will not resolve its imports.
- `expo-media-library` and `expo-file-system` were in the original list but nothing in the plan imports them â€” the share flow uses `captureRef`, whose temporary `file://` URI `Sharing.shareAsync` consumes directly. They are deliberately not installed.

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

Then register Expo Router as the app entry point. The `blank-typescript` template does **not** do this, and every route in Tasks 10â€“15 depends on it. Without it the app boots a stale `App.tsx` and no route resolves:

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

