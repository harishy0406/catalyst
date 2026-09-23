# CAT Smart Operator Assistant — UI Progress Log

This log tracks how the Stitch designs in [`stitch_cat_smart_operator_assistant/`](stitch_cat_smart_operator_assistant/) are being built as a React Native (Expo) app in [`cat-operator-app/`](cat-operator-app/).
Add a new dated entry at the top of **Changelog** whenever UI work lands.

---

## Run it on your phone

```bash
cd frontend/cat-operator-app
npm install          # first time only
npx expo start       # scan the QR code with Expo Go (Android) or the Camera app (iOS)
```

- Your phone and computer must be on the **same Wi-Fi**. If the QR code won't connect (for example on a campus network or behind a VPN), run `npx expo start --tunnel`.
- Install **Expo Go** from the Play Store or App Store. The project is on **Expo SDK 57**, so Expo Go must support SDK 57.
- Press `w` in the terminal to open it in a browser. Save any file and the app on your phone hot-reloads.
- Before you commit, run `npm run typecheck` and `npx expo lint`.

## Connect to the backend

The app talks to the FastAPI backend in [`backend/`](../backend/) on port **3000**.

```bash
# terminal 1 — backend (first time: python3 -m venv ~/.venvs/cat-backend && ~/.venvs/cat-backend/bin/pip install -r requirements.txt)
cd backend
~/.venvs/cat-backend/bin/uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload

# terminal 2 — app
cd frontend/cat-operator-app && npx expo start
```

- **Base URL** (`src/api/client.ts`): `EXPO_PUBLIC_API_URL` if it is set. Otherwise the app uses the Metro host IP on port 3000 (Expo Go on the same Wi-Fi), or `localhost:3000` on web. The login screen shows the URL it is using and whether the API is reachable.
- **Demo logins** (from `backend/app/seed.py`): `OP-4412` / PIN `4412` (expert, CAT-320-01), `OP-8821` / `8821`, `SUP-101` / `1001`. Tap ⇄ to switch operator. Switching clears the PIN.
- **To trigger a live alert**, post telemetry above a rule threshold. The app polls alerts every 10 s:
  ```bash
  curl -X POST localhost:3000/telemetry -H 'content-type: application/json' \
    -d '{"machineId":"CAT-320-01","operatorId":"OP-4412","engineTemp":110,"hydraulicPressure":345,"speed":0,"engineRpm":1800}'
  ```
- **For APK builds**, set `EXPO_PUBLIC_API_URL=http://<laptop-LAN-IP>:3000` before building. Release builds block plain HTTP by default, so the backend needs HTTPS, or `usesCleartextTraffic` has to be enabled through `expo-build-properties`.
- `POST /seed` resets the whole Supabase DB to the demo data. Everyone shares that DB, so only run it on purpose.

## Build an APK (local, no Expo account needed)

`/mnt/data` is NTFS, and Gradle/CMake break on it (symlinks, exec bits). So build from a copy of the project on the Linux (ext4) home drive:

