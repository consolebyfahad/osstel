export const COLORS = {
  light: {
    white: "#FCFCFC",
    white100: "#E4E4E4",
    white200: "#CDCDCD",
    white300: "#B5B5B5",
    black: "#0D0D0D",
    black100: "#252525",
    black200: "#3D3D3D",
    gray: "#555555",
    gray100: "#6D6D6D",
    gray200: "#858585",
    gray300: "#9D9D9D",

    primary: "#5DB7DE",
    primary100: "#EAF6FB",
    primary200: "#C4E5F3",
    primary300: "#9ED4EB",
    secondary: "#4EDCA3",
    secondary100: "#E6FAF2",
    secondary200: "#C0F2DE",
    secondary300: "#9AEBCA",

    text: "#0A0A0A",
    background: "#FCFCFC",
    success: "#99DE9D",
    error: "#E65047",
    warning: "#EDA12F",
    gradientBg: ["#E6FAF2", "#F7FCFA"] as const,
  },
  dark: {
    // Surfaces — inverted from light whites
    white: "#121212",
    white100: "#1A1A1A",
    white200: "#242424",
    white300: "#2E2E2E",
    // Text — inverted from light blacks
    black: "#F5F5F5",
    black100: "#E0E0E0",
    black200: "#C8C8C8",
    // Muted text — lighter grays for readability on dark
    gray: "#A3A3A3",
    gray100: "#8A8A8A",
    gray200: "#737373",
    gray300: "#5C5C5C",

    // Brand — same hues, tuned for dark surfaces
    primary: "#6BC5E8",
    primary100: "#1A2D38",
    primary200: "#243D4D",
    primary300: "#2E5068",
    secondary: "#4EDCA3",
    secondary100: "#142820",
    secondary200: "#1C3830",
    secondary300: "#244838",

    text: "#F5F5F5",
    background: "#0A0A0A",
    success: "#7AE67F",
    error: "#FF6B63",
    warning: "#F5B04A",
    gradientBg: ["#142820", "#0D1210"] as const,
  },
} as const;

export type ThemeMode = keyof typeof COLORS;
export type AppColors = (typeof COLORS)[ThemeMode];
