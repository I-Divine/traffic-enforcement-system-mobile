import { Pressable, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
// import { colors } from "../theme";
import { colors } from "../../theme";

export default function OwnerHeaderMenuButton({ onPress }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={styles.button}>
      <Ionicons name="menu" size={24} color={colors.onyx} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 2,
  },
});
