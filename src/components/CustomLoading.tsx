import { Animations } from "@constants/animations";
import { vs } from "@constants/fonts";
import LottieView from "lottie-react-native";
import { useMemo } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

const SIZES = {
  xs: vs(20),
  sm: vs(28),
  md: vs(40),
  lg: vs(56),
  xl: vs(72),
  xxl: vs(96),
  xxxl: vs(120),
  xxxxl: vs(144),
  xxxxxl: vs(168),
  xxxxxxl: vs(192),
  xxxxxxxl: vs(216),
  xxxxxxxxl: vs(240),
  xxxxxxxxxl: vs(264),
  xxxxxxxxxxl: vs(288),
  xxxxxxxxxxxl: vs(312),
  xxxxxxxxxxxxl: vs(336),
} as const;

type LoadingSize = keyof typeof SIZES;

type CustomLoadingProps = {
  size?: LoadingSize;
  style?: StyleProp<ViewStyle>;
};

export default function CustomLoading({
  size = "md",
  style,
}: CustomLoadingProps) {
  const dimension = SIZES[size];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: dimension,
          height: dimension,
          alignItems: "center",
          justifyContent: "center",
        },
        animation: {
          width: dimension,
          height: dimension,
        },
      }),
    [dimension],
  );

  return (
    <View style={[styles.container, style]}>
      <LottieView
        source={Animations.loader}
        autoPlay
        loop
        style={styles.animation}
      />
    </View>
  );
}
