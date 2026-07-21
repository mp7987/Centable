import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";
import React, { useMemo, useState } from "react";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import SubscriptionCard from "@/components/SubscriptionCard";
import { useAppColorScheme } from "@/lib/color-scheme";
import { posthog } from "@/lib/posthog";
import { useSubscriptions } from "@/lib/subscriptions-context";

const SafeAreaView = styled(RNSafeAreaView);

const Subscriptions = () => {
  const { colorScheme } = useAppColorScheme();
  const { subscriptions } = useSubscriptions();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);

  const filteredSubscriptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return subscriptions;

    return subscriptions.filter((subscription) => {
      const haystack = [subscription.name, subscription.category, subscription.plan, subscription.paymentMethod, subscription.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [searchQuery, subscriptions]);

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="list-head">
          <Text className="list-title">Subscriptions</Text>
        </View>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          onEndEditing={() => {
            const query = searchQuery.trim();
            if (query) {
              posthog.capture("subscription_search", {
                query_length: query.length,
                result_count: filteredSubscriptions.length,
              });
            }
          }}
          placeholder="Search subscriptions..."
          placeholderTextColor={colorScheme === "dark" ? "#93ac9f" : "#6b6a60"}
          className="subscriptions-search-input"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-30">
          {filteredSubscriptions.length === 0 ? (
            <Text className="home-empty-state">
              {subscriptions.length === 0 ? "No subscriptions yet." : "No subscriptions match your search."}
            </Text>
          ) : (
            filteredSubscriptions.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 && <View className="h-4" />}
                <SubscriptionCard
                  {...item}
                  expanded={expandedSubscriptionId === item.id}
                  onPress={() => {
                    const isExpanding = expandedSubscriptionId !== item.id;
                    setExpandedSubscriptionId((currentId) => (currentId === item.id ? null : item.id));
                    if (isExpanding) {
                      posthog.capture("subscription_details_expanded", {
                        subscription_id: item.id ?? "",
                        billing_interval: item.billing?.toLowerCase() ?? "unknown",
                        subscription_status: item.status ?? "unknown",
                      });
                    }
                  }}
                />
              </React.Fragment>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Subscriptions;
