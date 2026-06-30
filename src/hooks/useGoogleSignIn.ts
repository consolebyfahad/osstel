import {
  googleAuthConfig,
  isGoogleSignInConfigured,
} from "@/config/googleAuth";
import Constants from "expo-constants";
import { useCallback, useEffect, useState } from "react";

type GoogleSignInModule = typeof import("@react-native-google-signin/google-signin");

const isExpoGo = Constants.appOwnership === "expo";

function canUseNativeGoogleSignIn() {
  return !isExpoGo && isGoogleSignInConfigured();
}

async function loadGoogleSignIn(): Promise<GoogleSignInModule | null> {
  if (!canUseNativeGoogleSignIn()) {
    return null;
  }

  try {
    return await import("@react-native-google-signin/google-signin");
  } catch {
    return null;
  }
}

export function useGoogleSignIn() {
  const [isReady, setIsReady] = useState(false);
  const [googleSignIn, setGoogleSignIn] = useState<GoogleSignInModule | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const module = await loadGoogleSignIn();
      if (cancelled || !module) {
        if (!cancelled) setIsReady(false);
        return;
      }

      module.GoogleSignin.configure({
        webClientId: googleAuthConfig.webClientId,
        offlineAccess: false,
      });

      if (!cancelled) {
        setGoogleSignIn(module);
        setIsReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async () => {
    const module = googleSignIn ?? (await loadGoogleSignIn());

    if (!module) {
      throw new Error(
        isExpoGo
          ? "Google Sign-In is not available in Expo Go. Use a development build."
          : "Google Sign-In is not configured.",
      );
    }

    const { GoogleSignin, isSuccessResponse, statusCodes, isErrorWithCode } =
      module;

    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      try {
        await GoogleSignin.signOut();
      } catch {
        // No active Google session yet.
      }

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
  }, [googleSignIn]);

  return {
    signIn,
    isReady,
    isConfigured: canUseNativeGoogleSignIn(),
  };
}
