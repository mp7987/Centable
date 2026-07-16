import { useCallback } from "react";
import { Appearance, Platform, useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";

const COLOR_SCHEME_KEY = "color-scheme-preference";
const isNative = Platform.OS === "ios" || Platform.OS === "android";

export async function loadPersistedColorScheme() {
  if (!isNative) return;
  try {
    const stored = await SecureStore.getItemAsync(COLOR_SCHEME_KEY);
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
    if (!isNative) return;
    const next = colorScheme === "dark" ? "light" : "dark";
    Appearance.setColorScheme(next);
    SecureStore.setItemAsync(COLOR_SCHEME_KEY, next).catch(() => {});
  }, [colorScheme]);

  return { colorScheme, toggleColorScheme };
}
