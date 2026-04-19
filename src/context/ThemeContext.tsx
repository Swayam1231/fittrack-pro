import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance, ColorSchemeName } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* =====================================================
   TYPES
   ===================================================== */

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export type ThemeColors = {
  background: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  primary: string;
  secondary: string;
  tertiary: string;
  accent: string;
  danger: string;
  success: string;
  warning: string;
  surface: string;
  surfaceContainerLow: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceContainerLowest: string;
  onSurface: string;
  onSurfaceVariant: string;
};

export type ThemeGradients = {
  primary: [string, string];
  secondary: [string, string];
  accent: [string, string];
};

type ThemeContextType = {
  mode: ThemeMode;
  theme: ResolvedTheme;
  colors: ThemeColors;
  gradients: ThemeGradients;
  setMode: (mode: ThemeMode) => void;
};

/* =====================================================
   COLOR PALETTES
   ===================================================== */

const lightColors: ThemeColors = {
  background: "#FCF9F8",
  card: "#FFFFFF",
  textPrimary: "#1C1B1B",
  textSecondary: "#464554",
  border: "#E5E2E1",
  primary: "#4648D4",
  secondary: "#8127CF",
  tertiary: "#006C49",
  accent: "#4648D4",
  danger: "#BA1A1A",
  success: "#00885D",
  warning: "#FF8F00",
  surface: "#FCF9F8",
  surfaceContainerLow: "#F6F3F2",
  surfaceContainerHigh: "#EAE7E7",
  surfaceContainerHighest: "#E5E2E1",
  surfaceContainerLowest: "#FFFFFF",
  onSurface: "#1C1B1B",
  onSurfaceVariant: "#464554",
};

const darkColors: ThemeColors = {
  background: "#0E0D0D",
  card: "#161515",
  textPrimary: "#FCF9F8",
  textSecondary: "#928F8E",
  border: "#262423",
  primary: "#5C5FE3",
  secondary: "#9B51E0",
  tertiary: "#4EDEA3",
  accent: "#5C5FE3",
  danger: "#FF897D",
  success: "#4AE2AF",
  warning: "#FFB84D",
  surface: "#0E0D0D",
  surfaceContainerLow: "#161515",
  surfaceContainerHigh: "#262423",
  surfaceContainerHighest: "#313030",
  surfaceContainerLowest: "#000000",
  onSurface: "#FCF9F8",
  onSurfaceVariant: "#928F8E",
};

const gradients: ThemeGradients = {
  primary: ["#4648D4", "#8127CF"],
  secondary: ["#8127CF", "#A855F7"],
  accent: ["#00885D", "#4AE2AF"],
};

/* =====================================================
   CONTEXT
   ===================================================== */

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const STORAGE_KEY = "app_theme_mode";

/* =====================================================
   PROVIDER
   ===================================================== */

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, setModeState] = useState<ThemeMode>("system");

  // 🔥 FIX: system theme must be STATE, not a constant
  const [systemScheme, setSystemScheme] =
    useState<ColorSchemeName>(Appearance.getColorScheme());

  const [resolvedTheme, setResolvedTheme] =
    useState<ResolvedTheme>("light");

  /* ---------- LOAD SAVED MODE ---------- */
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (
        stored === "light" ||
        stored === "dark" ||
        stored === "system"
      ) {
        setModeState(stored);
      }
    })();
  }, []);

  /* ---------- LISTEN TO SYSTEM THEME CHANGES (🔥 FIX) ---------- */
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });

    return () => sub.remove();
  }, []);

  /* ---------- RESOLVE THEME ---------- */
  useEffect(() => {
    if (mode === "system") {
      setResolvedTheme(systemScheme === "dark" ? "dark" : "light");
    } else {
      setResolvedTheme(mode);
    }
  }, [mode, systemScheme]);

  /* ---------- COLORS ---------- */
  const colors = useMemo<ThemeColors>(() => {
    return resolvedTheme === "dark" ? darkColors : lightColors;
  }, [resolvedTheme]);

  /* ---------- SET MODE ---------- */
  const setMode = async (nextMode: ThemeMode) => {
    setModeState(nextMode);
    await AsyncStorage.setItem(STORAGE_KEY, nextMode);
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        theme: resolvedTheme,
        colors,
        gradients,
        setMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/* =====================================================
   HOOK
   ===================================================== */

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return ctx;
}
