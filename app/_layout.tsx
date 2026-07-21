import { SplashScreen, Stack, usePathname } from "expo-router";
import "@/global.css";
import { useFonts } from "expo-font"
import { useEffect, useRef, useState } from "react";
import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { loadPersistedColorScheme } from "@/lib/color-scheme";
import { PostHogProvider } from "posthog-react-native";
import { posthog } from "@/lib/posthog";

SplashScreen.preventAutoHideAsync();

function getPublishableKey(): string {
  const key = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env file");
  }
  return key;
}

const publishableKey = getPublishableKey();

function PostHogIdentityTracker() {
  const { userId } = useAuth();

  useEffect(() => {
    if (userId) {
      posthog.identify(userId);
    }
  }, [userId]);

  return null;
}

export default function RootLayout() {
  const pathname = usePathname();
  const previousPathname = useRef<string | undefined>(undefined);
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
    if (previousPathname.current !== pathname) {
      posthog.screen(pathname, { previous_screen: previousPathname.current ?? null });
      previousPathname.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    if(fontsLoaded && colorSchemeLoaded) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, colorSchemeLoaded])

  if (!fontsLoaded || !colorSchemeLoaded) return null;

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <PostHogProvider
        client={posthog}
        autocapture={{ captureScreens: false, captureTouches: true, propsToCapture: ['testID'] }}
      >
        <PostHogIdentityTracker />
        <Stack screenOptions={{headerShown: false}} />
      </PostHogProvider>
    </ClerkProvider>
  );
}
