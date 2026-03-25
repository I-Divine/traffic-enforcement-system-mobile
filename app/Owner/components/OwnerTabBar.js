import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, fonts, shadows } from "../../theme";

export default function OwnerTabBar({ tabs, activeTab, onTabPress }) {
  return (
    <View style={styles.bottomTabBar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabPress(tab.key)}
            style={[styles.tabButton, isActive && styles.tabButtonActive]}
          >
            <Ionicons
              name={tab.icon}
              size={18}
              color={isActive ? colors.violet : colors.muted}
            />
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomTabBar: {
    flexDirection: "row",
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    borderRadius: 18,
    padding: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.softOnyx,
    ...shadows.lift,
  },
  tabButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabButtonActive: {
    backgroundColor: "transparent",
  },
  tabText: {
    color: colors.muted,
    fontWeight: "700",
    fontSize: 12,
    fontFamily: fonts.body,
  },
  tabTextActive: {
    color: colors.violet,
  },
});
