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
  accent: string;
  danger: string;
  success: string;
  warning: string;
  surface: string;
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
  background: "#F8FAFC",
  card: "#FFFFFF",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  border: "#E2E8F0",
  primary: "#6366F1", // Indigo
  secondary: "#64748B",
  accent: "#3B82F6", // Blue
  danger: "#EF4444",
  success: "#10B981",
  warning: "#F59E0B",
  surface: "#F1F5F9",
};

const darkColors: ThemeColors = {
  background: "#020617",
  card: "#0F172A",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  border: "#1E293B",
  primary: "#818CF8",
  secondary: "#94A3B8",
  accent: "#60A5FA",
  danger: "#F87171",
  success: "#34D399",
  warning: "#FBBF24",
  surface: "#1E293B",
};

const gradients: ThemeGradients = {
  primary: ["#6366F1", "#4F46E5"],
  secondary: ["#64748B", "#475569"],
  accent: ["#3B82F6", "#2563EB"],
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
