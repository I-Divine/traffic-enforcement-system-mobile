import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
// import { colors, fonts, shadows } from "../theme";
import { colors, fonts, shadows } from "../../theme";

export default function OwnerDropdownMenu({
  visible,
  onClose,
  onSettingsPress,
  onLogout,
}) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.dropdownLayer} pointerEvents="box-none">
      <Pressable style={styles.dropdownBackdrop} onPress={onClose} />
      <View style={styles.dropdownMenu}>
        <Pressable onPress={onSettingsPress} style={styles.dropdownItem}>
          <Ionicons name="settings-outline" size={17} color={colors.onyx} />
          <Text style={styles.dropdownText}>Settings</Text>
        </Pressable>
        <Pressable onPress={onLogout} style={styles.dropdownItem}>
          <Ionicons name="log-out-outline" size={17} color={colors.coral} />
          <Text style={[styles.dropdownText, styles.logoutText]}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
  },
  dropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dropdownMenu: {
    position: "absolute",
    top: 8,
    right: 16,
    width: 180,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.softOnyx,
    ...shadows.lift,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownText: {
    color: colors.onyx,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: fonts.body,
  },
  logoutText: {
    color: colors.coral,
  },
});
