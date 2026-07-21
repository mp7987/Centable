import { Redirect, Tabs } from "expo-router";
import { tabs } from "@/constants/data";
import { View } from "react-native";
import { colors, components } from "@/constants/theme";
import clsx from "clsx";
import { Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@clerk/expo";
import { SubscriptionsProvider } from "@/lib/subscriptions-context";

const tabBar = components.tabBar;

interface TabIconProps {
  focused: boolean;
  icon: any;
}

const Tablayout = () => {
  const insets = useSafeAreaInsets();
  const { isSignedIn, isLoaded } = useAuth();

  const TabIcon = ({ focused, icon}: TabIconProps) => {
    return (
      <View className="tabs-icon">
        <View className={clsx('tabs-pill', focused && 'tabs-active')}>
          <Image source={icon} className="tabs-glyph"></Image>
        </View>
      </View>
    );
  }

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;

  return <SubscriptionsProvider>
    <Tabs
      screenOptions={{
       headerShown: false,
       tabBarShowLabel: false,
       tabBarStyle: {
          position: 'absolute',
          bottom: Math.max(insets.bottom, tabBar.horizontalInset),
          height: tabBar.height,
          marginHorizontal: tabBar.horizontalInset,
          borderRadius: tabBar.radius,
          backgroundColor: colors.primary,
          borderTopWidth: 0,
          elevation: 0,
       },
       tabBarItemStyle: {
        paddingVertical: tabBar.height / 2 - tabBar.iconFrame / 1.6
       },
       tabBarIconStyle: {
        width: tabBar.iconFrame,
        height: tabBar.iconFrame,
        alignItems: 'center'
       }
      }}
    >
    {tabs.map((tab) => (
      <Tabs.Screen
      key={tab.name}
      name={tab.name}
      options={{
        title: tab.title,
        tabBarIcon: ({ focused }) => (
          <TabIcon focused={focused} icon={tab.icon}/>
        )
      }} />
    ))}
    </Tabs>
  </SubscriptionsProvider>
}

export default Tablayout;