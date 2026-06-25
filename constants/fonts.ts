import { verticalScale } from "react-native-size-matters";

export const FONTS = {
  regular: "Regular",
  medium: "Medium",
  semiBold: "SemiBold",
  bold: "Bold",
  title: "Montserrat",
} as const;

export const vs = (size: number) => verticalScale(size);

const BASE_FONT_SIZES = {
  xxs: 8,
  xs: 11,
  sm: 12,
  md: 14,
  lg: 15,
  xl: 16,
  xxl: 22,
  title: 28,
  display: 32,
  brand: 46,
} as const;

export const FONT_SIZES = {
  xxs: vs(BASE_FONT_SIZES.xxs),
  xs: vs(BASE_FONT_SIZES.xs),
  sm: vs(BASE_FONT_SIZES.sm),
  md: vs(BASE_FONT_SIZES.md),
  lg: vs(BASE_FONT_SIZES.lg),
  xl: vs(BASE_FONT_SIZES.xl),
  xxl: vs(BASE_FONT_SIZES.xxl),
  title: vs(BASE_FONT_SIZES.title),
  display: vs(BASE_FONT_SIZES.display),
  brand: vs(BASE_FONT_SIZES.brand),
} as const;
