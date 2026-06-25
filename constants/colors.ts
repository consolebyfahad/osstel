
export const PALETTE = {
  primary: {
    50: "#EFF6FF",
    100: "#DBEAFE",
    200: "#BFDBFE",
    300: "#93C5FD",
    400: "#60A5FA",
    500: "#3B82F6",
    600: "#2563EB",
    700: "#1D4ED8",
    800: "#1E40AF",
    900: "#1E3A8A",
  },
  secondary: {
    50: "#F5F3FF",
    100: "#EDE9FE",
    200: "#DDD6FE",
    300: "#C4B5FD",
    400: "#A78BFA",
    500: "#8B5CF6",
    600: "#7C3AED",
    700: "#6D28D9",
    800: "#5B21B6",
    900: "#4C1D95",
  },
  sky: {
    50: "#F0F9FF",
    100: "#E0F2FE",
    200: "#BAE6FD",
    300: "#7DD3FC",
    400: "#38BDF8",
    500: "#0EA5E9",
    600: "#0284C7",
    700: "#0369A1",
    800: "#075985",
    900: "#0C4A6E",
  },
  accent: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B",
    600: "#D97706",
    700: "#B45309",
    800: "#92400E",
    900: "#78350F",
  },
  neutral: {
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
  },
  success: {
    50: "#F0FDF4",
    100: "#DCFCE7",
    200: "#BBF7D0",
    300: "#86EFAC",
    400: "#4ADE80",
    500: "#22C55E",
    600: "#16A34A",
    700: "#15803D",
    800: "#166534",
    900: "#14532D",
  },
  warning: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B",
    600: "#D97706",
    700: "#B45309",
    800: "#92400E",
    900: "#78350F",
  },
  error: {
    50: "#FFF1F2",
    100: "#FFE4E6",
    200: "#FECDD3",
    300: "#FDA4AF",
    400: "#FB7185",
    500: "#F43F5E",
    600: "#E11D48",
    700: "#BE123C",
    800: "#9F1239",
    900: "#881337",
  },
  info: {
    50: "#F0F9FF",
    100: "#E0F2FE",
    200: "#BAE6FD",
    300: "#7DD3FC",
    400: "#38BDF8",
    500: "#0EA5E9",
    600: "#0284C7",
    700: "#0369A1",
    800: "#075985",
    900: "#0C4A6E",
  },
} as const;

export type ColorScale = keyof typeof PALETTE;
export type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

// ─── Semantic light theme ─────────────────────────────────────────────────────

const light = {
  // Surfaces — soft off-white cards, not pure #FFFFFF
  white: "#FCFCFD",
  white100: PALETTE.neutral[100],
  white200: PALETTE.neutral[200],
  white300: PALETTE.neutral[300],

  // Text & ink
  black: PALETTE.neutral[900],
  black100: PALETTE.neutral[800],
  black200: PALETTE.neutral[700],
  gray: PALETTE.neutral[500],
  gray100: PALETTE.neutral[400],
  gray200: PALETTE.neutral[500],
  gray300: PALETTE.neutral[600],
  gray400: PALETTE.neutral[700],
  gray500: PALETTE.neutral[800],

  // Brand
  primary: PALETTE.primary[600],
  primary100: PALETTE.primary[50],
  primary200: PALETTE.primary[100],
  primary300: PALETTE.primary[100],
  primary400: PALETTE.primary[700],
  primary500: PALETTE.primary[800],
  secondary: PALETTE.secondary[500],
  secondary100: PALETTE.secondary[50],
  secondary200: PALETTE.secondary[100],
  secondary300: PALETTE.secondary[300],
  accent: PALETTE.accent[400],
  accent100: PALETTE.accent[50],

  // Page
  text: PALETTE.neutral[900],
  background: PALETTE.neutral[50],
  link: PALETTE.primary[600],

  // Status
  success: PALETTE.success[600],
  error: PALETTE.error[600],
  warning: PALETTE.warning[500],
  info: PALETTE.info[500],

  successBg: PALETTE.success[50],
  successText: PALETTE.success[700],
  warningBg: PALETTE.accent[50],
  warningText: PALETTE.accent[700],
  errorBg: PALETTE.error[50],
  errorText: PALETTE.error[700],
  infoBg: PALETTE.info[50],
  infoText: PALETTE.info[700],
  purpleBg: PALETTE.secondary[50],
  purpleText: PALETTE.secondary[700],

  // Borders & dividers
  border: PALETTE.neutral[200],
  borderStrong: PALETTE.neutral[300],
  divider: PALETTE.neutral[200],
  borderSubtle: "rgba(15, 23, 42, 0.07)",
  borderFocus: "rgba(37, 99, 235, 0.40)",
  chipBorder: "rgba(15, 23, 42, 0.10)",
  surfaceMuted: "rgba(15, 23, 42, 0.03)",

  // Disabled
  disabled: PALETTE.neutral[300],
  disabledText: PALETTE.neutral[400],
  disabledBackground: PALETTE.neutral[100],
  buttonDisabledBackground: PALETTE.neutral[200],
  buttonDisabledBorder: PALETTE.neutral[300],
  buttonDisabledText: PALETTE.neutral[500],

  // Skeleton / loading
  skeleton: PALETTE.neutral[200],
  skeletonHighlight: PALETTE.neutral[100],

  // Overlays
  overlay: "rgba(15, 23, 42, 0.48)",
  authBackgroundOverlay: "rgba(15, 23, 42, 0.36)",

  // On-color text — soft card gradients use dark ink; buttons keep white on buttonGradient
  onPrimary: "#FFFFFF",
  onGradient: PALETTE.neutral[900],
  onGradientMuted: PALETTE.neutral[600],
  onGradientSubtle: PALETTE.neutral[500],
  onGradientSurface: "rgba(15, 23, 42, 0.08)",
  gradientDivider: "rgba(15, 23, 42, 0.10)",
  gradientBorder: PALETTE.primary[200],

  // Gradients — soft blue → purple cards; medium-soft buttons; page bg uses 50 shades
  gradientBg: [PALETTE.primary[50], PALETTE.secondary[50]] as const,
  bannerGradient: [PALETTE.primary[100], PALETTE.secondary[200]] as const,
  cardGradient: [PALETTE.primary[100], PALETTE.secondary[200]] as const,
  buttonGradient: [PALETTE.primary[400], PALETTE.secondary[500]] as const,
} as const;

