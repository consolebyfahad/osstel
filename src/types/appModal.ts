import type { Ionicons } from "@expo/vector-icons";

export type AppModalButtonStyle =
  | "cancel"
  | "default"
  | "primary"
  | "destructive"
  | "outline";

export type AppModalButton = {
  text: string;
  style?: AppModalButtonStyle;
  onPress?: () => void | Promise<void>;
};

export type AppModalOptions = {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  buttons?: AppModalButton[];
};

export type ConfirmModalOptions = {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onConfirm?: () => void | Promise<void>;
};