```bash
# 1. sync the source (skip heavy/generated folders)
rsync -a --delete --exclude node_modules --exclude android --exclude ios --exclude .expo \
  /mnt/data/Internship/CAT/cat-hack/frontend/cat-operator-app/ ~/builds/cat-operator-app/
cd ~/builds/cat-operator-app && npm install

# 2. generate the native Android project from app.json
CI=1 npx expo prebuild --platform android --clean --no-install
echo "sdk.dir=$HOME/Android/Sdk" > android/local.properties
# optional: arm64 only (faster) + cap Gradle RAM
sed -i 's/^reactNativeArchitectures=.*/reactNativeArchitectures=arm64-v8a/; s/^org.gradle.jvmargs=.*/org.gradle.jvmargs=-Xmx3g -XX:MaxMetaspaceSize=768m/' android/gradle.properties

# 3. build
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

- Package ID: `com.catalyst.operator` (`app.json → android.package`). Bump `android.versionCode` for each new APK you share.
- The release APK is signed with the **debug keystore** (Expo template default). It's fine for sideloading and testing, but **not for the Play Store**. For the Play Store, create a real keystore or use `eas build -p android`.
### Or: EAS cloud build (no local SDK needed)

The project is linked to Expo: **@anshv/cat-operator-app** (`extra.eas.projectId` in app.json). `eas.json` has these profiles:

| Profile | Output | Use |
|---|---|---|
| `preview` | **APK**, internal distribution | Share or sideload on phones |
| `production` | AAB | Play Store |
| `development` | Dev client | Only needed once you add native modules that Expo Go lacks |

```bash
cd frontend/cat-operator-app
EAS_NO_VCS=1 npx eas-cli@latest build -p android --profile preview
```

- `EAS_NO_VCS=1` uploads the folder as-is, uncommitted changes included, and skips files listed in `.easignore`. Once everything is committed you can drop it.
- The Android keystore is **managed by Expo** (created on the first build). Keep using EAS so every build is signed with the same key; otherwise phones can't update the app in place.
- The EAS server runs `npm ci`, so `package-lock.json` must be in sync with `package.json`. Always add packages with `npx expo install`.
- `eas.json → build.base.node` is pinned to **24.12.0**, the same Node as the dev laptop. EAS defaults to Node 22 (npm 10), and its `npm ci` rejected our npm 11 lockfile (`Missing: @emnapi/core … from lock file`). If you upgrade local Node, update this pin too.
- Build status and the APK download link are at expo.dev → Projects → cat-operator-app → Builds.

---

## Stack

| Concern | Choice |
|---|---|
| Framework | Expo SDK 57 · React Native 0.86 · React 19 · TypeScript (strict) |
| Navigation | Expo Router (file-based, `src/app/`) with a Stack at the root and Tabs for the main shell |
| Fonts | `@expo-google-fonts/barlow-condensed` (headings, labels, metrics) and `@expo-google-fonts/inter` (body text) |
| Icons | `@expo/vector-icons/MaterialIcons`, with Material Symbols names mapped automatically (see `Icon.tsx`) |
| Images | `expo-image`. The Stitch reference photos and the Catalyst logo are in `assets/images/` |
| Branding | Catalyst wordmark (`assest/logo-b.png` → `assets/images/logo-catalyst.png`), used for the app icon, adaptive icon, splash, favicon and `Logo` component |
| State | One React context (`src/state/AppState.tsx`) that loads from the FastAPI backend through `src/api/client.ts`. `src/data/mock.ts` only fills fields the API doesn't expose yet |

No extra native modules are used, so everything runs in **Expo Go** without a development build.

---

## Folder structure

```
cat-operator-app/
├── app.json                  # dark UI, scheme "catoperator", typed routes
├── assets/                   # icon / adaptive icon / splash / favicon (Catalyst logo)
│   └── images/               # logo-catalyst.png + rear-cam + training photos
└── src/
    ├── app/                  # ROUTES ONLY
    │   ├── _layout.tsx       # fonts, splash, SafeArea, AppState provider, root Stack
    │   ├── index.tsx         # redirects to /login
    │   ├── login.tsx         # Screen 1
    │   └── (tabs)/
    │       ├── _layout.tsx   # Tabs + custom TabBar; sub-screens use href:null
    │       ├── home.tsx      # Screen 2
    │       ├── alert.tsx     # Screen 3
    │       ├── safety.tsx    # Screen 4
    │       ├── tasks.tsx     # Screen 5
    │       ├── task/[id].tsx # Screen 6
    │       ├── incident.tsx  # Screen 7
    │       ├── training.tsx  # Screen 8
    │       ├── machine.tsx   # Screen 9
    │       └── profile.tsx   # Screen 10
    ├── components/           # design-system primitives (below)
    ├── data/mock.ts          # all mock telemetry, tasks, events and modules
    ├── data/machines.ts      # fleet catalog, anomaly-model payloads and test scenarios
    ├── state/AppState.tsx    # session, task status, alert, incidents
    └── theme/tokens.ts       # colours, type scale, spacing, touch sizes
