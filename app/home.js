import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { clearToken, getToken } from "../api/tokenStorage";
import CameraScreen from "../component/cameraScreen";

export default function Home() {
  const [tokenPreview, setTokenPreview] = useState("");

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

  const onLogout = async () => {
    await clearToken();
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <CameraScreen />
      <View style={styles.card}>
        <Text style={styles.title}>Traffic Enforcement</Text>
        <Text style={styles.subtitle}>Home Dashboard</Text>
        <Text style={styles.token}>{tokenPreview}</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={onLogout}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1f2a",
    padding: 24,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0b1f2a",
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 16,
    color: "#4b5b6a",
  },
  token: {
    marginBottom: 20,
    color: "#4b5b6a",
  },
  button: {
    backgroundColor: "#0b1f2a",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
});
