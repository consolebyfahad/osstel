import {
  googleAuthConfig,
  isGoogleSignInConfigured,
} from "@/config/googleAuth";
import {
  GoogleSignin,
  isSuccessResponse,
  statusCodes,
  isErrorWithCode,
} from "@react-native-google-signin/google-signin";
import { useCallback, useEffect, useState } from "react";

export function useGoogleSignIn() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isGoogleSignInConfigured()) {
      setIsReady(false);
      return;
    }

    GoogleSignin.configure({
      webClientId: googleAuthConfig.webClientId,
      offlineAccess: false,
    });
    setIsReady(true);
  }, []);

  const signIn = useCallback(async () => {
    if (!isGoogleSignInConfigured()) {
      throw new Error("Google Sign-In is not configured.");
    }

    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        return null;
      }

      let idToken = response.data.idToken;

      if (!idToken) {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens.idToken;
      }

      if (!idToken) {
        throw new Error("Google did not return a valid sign-in token.");
      }

      return idToken;
    } catch (error) {
      if (
        isErrorWithCode(error) &&
        error.code === statusCodes.SIGN_IN_CANCELLED
      ) {
        return null;
      }

      if (
        isErrorWithCode(error) &&
        error.code === statusCodes.IN_PROGRESS
      ) {
        throw new Error("Google Sign-In is already in progress.");
      }

      if (
        isErrorWithCode(error) &&
        error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE
      ) {
        throw new Error("Google Play Services is not available on this device.");
      }

      throw error;
    }
  }, []);

  return {
    signIn,
    isReady,
    isConfigured: isGoogleSignInConfigured(),
  };
}
