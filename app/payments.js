import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import DecorativeBackground from "../component/DecorativeBackground";
import PaymentsDashboard from "../component/PaymentsDashboard";
import { colors } from "./theme";

export default function Payments() {
  return (
    <SafeAreaView style={styles.container}>
      <DecorativeBackground variant="light">
        <View style={styles.contentWrap}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.animatedContent}>
              <PaymentsDashboard />
            </View>
          </ScrollView>
        </View>
      </DecorativeBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.whiteSmoke,
  },
  contentWrap: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 110,
  },
  animatedContent: {
    flexGrow: 1,
  },
});
