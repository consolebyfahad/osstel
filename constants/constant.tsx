import { COLORS, type ThemeMode } from "@constants/colors";
import { FONTS } from "@constants/fonts";
import React, { createContext, useContext } from "react";
import { useColorScheme } from "react-native";

type AppColors = (typeof COLORS)[ThemeMode];

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  colors: AppColors;
  fonts: typeof FONTS;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const theme: ThemeMode = colorScheme === "dark" ? "dark" : "light";
  const isDark = theme === "dark";
  const colors = COLORS[theme];

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, fonts: FONTS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export { COLORS, FONTS };
