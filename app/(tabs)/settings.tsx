import { useClerk } from "@clerk/expo";
import clsx from "clsx";
import { styled } from "nativewind";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { useAppColorScheme } from "@/lib/color-scheme";
import { posthog } from "@/lib/posthog";

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
  const { signOut } = useClerk();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { colorScheme, toggleColorScheme } = useAppColorScheme();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      posthog.capture('signed_out');
      posthog.reset();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <View className="list-head">
        <Text className="list-title">Settings</Text>
      </View>

      <Pressable className="settings-theme-button" onPress={toggleColorScheme}>
        <Text className="settings-theme-text">
          {colorScheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        </Text>
      </Pressable>

      <Pressable
        className={clsx(
          "settings-signout-button",
          isSigningOut && "settings-signout-button-disabled",
        )}
        onPress={handleSignOut}
        disabled={isSigningOut}
      >
        <Text className="settings-signout-text">
          {isSigningOut ? "Signing out..." : "Sign out"}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
};

export default Settings;
