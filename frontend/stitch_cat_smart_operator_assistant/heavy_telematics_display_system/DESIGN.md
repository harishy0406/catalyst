---
name: Heavy Telematics Display System
colors:
  surface: '#121316'
  surface-dim: '#121316'
  surface-bright: '#38393c'
  surface-container-lowest: '#0d0e11'
  surface-container-low: '#1b1b1f'
  surface-container: '#1f1f23'
  surface-container-high: '#292a2d'
  surface-container-highest: '#343538'
  on-surface: '#e3e2e6'
  on-surface-variant: '#d5c4ac'
  inverse-surface: '#e3e2e6'
  inverse-on-surface: '#2f3034'
  outline: '#9d8f79'
  outline-variant: '#504533'
  surface-tint: '#ffbb1e'
  primary: '#ffdb9f'
  on-primary: '#412d00'
  primary-container: '#fdb813'
  on-primary-container: '#6b4b00'
  inverse-primary: '#7c5800'
  secondary: '#ffb3ad'
  on-secondary: '#68000a'
  secondary-container: '#a40217'
  on-secondary-container: '#ffaea8'
  tertiary: '#6cf9bb'
  on-tertiary: '#003824'
  tertiary-container: '#4bdca1'
  on-tertiary-container: '#005d3f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdea7'
  primary-fixed-dim: '#ffbb1e'
  on-primary-fixed: '#271900'
  on-primary-fixed-variant: '#5e4200'
  secondary-fixed: '#ffdad7'
  secondary-fixed-dim: '#ffb3ad'
  on-secondary-fixed: '#410004'
  on-secondary-fixed-variant: '#930013'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#121316'
  on-background: '#e3e2e6'
  surface-variant: '#343538'
typography:
  headline-xl:
    fontFamily: Barlow Condensed
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: 0.02em
  headline-xl-mobile:
    fontFamily: Barlow Condensed
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: 0.02em
  headline-lg:
    fontFamily: Barlow Condensed
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: 0.03em
  headline-lg-mobile:
    fontFamily: Barlow Condensed
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: 0.03em
  headline-md:
    fontFamily: Barlow Condensed
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: 0.04em
  headline-sm:
    fontFamily: Barlow Condensed
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: 0.05em
  metric-display:
    fontFamily: Barlow Condensed
    fontSize: 56px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-lg:
    fontFamily: Barlow Condensed
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.08em
  label-md:
    fontFamily: Barlow Condensed
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.08em
  label-sm:
    fontFamily: Barlow Condensed
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.1em
spacing:
  gutter: 0.75rem
  gutter-desktop: 1rem
  margin: 1rem
  margin-desktop: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system delivers an ultra-durable, high-contrast digital cockpit engineered for in-cab heavy machinery displays and rugged industrial field tablets. The environment demands immediate cognitive parsing through vibration, direct midday glare, heavy dust, and harsh ambient cab conditions. Operators interact using thick work gloves under high-stress operational circumstances where ambiguous UI states can lead to equipment damage or critical safety hazards.

The aesthetic fuses utilitarian industrial design, structural brutalism, and technical instrumentation. Visual hierarchy is strictly functional: structural borders mimic sheet-metal panel gaps, warnings command immediate retinal capture through standardized safety hues, and data metrics emphasize instant glancing comprehension over decorative subtlety. Fluff, floating gradients, soft shadows, and non-essential ornamentation are eliminated entirely.

## Colors

The palette is derived directly from industrial heavy equipment livery and ISO/OSHA hazard communications:

- **Primary Action (`#FDB813`):** High-visibility safety gold. Reserved strictly for primary operator actions, active system indicators, active telemetry readouts, and operational engagement states.
- **Secondary Alert / Danger (`#EF4444`):** Proximity warnings, critical engine halts, hydraulic pressure drops, and emergency alerts. Surfaces requiring immediate operator intervention flip to high-contrast red fills with stark white or pitch black typography.
- **Tertiary Safe / Operational (`#10B981`):** Active telemetry nominal indicators, safe envelope confirmations, and engaged PTO states.
- **Warning Amber (`#F59E0B`):** Mechanical advisory warnings, fluid level notices, and proximity boundary advisories.
- **Surface Palette:**
  - Base Bed (`#121316`): Matte asphalt black for total non-glare cab backdrops.
  - Panel Layer 1 (`#1A1D20`): Structural framing and background module containers.
  - Panel Layer 2 (`#22262B`): Interactive component targets, data cells, and active cards.
  - Structural Borders (`#363D45`): High-definition chassis boundaries isolating operational zones.
- **Data & Text:**
  - High-Luminance Off-White (`#F8FAFC`): Primary data readouts and critical labels for severe direct sunlight legibility.
  - High-Legibility Slate (`#94A3B8`): Static metric descriptors and engineering units (RPM, PSI, kPa).

## Typography

Typography prioritizes instantaneous character distinction and high information density. 

- **Barlow Condensed:** Used for all titles, headers, gauges, telemetric figures, and system annunciators. The condensed profile permits oversized digit display without truncating crucial 4-to-6 digit readouts across constrained cab dashboards. All labels and headlines default to full uppercase (`text-transform: uppercase`) with widened letter spacing to optimize character recognition under cab vibrations.
- **Inter:** Used strictly for system status descriptions, alert body notifications, checklist instructions, and audit logs. The neutral, tall x-height architecture guarantees crisp anti-aliasing against anti-glare resistive touchscreen glass.

