import type { ImageSourcePropType } from "react-native";

declare global {
  interface TabIcanProps {
    focused: boolean;
    icon: ImageSourcePropType;
  }
}

export {};