import { Alert } from "react-native";
import { router } from "expo-router";
import { api } from "../../store/api";
import { logout } from "../../store/reducers/authSlice";
import type { AppDispatch } from "../../store/store";
import { persistor } from "../../store/store";

export async function performBlockedAccountLogout(dispatch: AppDispatch) {
  dispatch(logout());
  dispatch(api.util.resetApiState());
  await persistor.purge();
  router.replace("/auth/signin");
}

export function showBlockedAccountAlert(dispatch: AppDispatch): Promise<void> {
  return new Promise((resolve) => {
    Alert.alert(
      "Account blocked",
      "Your account has been blocked. Please contact support.",
      [
        {
          text: "OK",
          onPress: async () => {
            await performBlockedAccountLogout(dispatch);
            resolve();
          },
        },
      ],
      { cancelable: false },
    );
  });
}
