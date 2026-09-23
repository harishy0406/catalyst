/**
 * Design tokens for the "Heavy Telematics Display System".
 * Source of truth: frontend/stitch_cat_smart_operator_assistant/heavy_telematics_display_system/DESIGN.md
 */
import { TextStyle } from 'react-native';

export const colors = {
  surface: '#121316',
  surfaceBright: '#38393c',
  surfaceLowest: '#0d0e11',
  surfaceLow: '#1b1b1f',
  surfaceContainer: '#1f1f23',
  surfaceHigh: '#292a2d',
  surfaceHighest: '#343538',
  onSurface: '#e3e2e6',
  onSurfaceVariant: '#d5c4ac',
  outline: '#9d8f79',
  outlineVariant: '#504533',

  primary: '#ffdb9f',
  primaryContainer: '#fdb813', // CAT safety gold
  primaryPressed: '#e0a20f',
  onPrimaryContainer: '#412d00',
  onPrimary: '#412d00',

  secondary: '#ffb3ad',
  secondaryContainer: '#a40217', // danger fill
  onSecondaryContainer: '#ffaea8',

  tertiary: '#6cf9bb',
  tertiaryContainer: '#4bdca1', // safe / nominal
  onTertiary: '#003824',

  error: '#ffb4ab',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',

  danger: '#ef4444',
  warning: '#f59e0b',
  safe: '#10b981',

  white: '#ffffff',
  black: '#000000',
  hazardBlack: '#121316',
} as const;

export const fonts = {
  display: 'BarlowCondensed_800ExtraBold',
  headingBold: 'BarlowCondensed_700Bold',
  headingSemi: 'BarlowCondensed_600SemiBold',
  headingMedium: 'BarlowCondensed_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  mono: 'monospace',
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

/** Minimum gloved touch target (DESIGN.md: 56px min, 64px recommended). */
export const touch = { min: 56, optimal: 64 } as const;

/** letterSpacing in the spec is in em; RN wants absolute px. */
const em = (size: number, v: number) => size * v;

export const type = {
  headlineXl: { fontFamily: fonts.headingBold, fontSize: 36, lineHeight: 40, letterSpacing: em(36, 0.02), textTransform: 'uppercase' },
  headlineLg: { fontFamily: fonts.headingBold, fontSize: 28, lineHeight: 32, letterSpacing: em(28, 0.03), textTransform: 'uppercase' },
  headlineMd: { fontFamily: fonts.headingSemi, fontSize: 24, lineHeight: 28, letterSpacing: em(24, 0.04), textTransform: 'uppercase' },
  headlineSm: { fontFamily: fonts.headingBold, fontSize: 20, lineHeight: 24, letterSpacing: em(20, 0.05), textTransform: 'uppercase' },
  metric: { fontFamily: fonts.display, fontSize: 56, lineHeight: 60, letterSpacing: em(56, -0.01) },
  bodyLg: { fontFamily: fonts.bodyMedium, fontSize: 18, lineHeight: 26 },
  bodyMd: { fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 24 },
  bodySm: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20 },
  labelLg: { fontFamily: fonts.headingBold, fontSize: 16, lineHeight: 20, letterSpacing: em(16, 0.08), textTransform: 'uppercase' },
  labelMd: { fontFamily: fonts.headingBold, fontSize: 14, lineHeight: 18, letterSpacing: em(14, 0.08), textTransform: 'uppercase' },
  labelSm: { fontFamily: fonts.headingBold, fontSize: 12, lineHeight: 15, letterSpacing: em(12, 0.1), textTransform: 'uppercase' },
  labelXs: { fontFamily: fonts.headingBold, fontSize: 10, lineHeight: 13, letterSpacing: em(10, 0.08), textTransform: 'uppercase' },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

/** Structural border widths — sheet-metal panel seams. */
export const border = { hair: 1, panel: 1.5, strong: 2, hazard: 4 } as const;
