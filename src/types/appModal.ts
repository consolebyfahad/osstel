import { Ionicons } from "@expo/vector-icons";

export type AppModalIconName = keyof typeof Ionicons.glyphMap;

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
  icon?: AppModalIconName;
  iconColor?: string;
  buttons?: AppModalButton[];
};

export type ConfirmModalOptions = {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  icon?: AppModalIconName;
  onConfirm?: () => void | Promise<void>;
};
