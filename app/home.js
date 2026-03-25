import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { clearToken, getToken } from "../api/tokenStorage";
import CameraScreen from "../component/cameraScreen";
import DecorativeBackground from "../component/DecorativeBackground";
import { colors, fonts, shadows } from "./theme";

export default function Home() {
  const [tokenPreview, setTokenPreview] = useState("");
  const heroAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadToken = async () => {
      const token = await getToken();
      if (!token) {
        setTokenPreview("No token stored.");
        return;
      }
      const preview = `${token.slice(0, 8)}...${token.slice(-6)}`;
      setTokenPreview(`JWT: ${preview}`);
    };
    loadToken();
  }, []);

  useEffect(() => {
    Animated.stagger(140, [
      Animated.timing(heroAnim, {
        toValue: 1,
        duration: 520,
        useNativeDriver: true,
      }),
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 520,
        useNativeDriver: true,
      }),
    ]).start();
  }, [heroAnim, cardAnim]);

  const onLogout = async () => {
    await clearToken();
    router.replace("/login");
  };

  const routeToOwnerTab = (tab) => {
    router.push({
      pathname: "/Owner/home",
      params: { tab },
    });
  };

  const routeToPayments = () => {
    router.push("/payments");
  };

  return (
    <DecorativeBackground variant="light">
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.cameraCard,
            {
              opacity: heroAnim,
              transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
            },
          ]}
        >
          <View style={styles.cameraHeader}>
            <Text style={styles.eyebrow}>Live Capture</Text>
            <Text style={styles.cameraTitle}>Plate Scan</Text>
          </View>
          <View style={styles.cameraFrame}>
            <CameraScreen />
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardAnim,
              transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            },
          ]}
        >
          <Text style={styles.title}>Command Center</Text>
          <Text style={styles.subtitle}>Route to the right dashboard in seconds.</Text>
          <Text style={styles.token}>{tokenPreview}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Owner Section</Text>
            <Pressable style={styles.navButton} onPress={() => routeToOwnerTab("details")}>
              <Text style={styles.navButtonText}>User Details</Text>
            </Pressable>
            <Pressable style={styles.navButton} onPress={() => routeToOwnerTab("vehicles")}>
              <Text style={styles.navButtonText}>Vehicles</Text>
            </Pressable>
            <Pressable style={styles.navButton} onPress={() => routeToOwnerTab("violations")}>
              <Text style={styles.navButtonText}>Violations</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Operations</Text>
            <Pressable style={styles.navButton} onPress={routeToPayments}>
              <Text style={styles.navButtonText}>Payments</Text>
            </Pressable>
          </View>

          <Pressable style={styles.trafficLink} onPress={() => router.push("/TrafficOfficer/home")}>
            <Text style={styles.trafficLinkText}>Go to Traffic Officer</Text>
          </Pressable>
          <TouchableOpacity style={styles.button} onPress={onLogout} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Log Out</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </DecorativeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 18,
    gap: 18,
  },
  cameraCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.softOnyx,
  },
  cameraHeader: {
    marginBottom: 12,
  },
  eyebrow: {
    color: colors.violet,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    fontSize: 11,
    fontWeight: "700",
    fontFamily: fonts.body,
  },
  cameraTitle: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: "700",
    color: colors.onyx,
    fontFamily: fonts.display,
  },
  cameraFrame: {
    height: 320,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(242, 244, 243, 0.2)",
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.softOnyx,
    ...shadows.soft,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.onyx,
    fontFamily: fonts.display,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 16,
    color: colors.muted,
    fontFamily: fonts.body,
  },
  token: {
    marginBottom: 20,
    color: colors.violet,
    fontFamily: fonts.mono,
    fontSize: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    color: colors.violet,
    fontWeight: "800",
    fontFamily: fonts.body,
    marginBottom: 8,
  },
  navButton: {
    borderWidth: 1,
    borderColor: colors.softViolet,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: colors.whiteSmoke,
  },
  navButtonText: {
    color: colors.onyx,
    fontWeight: "700",
    fontFamily: fonts.body,
  },
  trafficLink: {
    marginBottom: 16,
  },
  trafficLinkText: {
    color: colors.coral,
    fontWeight: "700",
    fontFamily: fonts.body,
  },
  button: {
    backgroundColor: colors.violet,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    ...shadows.lift,
  },
  buttonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
    fontFamily: fonts.body,
    letterSpacing: 0.4,
  },
});
