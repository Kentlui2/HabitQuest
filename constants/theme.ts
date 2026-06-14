// constants/theme.ts

export const COLORS = {
  background: '#060B13',     // Deep sci-fi midnight navy canvas
  surface: '#111A2E',       // Tonal navy card backs
  surface2: '#1C2946',      // Component highlights & focus fields
  surface3: '#28395E',      // Elevated surface layer for highlight elements

  primary: '#00A3FF',       // Electric Sky Blue (Titles, Active focus)
  primaryContainer: 'rgba(0, 163, 255, 0.1)', // Soft blue atmospheric glow

  secondary: '#00E5FF',     // Neon Cyan (Progress, Milestones, Checkmarks)
  tertiary: '#FFD700',      // Gold Counter (Wealth rewards)
  gold: '#FFD700',          // Explicit Gold constant

  success: '#00E5FF',       // Success maps to Cyan
  warning: '#FFD700',       // Warning maps to Gold
  danger: '#EF4444',        // Tech Threat Red

  text: '#FFFFFF',          // Crisp white title text
  muted: '#94A3B8',         // Slate gray for secondary labels
  dim: '#64748B',           // Deeper slate gray for descriptions/metadata
  outline: '#1F2E4D',       // Tech-tinted structural accents
  outlineVariant: '#17233B', // Deep layout divider lines
}

export const SPACING = {
  unit: 4,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
}

export const RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999, // Add this line
}

export const TYPOGRAPHY = {
  hero: 'text-[48px] font-[900] tracking-[-0.04em]',
  title: 'text-[32px] font-[800]',
  section: 'text-[24px] font-[700]',
  body: 'text-[16px] font-normal',
  caption: 'text-[14px] font-bold uppercase tracking-widest',
}

// ── Backward-compatible alias used by various screens ──────────────
export const C = {
  bg: COLORS.background,
  bgCard: COLORS.surface,
  bgCardAlt: COLORS.surface2,
  border: COLORS.outlineVariant,

  textPrimary: COLORS.text,
  textSecondary: COLORS.muted,
  textTertiary: COLORS.dim,

  // Theme Color Aliases
  gold: COLORS.gold,
  green: COLORS.success,
  orange: COLORS.primary,
  red: COLORS.danger,
  purple: COLORS.primary,
  teal: COLORS.secondary,
  blue: COLORS.primary,
}