```

---

## Design system → code

Source: [`heavy_telematics_display_system/DESIGN.md`](stitch_cat_smart_operator_assistant/heavy_telematics_display_system/DESIGN.md)

| DESIGN.md rule | How the code implements it |
|---|---|
| Colour tokens (surface ladder, CAT gold `#FDB813`, danger, safe green) | `theme/tokens.ts → colors` |
| Barlow Condensed uppercase with wide tracking; Inter for body text | `tokens.type` variants (`headlineXl` … `labelXs`, `metric`, `body*`); `em` letter-spacing converted to px |
| 0px radius everywhere | No `borderRadius` except LED pips |
| 56px minimum and 64px recommended touch targets | `tokens.touch`; `Button` sizes `md`=56 and `lg`=64; `NavRow` 72; `TabBar` 64 |
| Level 1 / Level 2 surface stepping with hard borders, no shadows | `Panel` (level 1 module + header strip), `Cell` (level 2 cell) |
| Hard inset deboss | `Cell debossed`: darker top and left border |
| 45° hazard striping | `HazardStripe`: skewed bars clipped by `overflow:hidden` |
| Critical alert strobe | `alert.tsx → useStrobe`: red ↔ panel background loop |
| LED annunciators | `Pip` (square or round, optional pulse) |
| 6px severity stripe on list rows | `NavRow accent`, queue rows, and safety event rows |
| Data readout: big number with right-aligned gold unit | `Metric` |

### Component catalogue (`src/components/`)

| Component | Purpose |
|---|---|
| `Txt` | Text with a type variant and colour |
| `Icon` | MaterialIcons wrapper that accepts Material Symbols snake_case names. Aliases: `rainy`, `person_alert`, `e911_emergency`, `width` |
| `AppHeader` | Shared top bar: machine title, subtitle, and a warning hotkey that turns red while an alert is active |
| `Screen`, `Row`, `Divider` | Header plus scrolling column with 16px gutters and 12px gaps |
| `Panel` / `Cell` / `Metric` / `Spec` | Modules, cells, telemetry readouts and spec tiles |
| `Button` / `IconButton` | Variants: primary, secondary, outline, critical, safe, ghost; optional hazard top stripe |
| `NavRow` | Hotkey row with icon tile, caption, chevron and optional accent stripe or danger tone |
| `Badge`, `Pip` | Annunciator labels and LED status lights |
| `ProgressBar` | Continuous or segmented |
| `HazardStripe` | Yellow/black 45° stripe |
| `Logo` | Catalyst wordmark, sized by height |
| `TabBar` | Bottom nav (Home / Tasks / Safety / Profile) where the active cell fills solid gold |

---

## Screen status

| # | Screen | Route | Status | Interactions wired |
|---|---|---|---|---|
| 1 | Operator Login | `/login` | ✅ Built | Live clock, operator switch, 4-digit PIN keypad (CLR / ⌫), sign-in loading + toast → Home |
| 2 | Home / Shift Overview | `/home` | ✅ Built | Active-alert banner, task progress from state, hotkeys → Incident / Training / Machine, task deep-links |
| 3 | Active Safety Alert | `/alert` | ✅ Built | Strobing banner, zone threshold bar, CAM feed, **Acknowledge** clears the alert everywhere and logs a safety event |
| 4 | Safety Center | `/safety` | ✅ Built | SAFE/ALERT hero reacts to alert state, event log with "view all" toggle, quick actions |
| 5 | Today's Tasks | `/tasks` | ✅ Built | Current / next / queue built from state, Pause Log, Continue/Resume, tap any task → detail |
| 6 | Task Detail | `/task/[id]` | ✅ Built | Toggleable pre-task checklist gates **Start**; Start / Pause / Complete update the shared task state |
| 7 | Incident Report | `/incident` | ✅ Built | One-touch type grid, severity (HIGH has hazard stripe), macros, press-and-hold voice button, snapshot attach, submit → new `INC-xxxx` |
| 8 | Training Hub | `/training` | ✅ Built | Progress, 3 module cards with photos, Start/In-progress toggle, shift bulletin |
| 9 | Machine Status | `/machine` | ✅ Built | Fleet selector (3 machine images), AI anomaly detection with class probabilities, test scenarios, live telemetry, advisories (dismiss), manual notes |
| 10 | Operator Profile | `/profile` | ✅ Built | Identity and stats, menu rows → Training / Safety / Incident, **Log out** → Login |