// ─── Semantic dark theme ────────────────────────────────────────────────────

const dark = {
  // Surfaces — rich navy, not pure black
  white: "#1A2332",
  white100: "#232D3F",
  white200: "#2D384C",
  white300: "#3D4A63",

  black: PALETTE.neutral[50],
  black100: PALETTE.neutral[200],
  black200: PALETTE.neutral[300],
  gray: PALETTE.neutral[400],
  gray100: PALETTE.neutral[500],
  gray200: PALETTE.neutral[400],
  gray300: PALETTE.neutral[300],
  gray400: PALETTE.neutral[600],
  gray500: PALETTE.neutral[700],

  // Brand — lighter for contrast on dark surfaces
  primary: PALETTE.primary[400],
  primary100: "rgba(37, 99, 235, 0.14)",
  primary200: "rgba(37, 99, 235, 0.22)",
  primary300: PALETTE.primary[600],
  primary400: PALETTE.primary[300],
  primary500: PALETTE.primary[400],
  secondary: PALETTE.secondary[400],
  secondary100: "rgba(139, 92, 246, 0.14)",
  secondary200: "rgba(139, 92, 246, 0.22)",
  secondary300: PALETTE.secondary[500],
  accent: PALETTE.accent[400],
  accent100: "rgba(251, 191, 36, 0.14)",

  // Page
  text: "#F1F5F9",
  background: "#0B1220",
  link: PALETTE.primary[300],

  // Status
  success: PALETTE.success[400],
  error: PALETTE.error[400],
  warning: PALETTE.accent[400],
  info: PALETTE.sky[400],

  successBg: "rgba(34, 197, 94, 0.14)",
  successText: PALETTE.success[300],
  warningBg: "rgba(245, 158, 11, 0.14)",
  warningText: PALETTE.accent[300],
  errorBg: "rgba(244, 63, 94, 0.14)",
  errorText: PALETTE.error[300],
  infoBg: "rgba(14, 165, 233, 0.14)",
  infoText: PALETTE.sky[300],
  purpleBg: "rgba(139, 92, 246, 0.14)",
  purpleText: PALETTE.secondary[300],

  // Borders & dividers
  border: "rgba(255, 255, 255, 0.10)",
  borderStrong: "rgba(255, 255, 255, 0.16)",
  divider: "rgba(255, 255, 255, 0.08)",
  borderSubtle: "rgba(255, 255, 255, 0.08)",
  borderFocus: "rgba(96, 165, 250, 0.45)",
  chipBorder: "rgba(255, 255, 255, 0.12)",
  surfaceMuted: "rgba(255, 255, 255, 0.05)",

  // Disabled
  disabled: PALETTE.neutral[600],
  disabledText: PALETTE.neutral[500],
  disabledBackground: PALETTE.neutral[800],
  buttonDisabledBackground: "#243044",
  buttonDisabledBorder: "rgba(255, 255, 255, 0.14)",
  buttonDisabledText: PALETTE.neutral[400],

  // Skeleton / loading
  skeleton: PALETTE.neutral[700],
  skeletonHighlight: PALETTE.neutral[600],

  // Overlays
  overlay: "rgba(0, 0, 0, 0.62)",
  authBackgroundOverlay: "rgba(0, 0, 0, 0.68)",

  // On-color text — soft tinted cards; white on button gradient
  onPrimary: "#FFFFFF",
  onGradient: "#F1F5F9",
  onGradientMuted: "rgba(241, 245, 249, 0.78)",
  onGradientSubtle: "rgba(241, 245, 249, 0.58)",
  onGradientSurface: "rgba(255, 255, 255, 0.12)",
  gradientDivider: "rgba(255, 255, 255, 0.12)",
  gradientBorder: "rgba(96, 165, 250, 0.16)",

  // Gradients — soft navy/purple cards on dark page; medium accent buttons
  gradientBg: ["#0B1220", "#15132B"] as const,
  bannerGradient: ["#152038", "#1E1A38"] as const,
  cardGradient: ["#152038", "#1E1A38"] as const,
  buttonGradient: [PALETTE.primary[500], PALETTE.secondary[500]] as const,
} as const;

export const COLORS = { light, dark } as const;

export type ThemeMode = keyof typeof COLORS;
export type AppColors = (typeof COLORS)[ThemeMode];
