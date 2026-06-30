import CustomButton from "@/components/CustomButton";
import GradientBackground from "@/components/GradientBackground";
import type { AppColors } from "@constants/colors";
import { useTheme } from "@constants/constant";
import { FONT_SIZES, FONTS, vs } from "@constants/fonts";
import { Images } from "@constants/images";
import { router } from "expo-router";
import { useMemo } from "react";
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useDispatch } from "react-redux";
import { setHasSeenWelcome } from "../../store/reducers/authSlice";
import type { AppDispatch } from "../../store/store";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function Welcome() {
  const dispatch = useDispatch<AppDispatch>();
  const { colors, fonts } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, fonts, height, insets.bottom),
    [colors, fonts, height, insets.bottom],
  );

  const handleSignIn = () => {
    dispatch(setHasSeenWelcome());
    router.push("/auth/signin");
  };

  const handleBrowseGuest = () => {
    dispatch(setHasSeenWelcome());
    router.replace("/(tabs)/discover");
  };

  return (
    <ImageBackground
      source={Images.background}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.backgroundOverlay} />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.containerInner}>
          <View style={styles.logoSection}>
            <Image
              source={Images.osstel}
              style={styles.brandLogoImage}
              resizeMode="contain"
              accessibilityLabel="Osstel logo"
            />
          </View>

          <GradientBackground style={styles.cardSheet}>
            <View style={styles.headerGroup}>
              <Text style={styles.welcomeText}>Smart hostel management</Text>
              <Text style={styles.titleText}>Welcome to Osstel</Text>
            </View>

            <Text style={styles.tagline}>
              Browse hostels as a guest, or sign in to manage your stay, pay
              rent, and connect with your hostel.
            </Text>

            <CustomButton
              title="Discover Hostels"
              onPress={handleBrowseGuest}
            />
            <CustomButton
              title="Sign In"
              variant="outline"
              onPress={handleSignIn}
              style={styles.secondaryBtn}
            />
          </GradientBackground>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

function createStyles(
  colors: AppColors,
  fonts: typeof FONTS,
  screenHeight: number,
  bottomInset: number,
) {
  const logoHeight = Math.max(screenHeight * 0.28, vs(140));

  return StyleSheet.create({
    backgroundImage: {
      flex: 1,
      width: "100%",
      height: "100%",
    },
    backgroundOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: colors.authBackgroundOverlay,
    },
    safeArea: {
      flex: 1,
    },
    containerInner: {
      flex: 1,
      justifyContent: "space-between",
    },
    logoSection: {
      height: logoHeight,
      minHeight: vs(120),
      maxHeight: screenHeight * 0.38,
      alignItems: "center",
      justifyContent: "center",
    },
    brandLogoImage: {
      width: vs(240),
      height: vs(96),
      maxWidth: "72%",
    },
    cardSheet: {
      flex: 0,
      borderTopLeftRadius: vs(32),
      borderTopRightRadius: vs(32),
      overflow: "hidden",
      maxHeight: screenHeight * 0.62,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: -10 },
      shadowOpacity: 0.08,
      shadowRadius: 15,
      elevation: 20,
      paddingHorizontal: vs(16),
      paddingTop: vs(32),
      paddingBottom: Math.max(bottomInset, vs(28)),
    },
    headerGroup: {
      marginBottom: vs(12),
    },
    welcomeText: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.medium,
      color: colors.text,
      marginBottom: vs(4),
    },
    titleText: {
      fontSize: FONT_SIZES.display,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    tagline: {
      fontSize: FONT_SIZES.md,
      fontFamily: fonts.regular,
      color: colors.text,
      marginBottom: vs(28),
    },
    secondaryBtn: {
      marginTop: vs(12),
    },
  });
}
