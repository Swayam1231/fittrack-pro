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
  accent: string;
  danger: string;
};

type ThemeContextType = {
  mode: ThemeMode;
  theme: ResolvedTheme;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
};

/* =====================================================
   COLOR PALETTES
   ===================================================== */

const lightColors: ThemeColors = {
  background: "#F9FAFB",
  card: "#FFFFFF",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  accent: "#2563EB",
  danger: "#DC2626",
};

const darkColors: ThemeColors = {
  background: "#0B0F19",
  card: "#111827",
  textPrimary: "#F9FAFB",
  textSecondary: "#9CA3AF",
  border: "#1F2937",
  accent: "#3B82F6",
  danger: "#F87171",
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
