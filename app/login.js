import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Pressable,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { login } from "../api/auth";
import DecorativeBackground from "../component/DecorativeBackground";
import { colors, fonts, shadows } from "./theme";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const brandAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(140, [
      Animated.timing(brandAnim, {
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
  }, [brandAnim, cardAnim]);

  const onSubmit = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      await login(email.trim(), password)
       .then(data => {
    if (data.role === "OWNERS") {
        router.replace("/Owner/home");
        console.log("owner");
        return;
    }
    if (data.role === "ROAD_OFFICERS" || data.role === "ROAD_OFFICER") {
        router.replace("/TrafficOfficer/home");
        return;
    }
    router.replace("/home");
})
        .catch((err) => console.log(err));
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DecorativeBackground variant="light">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Animated.View
          style={[
            styles.brandBlock,
            {
              opacity: brandAnim,
              transform: [{ translateY: brandAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
            },
          ]}
        >
          <Text style={styles.eyebrow}>Traffic Enforcement</Text>
          <Text style={styles.title}>Secure Access</Text>
          <Text style={styles.subtitle}>Sign in to continue your shift.</Text>
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
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Your password"
              placeholderTextColor={colors.muted}
              secureTextEntry={!showPassword}
              textContentType="password"
              value={password}
              onChangeText={setPassword}
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color={colors.muted}
              />
            </Pressable>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={onSubmit}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.onyx} />
            ) : (
              <Text style={styles.buttonText}>Log In</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </DecorativeBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  brandBlock: {
    marginBottom: 24,
  },
  eyebrow: {
    color: colors.violet,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    fontWeight: "700",
    fontFamily: fonts.body,
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
    fontSize: 30,
    fontWeight: "700",
    color: colors.onyx,
    fontFamily: fonts.display,
  },
  subtitle: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.body,
  },
  label: {
    fontSize: 14,
    color: colors.violet,
    fontFamily: fonts.body,
    marginBottom: 8,
    fontWeight: "700",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.softViolet,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: colors.whiteSmoke,
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.softViolet,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: colors.whiteSmoke,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.onyx,
    backgroundColor: colors.whiteSmoke,
    fontFamily: fonts.body,
  },
  eyeIcon: {
    padding: 8,
  },
  error: {
    color: colors.coral,
    marginBottom: 12,
    fontWeight: "600",
  },
  button: {
    backgroundColor: colors.violet,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    ...shadows.lift,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.3,
    fontFamily: fonts.body,
  },
});