**Which tab is highlighted on sub-screens** (matches the mocks): Machine → HOME; Task Detail → TASKS; Alert, Incident and Training → SAFETY.

---

## Deliberate deviations from Stitch

- **Layout is phone-only (portrait).** The Stitch HTML has tablet and desktop breakpoints (`md:`), which aren't carried over yet.
- **Icons:** Material Symbols → MaterialIcons. Four glyphs that don't exist there are aliased (see `Icon.tsx`).
- **Alert state is live.** The app starts with the proximity alert active so the red states are visible. Acknowledging it switches Home, Safety and the header back to normal.
- **Safety Center** shows an ALERT hero while an alert is unacknowledged. The Stitch mock only shows the SAFE state.
- **Native `Alert.alert`** is used as a placeholder for "Sensor re-zero" and "Test siren". It does nothing on web.

---

## Next steps / TODO

- [x] Replace `data/mock.ts` with API calls to `backend/` (auth, tasks, ML prediction, alerts, incidents, training, machine insights)
- [ ] Backend endpoint for machine details (model, engine hours, fuel %); these still come from `data/mock.ts`
- [ ] Backend: fix the anomaly defaults and feature names in `app/schemas/ml.py` and `anomaly_service.py`. The server-side ML checks in `/insights` and `POST /telemetry` currently flag every excavator reading. After that, un-hide the backend AI advisory.
- [ ] Real voice capture (`expo-audio`) and camera snapshot (`expo-camera`) on Incident Report
- [ ] Persist the JWT across app restarts (`expo-secure-store`). Right now it lives in memory only
- [ ] Landscape / in-dash tablet layout (12-column spec in DESIGN.md)
- [ ] Haptics on critical actions (`expo-haptics`)
- [x] Custom app icon and splash (Catalyst logo)

---

## Changelog

### 2026-09-24 — ML outputs and Machine page rebuild
- **Task duration (CatBoost)**: tasks now use `POST /tasks/{id}/estimate` instead of the older `/ml/predict`. Tasks show first, and the estimates fill in when they arrive.
  - Task Detail shows the predicted minutes, colored by risk, plus an **AI Duration Forecast** card with minutes over or under plan, % deviation, the risk badge (On Schedule / Delayed / Accelerated) and the model's confidence label.
  - The task list shows an `AI: N min` chip and an "AI N min" line on queue rows.
- **Machine page** (`/machine`), rebuilt:
  - **Fleet selector** with the three machine images from `assest/` (copied to `assets/images/machines/`). The operator's own machine is marked with a green dot.
  - **Hero** with a large machine image, model, ID, a "Your machine" or "Fleet unit" badge, the health score and an AI status badge.
  - **AI Anomaly Detection** calls the per-type route `POST /ml/anomaly/{excavator|bulldozer|loader}` with the latest `GET /telemetry/{id}` reading. It shows Normal or the anomaly class, confidence, the model's message, the recommended action and the top 4 class probabilities. It re-polls every 10 s while the page is open.
  - **Diagnostic Test Scenarios**: one chip per anomaly class the model can detect (7 excavator, 3 loader, 5 dozer). A chip scores a simulated sensor profile and writes nothing to the backend. **Live** goes back to the real feed.
  - **Live Telemetry**: RPM, engine temp, hydraulics, fuel rate and speed. Out-of-range values are shown in red.
  - Advisories come from `/insights`. The backend's own "AI Predictive Fleet Diagnostics" entry is hidden because the AI panel replaces it (see the backend note below).
  - Key shift metrics show for the operator's own machine only. The hardcoded Quick Inspection panel and the Recalibrate / Acknowledge buttons were removed.
