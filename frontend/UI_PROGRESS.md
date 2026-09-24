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

- **Deployed backend**: `cat-operator-app/.env` sets `EXPO_PUBLIC_API_URL=http://13.203.66.37` (AWS EC2, Docker, port 80), so `npx expo start` works with no local backend. To use a local backend, put `EXPO_PUBLIC_API_URL=http://<LAN-IP>:3000` in `.env.local`, which overrides `.env`. Because the backend is plain HTTP, `app.json` configures `expo-build-properties` with `android.usesCleartextTraffic: true` so release APKs can reach it. The supervisor dashboard's `BACKEND_URL` default also points to the EC2 host.
- **Base URL** (`src/api/client.ts`): `EXPO_PUBLIC_API_URL` if it is set. Otherwise the app uses the Metro host IP on port 3000 (Expo Go on the same Wi-Fi), or `localhost:3000` on web. The login screen shows the URL it is using and whether the API is reachable.
- **Demo logins** (from `backend/app/seed.py`): `OP-4412` / PIN `4412` (expert, CAT-320-01), `OP-8821` / `8821`, `SUP-101` / `1001`. Tap ⇄ to switch operator. Switching clears the PIN.
- **To trigger a live alert**, post telemetry above a rule threshold. The app polls alerts every 10 s:
  ```bash
  curl -X POST localhost:3000/telemetry -H 'content-type: application/json' \
    -d '{"machineId":"CAT-320-01","operatorId":"OP-4412","engineTemp":110,"hydraulicPressure":345,"speed":0,"engineRpm":1800}'
  ```
- **For APK builds**, set `EXPO_PUBLIC_API_URL=http://<laptop-LAN-IP>:3000` before building. Release builds block plain HTTP by default, so the backend needs HTTPS, or `usesCleartextTraffic` has to be enabled through `expo-build-properties`.
- `POST /seed` resets the whole Supabase DB to the demo data. Everyone shares that DB, so only run it on purpose.

## Live demo stream (simulator)

For presentations, the supervisor dashboard has a **Demo Simulator** tab in the sidebar. It streams synthetic readings through the real `POST /telemetry` pipeline, so safety rules, ML anomaly detection, alerts and auto-incidents all fire as they would for a real machine.

1. Sign in to the dashboard as `SUP-101` / `1001`. The simulator uses the same login against the backend, so sessions from before this feature need to sign out and back in.
2. Sign in to the operator app on the phone as `OP-4412` / `4412`. Its machine is CAT-320-01.
3. Pick **CAT-320-01** and **Safety crisis**, then press **▶ Start live demo**. The story is 14 readings, about 40 s at the 3 s interval:

| Timeline | Phase | What happens |
|---|---|---|
| 0–3 s | Normal operation | Normal readings, seatbelt on, 15 m clear. The app shows "Safe to Operate". |
| 3–9 s | Seatbelt violation | The machine speeds up with the seatbelt off. A critical alert fires, and the app plays an alarm, vibrates and shows a red banner. |
| 9–18 s | Proximity hazard | The obstacle closes in from 12 m → 3.5 m (warning). |
| 18–24 s | Hazard unacknowledged | The obstacle is at 1.8 m (critical). The seatbelt alert has now been unacknowledged for 20 s, so it is auto-logged as an incident (INC-XXXX) for the supervisor. |
| 24–40 s | Machine drift | Engine temperature and RPM drift from normal into a fault. The AI flips to "Engine Overheating" around 33 s (Transmission Overheating on the loader). |

- **Instant triggers**: Seatbelt, Proximity, plus one button per anomaly type (8 per machine type) for the selected machine.
- **Other scenarios**: *Machine fault* (only the drift, about 50 s) and *Normal stream* (3 min of healthy readings).
- **Auto-stop**: the stream stops by itself at the end of the scenario, or after 5 minutes at the latest.
- **Timeline pacing**: the timeline advances per reading, not by the clock, so a slow network stretches the demo instead of skipping story beats.
- **Operator app during a demo**: while the stream feeds this operator's machine, the app polls every 3 s instead of 10 s and shows a **Simulated feed** strip under the header.
- **Tagged data**: simulated telemetry, alerts and incidents are tagged `source = 'simulation'`. To clean up after a demo:
  ```sql
  UPDATE alerts SET acknowledged = TRUE WHERE source = 'simulation' AND acknowledged = FALSE;
  UPDATE incidents SET status = 'resolved', resolved_at = NOW() WHERE source = 'simulation' AND status <> 'resolved';
  ```
- **Backend version**: needs the updated backend deployed on Render. The dashboard uses `BACKEND_URL`, which defaults to the Render URL.

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
| 9 | Machine Status | `/machine` | ✅ Built | The operator's assigned machine only (image, status, health, hours), AI anomaly detection with class probabilities, 8 test scenarios per machine, live telemetry, advisories (dismiss), manual notes |
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
- [x] Backend: fix the anomaly defaults and feature names (2026-09-24). **Redeploy Render** so the app, `/insights` and `POST /telemetry` use them.
- [ ] Hide the diagnostic test scenarios behind a demo-mode toggle (see the UX review)
- [ ] Real voice capture (`expo-audio`) and camera snapshot (`expo-camera`) on Incident Report
- [ ] Persist the JWT across app restarts (`expo-secure-store`). Right now it lives in memory only
- [ ] Landscape / in-dash tablet layout (12-column spec in DESIGN.md)
- [ ] Haptics on critical actions (`expo-haptics`)
- [x] Custom app icon and splash (Catalyst logo)

