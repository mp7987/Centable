import { SplashScreen, Stack } from "expo-router";
import "@/global.css";
import { useFonts } from "expo-font"
import { useEffect, useState } from "react";
import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { loadPersistedColorScheme } from "@/lib/color-scheme";

SplashScreen.preventAutoHideAsync();

function getPublishableKey(): string {
  const key = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env file");
  }
  return key;
}

const publishableKey = getPublishableKey();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'sans-regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'sans-bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'sans-medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'sans-semibold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'sans-extrabold': require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
    'sans-light': require('../assets/fonts/PlusJakartaSans-Light.ttf')
  })
  const [colorSchemeLoaded, setColorSchemeLoaded] = useState(false);

  useEffect(() => {
    loadPersistedColorScheme().finally(() => setColorSchemeLoaded(true));
  }, []);

  useEffect(() => {
    if(fontsLoaded && colorSchemeLoaded) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, colorSchemeLoaded])

  if (!fontsLoaded || !colorSchemeLoaded) return null;

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <Stack screenOptions={{headerShown: false}} />
    </ClerkProvider>
  );
}
