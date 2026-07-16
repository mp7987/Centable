import { useCallback } from "react";
import { Appearance, Platform, useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";

const COLOR_SCHEME_KEY = "color-scheme-preference";
const isNative = Platform.OS === "ios" || Platform.OS === "android";

export async function loadPersistedColorScheme() {
  try {
    const stored = isNative
      ? await SecureStore.getItemAsync(COLOR_SCHEME_KEY)
      : typeof window !== "undefined"
        ? window.localStorage.getItem(COLOR_SCHEME_KEY)
        : null;
    if (stored === "light" || stored === "dark") {
      Appearance.setColorScheme(stored);
    }
  } catch {
    // Ignore - falls back to the system color scheme.
  }
}

export function useAppColorScheme() {
  const colorScheme = useColorScheme() ?? "light";

  const toggleColorScheme = useCallback(() => {
    const next = colorScheme === "dark" ? "light" : "dark";
    Appearance.setColorScheme(next);
    if (isNative) {
      SecureStore.setItemAsync(COLOR_SCHEME_KEY, next).catch(() => {});
    } else if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(COLOR_SCHEME_KEY, next);
      } catch {
        // Ignore - preference just won't persist across reloads.
      }
    }
  }, [colorScheme]);

  return { colorScheme, toggleColorScheme };
}