- **Why the app sends a full telemetry payload**: the backend's default feature values are outside the training range. For example, the excavator boom, arm and bucket rates default to 24/22/20, while the "Normal" median is about 0.7. With those defaults the model returns "Aggressive Boom Movement 99.8%" for every input. `src/data/machines.ts` sends the median readings of the Normal class with the live values on top. With that, all 18 scenario checks returned the expected class against the running backend.

### 2026-09-23 — Frontend wired to the FastAPI backend
- New `src/api/client.ts` wraps `fetch` with a Bearer token, auto-detects the base URL and has typed endpoints that match `backend/app/schemas`.
- `AppState` now loads its data from the API:
  - **Login**: `POST /auth/login` with the real operator ID and PIN. Errors show inline, and a live `/health` indicator sits in the telematics box.
  - **Tasks**: `/tasks/today`, sorted so active work comes first. Start, pause and complete go to `/tasks/{id}/start|status|complete`, and complete reports the actual minutes. "Predicted Time" comes from `POST /ml/predict` (Random Forest).
  - **Safety**: `/safety/alerts` is polled every 10 s. Any unacknowledged alert turns on the alert state, and Acknowledge acks each one. Safety events are the alert history, and the Alert and Safety screens show the real alert message.
  - **Incidents**: `GET/POST /incidents`.
  - **Training**: `/training/content` plus `/training/recommendations`. Progress is completed / total. The button goes Start, then Mark Complete (`POST /training/{id}/complete`).
  - **Machine**: `/machines/{id}/insights` supplies the health score badge, anomalies and recommendations as advisories, and the live hydraulic pressure.
- The operator name, skill level and active machine come from the logged-in user instead of the mock.
- The tabs layout sends you to `/login` when no one is signed in.

### 2026-09-23 — Catalyst logo and app manifest
- Picked `assest/logo-b.png` (the 2048px white wordmark with the gold CAT triangle) as the source because the app UI is dark. Keyed its black background into transparency → `assets/images/logo-catalyst.png`.
- Generated the icon set from it (all 1024², dark `#121316` background):
  - `icon.png`: wordmark on a dark tile with a gold hazard bar (iOS and generic icon)
  - `android-icon-foreground.png`: transparent, kept inside the 66% adaptive safe zone. `android-icon-background.png` is solid dark and `android-icon-monochrome.png` is a white silhouette for Android 13 themed icons.
  - `splash-icon.png`: trimmed wordmark. `favicon.png`: 48px.
- `app.json`:
  - Display name changed to **Catalyst**; `ios.icon` and `android.icon` set.
  - `expo-splash-screen` plugin now shows the logo (240px, dark background).
  - Web manifest gets `name`, `shortName`, `themeColor` and `backgroundColor`.
- New `Logo` component. `AppHeader` has a `logo` prop that shows the wordmark in place of the wrench icon and title. The Login screen uses it in the header and in a large brand block above the sign-in card.
- Icon and splash changes only appear in native builds (`eas build` / `expo run:*`). **Expo Go always shows its own icon and splash.** The in-app logo shows everywhere.

### 2026-09-23 — Initial build of all 10 screens
- Scaffolded `cat-operator-app` with `create-expo-app` (blank-typescript, SDK 57) and added Expo Router, fonts, vector icons and expo-image.
- Converted DESIGN.md into `theme/tokens.ts` and built the component library.
- Implemented screens 1–10 with shared in-memory state (tasks, alert, safety events, incidents).
- Downloaded the Stitch reference images into `assets/images/`.
- Checked each screen against the Stitch `screen.png` using headless-Chrome web screenshots. Fixed an overlapping fuel badge and made the Safety Center wording follow the alert state.
- `tsc --noEmit`, `expo lint` and `expo-doctor` (21/21) all pass.