---

## Changelog

### 2026-09-24 — Demo fallback for AI Anomaly Detection
- If `POST /ml/anomaly/*` hasn't answered within **3.5 s**, or it fails, the AI Anomaly Detection panel shows a demo result instead of spinning. On the live feed that result is Normal (94%). For a scenario chip it is that scenario's class (87%).
- The panel header then reads **Demo data**. If the real response arrives later, it replaces the demo result and the header goes back to Live telemetry / Simulated.
- The 10 s background polls never overwrite a real result with demo data. The inline error text was removed because errors now show the fallback.

### 2026-09-24 — Live demo stream + real cab sensors
- **Backend**
  - `POST /telemetry` accepts `seatbeltFastened`, `proximityM`, extra ML `features` and `source`, with new DB columns added by an additive migration in `init_db`.
  - New built-in rules:
    - seatbelt unbuckled above 2 km/h → critical
    - proximity < 5 m → warning, < 3 m → critical
  - Alerts are de-duplicated: there is one open alert per rule per machine, not one per reading.
  - A critical alert left unacknowledged for 20 s becomes an incident, linked through `incidents.alert_id`.
  - New `/simulation` router (start / stop / trigger-event / status) and a synthetic reading generator in `app/simulation.py`.
- **Dashboard**
  - New Demo Simulator widget on the Overview page.
  - Sign-in also gets a backend token, stored in the signed session.
  - Status polling goes through a route handler (`/api/sim/status`), because server actions run one at a time and would queue up Start/Stop clicks.
- **Operator app**
  - **Alerts**: a new alert plays an alarm (`assets/sounds/alert.wav`, audible in silent mode) and vibrates (`expo-audio`, `expo-haptics`; both are in Expo Go). The Home banner and the Alert screen show the real alert title and message.
  - **Real sensor data**:
    - The Home "Safety Status" panel now uses the latest seatbelt and proximity readings and open critical faults, instead of a hardcoded "all clear".
    - The Alert screen's proximity panels show the measured distance and appear only for proximity hazards.
  - **Scoping and polling**:
    - Alerts are scoped to the operator's own machine (`/safety/alerts?machineId=`).
    - The latest telemetry is fetched on every poll, and insights at most every 10 s.

### 2026-09-24 — Machine type links supervisor, app and ML
The ML models only cover **excavator, bulldozer and wheel loader**, so everything now uses those three types. The rules live in `backend/app/machine_types.py`, with copies in `supervisor-dashboard/src/lib/domain.ts` and `cat-operator-app/src/data/machines.ts`.

Which task types each machine can do:

| Machine | Task types |
|---|---|
| Excavator | trenching, pipe laying, bulk excavation, demolition, loading |
| Bulldozer | grading, bulk excavation |
| Wheel loader | loading |

- **Supervisor dashboard**
  - Picking an operator locks the task to that operator's machine.
  - The task-type list only shows what that machine can do.
  - Operators with no machine, and machines in maintenance, can't be picked.
  - The reassign dropdown disables operators whose machine can't do the task.
  - The server re-checks all of this.
- **Backend**
  - `/tasks/{id}/estimate` maps the machine and task onto CatBoost's categories. For example, `CAT 320 Hydraulic Excavator` → `Excavator` and `pipe_laying` → `Trenching`. Before, unknown categories pushed every estimate about 25% too high. It also passes the maintenance status, based on machine health.
  - The anomaly service now builds its inputs from each model's own feature list. Missing readings are filled with Normal-class medians, and loader/dozer feature names are fixed, so all 24 anomaly classes can be detected. Previously the excavator model returned "Aggressive Boom Movement" for everything.
  - New `GET /machines/{id}` returns type, status, hours, health and allowed task types.
  - `/tasks/today` only offers an unassigned task to the operator driving its machine.
- **Operator app**
  - The Machine page shows only the machine the supervisor assigned. It has no fleet selector and shows a "No machine assigned" state when there isn't one. Engine hours and status come from `GET /machines/{id}`.
  - Task Detail shows the task's own machine instead of a hardcoded machine age.
  - Test scenarios were added for the anomaly classes that couldn't be triggered before. There are now 8 per machine.
- **Data**: in the seed and the shared DB, T003 became a stormwater trench (was grading on the excavator) and T004 became stockpile loading (was pipe laying on the loader).

### 2026-09-24 — Deployed backend
- Added `.env` pointing the app at the Render deployment. All endpoints the app uses were checked against it: tasks, estimate, telemetry, insights and anomaly.

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
- **EAS builds**: the repo-root `.gitignore` starts with `*`, which makes EAS drop the app's files from the archive (`package.json does not exist` error). Build from `cat-operator-app/` with `EAS_NO_VCS=1 EAS_PROJECT_ROOT=$PWD npx eas-cli@latest build -p android --profile preview` so only the app folder is uploaded with its own `.easignore`.
