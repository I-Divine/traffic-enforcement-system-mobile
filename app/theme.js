import { Platform } from "react-native";

export const colors = {
  white: "#ffffff",
  whiteSmoke: "#f2f4f3",
  onyx: "#071108",
  coral: "#f78e69",
  violet: "#320a28",
  ink: "#1a201a",
  muted: "#5b6b62",
  fog: "#e3e7e5",
  softCoral: "rgba(247, 142, 105, 0.18)",
  softViolet: "rgba(50, 10, 40, 0.14)",
  softOnyx: "rgba(7, 17, 8, 0.1)",
  mist: "rgba(242, 244, 243, 0.7)",
};

export const fonts = {
  display: Platform.select({
    ios: "Helvetica Neue",
    android: "sans-serif-medium",
    default: "Helvetica Neue",
  }),
  body: Platform.select({
    ios: "Helvetica Neue",
    android: "sans-serif",
    default: "Helvetica Neue",
  }),
  mono: Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "Menlo",
  }),
};

export const shadows = {
  soft: {
    shadowColor: colors.onyx,
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 6,
  },
  lift: {
    shadowColor: colors.onyx,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 4,
  },
};
