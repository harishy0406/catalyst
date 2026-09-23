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
| State | One React context (`src/state/AppState.tsx`) holding mock data from `src/data/mock.ts` |

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
| 9 | Machine Status | `/machine` | ✅ Built | Recalibrate (loading), Acknowledge, advisories (arm auto-shutoff / dismiss), manual notes |
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

- [ ] Replace `data/mock.ts` with API calls to `backend/` (telemetry, tasks, incidents)
- [ ] Real voice capture (`expo-audio`) and camera snapshot (`expo-camera`) on Incident Report
- [ ] Persist the session and PIN auth (`expo-secure-store`)
- [ ] Landscape / in-dash tablet layout (12-column spec in DESIGN.md)
- [ ] Haptics on critical actions (`expo-haptics`)
- [x] Custom app icon and splash (Catalyst logo)

---

## Changelog

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
