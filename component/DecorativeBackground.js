import { StyleSheet, View } from "react-native";
import { colors } from "../app/theme";

const themes = {
  dark: {
    base: colors.onyx,
    orbTop: "rgba(50, 10, 40, 0.62)",
    orbBottom: "rgba(247, 142, 105, 0.28)",
    stripe: "rgba(242, 244, 243, 0.08)",
    glow: "rgba(247, 142, 105, 0.12)",
  },
  light: {
    base: colors.whiteSmoke,
    orbTop: "rgba(247, 142, 105, 0.24)",
    orbBottom: "rgba(50, 10, 40, 0.12)",
    stripe: "rgba(7, 17, 8, 0.06)",
    glow: "rgba(50, 10, 40, 0.08)",
  },
};

export default function DecorativeBackground({ children, variant = "light" }) {
  const theme = themes[variant] || themes.light;

  return (
    <View style={[styles.container, { backgroundColor: theme.base }]}>
      <View pointerEvents="none" style={[styles.orb, styles.orbTop, { backgroundColor: theme.orbTop }]} />
      <View
        pointerEvents="none"
        style={[styles.orb, styles.orbBottom, { backgroundColor: theme.orbBottom }]}
      />
      <View pointerEvents="none" style={[styles.stripe, { borderColor: theme.stripe }]} />
      <View pointerEvents="none" style={[styles.glow, { backgroundColor: theme.glow }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
  },
  orbTop: {
    width: 260,
    height: 260,
    top: -80,
    right: -60,
  },
  orbBottom: {
    width: 320,
    height: 320,
    bottom: -140,
    left: -80,
  },
  stripe: {
    position: "absolute",
    top: 120,
    left: -40,
    right: -40,
    height: 180,
    borderWidth: 1,
    borderRadius: 24,
    transform: [{ rotate: "-6deg" }],
  },
  glow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    bottom: 140,
    right: -100,
  },
});
