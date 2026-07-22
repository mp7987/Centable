import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import clsx from "clsx";
import dayjs from "dayjs";
import { icons } from "@/constants/icons";
import { useAppColorScheme } from "@/lib/color-scheme";
import { posthog } from "@/lib/posthog";


type Frequency = "Monthly" | "Yearly";

const CATEGORIES = [
  "Entertainment", "AI Tools", "Developer Tools", "Design",
  "Productivity", "Cloud", "Music", "Other",
] as const;

const CATEGORY_COLORS: Record<(typeof CATEGORIES)[number], string> = {
  Entertainment: "#f7c8a0",
  "AI Tools": "#b8d4e3",
  "Developer Tools": "#e8def8",
  Design: "#f5c542",
  Productivity: "#b8e8d0",
  Cloud: "#c9d6ff",
  Music: "#ffb8c6",
  Other: "#d9d4c5",
};

interface CreateSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (subscription: Subscription) => void;
}

export default function CreateSubscriptionModal({ visible, onClose, onCreate }: CreateSubscriptionModalProps) {
  const { colorScheme } = useAppColorScheme();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("Monthly");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Entertainment");

  const parsedPrice = parseFloat(price);
  const isValid = name.trim().length > 0 && Number.isFinite(parsedPrice) && parsedPrice > 0;

  const resetForm = () => {
    setName("");
    setPrice("");
    setFrequency("Monthly");
    setCategory("Entertainment");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    if (!isValid) return;

    const trimmedName = name.trim();
    const now = dayjs();
    const renewalDate = now.add(1, frequency === "Monthly" ? "month" : "year").toISOString();

    const newSubscription: Subscription = {
      id: `${trimmedName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      icon: icons.wallet,
      name: trimmedName,
      category,
      status: "active",
      startDate: now.toISOString(),
      price: parsedPrice,
      billing: frequency,
      renewalDate,
      color: CATEGORY_COLORS[category],
    };

    onCreate(newSubscription);

    posthog.capture('subscription_created', {
      trimmedName,
      category,
      billing: frequency,
      price, parsedPrice,
    })

    resetForm();
    onClose();
  };

  const placeholderTextColor = colorScheme === "dark" ? "#93ac9f" : "#6b6a60";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView className="modal-overlay" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View className="modal-container">
          <View className="modal-header">
            <Text className="modal-title">New Subscription</Text>
            <Pressable className="modal-close" onPress={handleClose}>
              <Text className="modal-close-text">✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerClassName="modal-body" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View className="auth-field">
              <Text className="auth-label">Name</Text>
              <TextInput
                className="auth-input"
                value={name}
                onChangeText={setName}
                placeholder="e.g. Netflix"
                placeholderTextColor={placeholderTextColor}
              />
            </View>

            <View className="auth-field">
              <Text className="auth-label">Price</Text>
              <TextInput
                className="auth-input"
                value={price}
                onChangeText={setPrice}
                placeholder="0.00"
                placeholderTextColor={placeholderTextColor}
                keyboardType="decimal-pad"
              />
            </View>

            <View className="auth-field">
              <Text className="auth-label">Billing frequency</Text>
              <View className="picker-row">
                {(["Monthly", "Yearly"] as const).map((option) => (
                  <Pressable
                    key={option}
                    className={clsx("picker-option", frequency === option && "picker-option-active")}
                    onPress={() => setFrequency(option)}
                  >
                    <Text className={clsx("picker-option-text", frequency === option && "picker-option-text-active")}>
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="auth-field">
              <Text className="auth-label">Category</Text>
              <View className="category-scroll">
                {CATEGORIES.map((option) => (
                  <Pressable
                    key={option}
                    className={clsx("category-chip", category === option && "category-chip-active")}
                    onPress={() => setCategory(option)}
                  >
                    <Text className={clsx("category-chip-text", category === option && "category-chip-text-active")}>
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              className={clsx("auth-button", !isValid && "auth-button-disabled")}
              onPress={handleSubmit}
              disabled={!isValid}
            >
              <Text className="auth-button-text">Add Subscription</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