## Layout & Spacing

The layout is built on a tight, structured 12-column fixed-ratio grid tailored to in-dash touch modules (typically 7-inch, 10-inch, and 12-inch 16:9 displays) as well as vehicle-mounted rugged tablets.

- **Operator Touch Target Rules:** All interactive elements must adhere to a strict minimum bounding box of 56px × 56px (recommended 64px vertical height) to prevent mis-presses by operators wearing ASTM-rated leather or rubberized heavy work gloves.
- **Layout Rhythm:** Padding and margins prioritize functional grouping over decorative white space. Dense, instrument-cluster spacing ensures maximum viewable telemetry without scrolling. Vertical scrolling is eliminated within primary driving and machine control views; critical data must occupy a single viewport layer.
- **Grid Adaptability:**
  - Handheld Rugged Tablet (Narrow / Portrait): Layout collapses to a 4-column stack. System status strip pins permanently to the bottom thumb-zone.
  - Primary Cab Display (Landscape / In-Dash): 12-column layout. Left 2 columns reserved for critical safety kill-switches and camera overlays; central 7 columns dedicate to active telemetry (boom angle, payload weight, engine load); right 3 columns control hydraulic and operational modes.

## Elevation & Depth

Soft shadows and multi-stop ambient light blurs are strictly forbidden; they wash out instantly on reflective, dust-coated glass displays in direct sunlight. Visual hierarchy and elevation are conveyed exclusively through:

1. **High-Contrast Surface Stepping:**
   - Level 0 (Basebed): `#121316` (Cab monitor background).
   - Level 1 (Structural Modules): `#1A1D20` framed with 1.5px solid `#363D45`.
   - Level 2 (Interactive Cells & Controls): `#22262B` framed with 1.5px solid `#475569`.
2. **Hard Inset Deboss:** Recessed data displays use a 2px top and left border of `#0A0B0D` with a bottom and right border of `#363D45`, simulating physically stamped bezel switchgear.
3. **Hazard Framing:** Critical warnings and emergency indicators deploy high-contrast, zero-blur perimeter boundaries (2px to 4px solid `#EF4444` or `#FDB813`). When critical alerts fire, containers strobe between solid `#EF4444` fill with `#000000` text and Level 1 background with an outline border.

## Shapes

Every component utilizes absolute sharp geometry (`border-radius: 0px`). 

Rounded corners undermine the industrial, heavy-fabricated aesthetic and waste interactive screen real estate at bezel junctions. Cards, buttons, tabs, and alerts sit flush against adjoining components or lock together with 1px to 2px structural panel seams. 

Where directional cues or technical telemetry brackets are required, utilize mechanical 45-degree corner cutouts (chamfers) measuring 8px × 8px using CSS clip-paths (`polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)`).

## Components

### Buttons
- **Touch Target:** Minimum height 56px, optimal height 64px. Full-width or rigid grid-spanning widths.
- **Primary Action:** Solid `#FDB813` background, text `#121316` (`font-weight: 700`, Barlow Condensed, uppercase). In active/pressed state, shifts to `#E0A20F` with an inverted 2px solid `#FFFFFF` inset border.
- **Secondary Action:** Solid `#22262B` background, 2px solid `#475569` border, text `#F8FAFC`. Active state snaps to `#363D45` with `#FDB813` border.
- **Critical / Emergency Action:** Solid `#EF4444` background, text `#FFFFFF`. When primed, applies alternating 45-degree yellow/black hazard striping across the top border (4px height).

### Cards & Telemetry Pods
- **Structure:** Solid `#1A1D20` background, 1.5px solid `#363D45` border, zero border radius.
- **Header Strip:** 32px high integrated header zone (`#22262B`) featuring uppercase label in `#94A3B8` accompanied by small technical icon and optional status pip.
- **Data Readout:** Large numeric values render in Barlow Condensed (metric-display, 56px, `#F8FAFC`), paired with a fixed right-aligned unit indicator (e.g., `BAR`, `RPM`, `°C`) in `#FDB813`.

### Status Indicators & Annunciators
- **Form:** Rectangular indicator blocks (sharp 0px radius, minimum 16px × 32px) simulating physical LED cluster lamps.
- **States:** 
  - Off: Darkened muted tint (`#1A1D20` with `#2D3339` border).
  - Nominal: Vibrant `#10B981` with black icon/label.
  - Caution: Solid `#F59E0B` with black icon/label.
  - Hazard: Flashing `#EF4444` with off-white high-contrast icon.

### Form Inputs & Adjusters
- **Steppers:** Heavy-equipment interfaces prioritize massive physical touch steppers over standard keyboards. Sliders and numeric fields are flanked by dedicated 56px × 56px `[-]` and `[+]` increment blocks.
- **Numeric Fields:** Monospaced, debossed `#121316` background, bordered with `#363D45`. Direct touch opens an oversized numeric pin-pad overlay instead of a standard virtual keyboard.

### Lists & Audit Logs
- **Row Architecture:** Minimum 60px row height for rapid finger selection. Alternate row backgrounds between `#1A1D20` and `#1E2227` for vibration trackability.
- **Dividers:** 1px solid `#2B313A`.
- **Severity Stripe:** Leftmost 6px border of every log row color-coded to severity: Green (nominal), Amber (warning), Red (critical fault).