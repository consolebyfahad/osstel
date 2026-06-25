import AppModal from "@/components/AppModal";
import type { AppModalButton, AppModalOptions, ConfirmModalOptions } from "@/types/appModal";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type AppModalContextValue = {
  showModal: (options: AppModalOptions) => void;
  hideModal: () => void;
};

const AppModalContext = createContext<AppModalContextValue | null>(null);

let imperativeShowModal: ((options: AppModalOptions) => void) | null = null;

export function showAppModal(options: AppModalOptions) {
  imperativeShowModal?.(options);
}

export function showConfirmModal({
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = false,
  icon,
  onConfirm,
}: ConfirmModalOptions) {
  showAppModal({
    title,
    message,
    icon,
    buttons: [
      { text: cancelText, style: "cancel" },
      {
        text: confirmText,
        style: destructive ? "destructive" : "primary",
        onPress: onConfirm,
      },
    ],
  });
}

export function useAppModal() {
  const context = useContext(AppModalContext);
  if (!context) {
    throw new Error("useAppModal must be used within AppModalProvider");
  }
  return context;
}

type AppModalProviderProps = {
  children: ReactNode;
};

export default function AppModalProvider({ children }: AppModalProviderProps) {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AppModalOptions | null>(null);

  const hideModal = useCallback(() => {
    setVisible(false);
    setOptions(null);
  }, []);

  const showModal = useCallback((nextOptions: AppModalOptions) => {
    setOptions(nextOptions);
    setVisible(true);
  }, []);

  imperativeShowModal = showModal;

  const handleAction = useCallback(
    async (button: AppModalButton) => {
      hideModal();
      if (button.onPress) {
        await button.onPress();
      }
    },
    [hideModal],
  );

  const value = useMemo(
    () => ({
      showModal,
      hideModal,
    }),
    [hideModal, showModal],
  );

  return (
    <AppModalContext.Provider value={value}>
      {children}
      <AppModal
        visible={visible}
        options={options}
        onClose={hideModal}
        onAction={handleAction}
      />
    </AppModalContext.Provider>
  );
}
