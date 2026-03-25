import { Stack } from "expo-router";
import { colors, fonts } from "./theme";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.whiteSmoke },
        headerTintColor: colors.onyx,
        headerTitleStyle: {
          fontWeight: "700",
          fontFamily: fonts.display,
          letterSpacing: 0.3,
        },
      }}
    >
      <Stack.Screen name="login" options={{ title: "Login" }} />
      <Stack.Screen name="home" options={{ title: "Home" }} />
      <Stack.Screen name="Owner/home" options={{ title: "Owner Dashboard" }} />
      <Stack.Screen name="Owner/pay-now" options={{ title: "Pay Now" }} />
      <Stack.Screen name="Owner/settings" options={{ title: "Settings" }} />
      <Stack.Screen
        name="TrafficOfficer/home"
        options={{ title: "Traffic Officer Dashboard" }}
      />
      <Stack.Screen name="payments" options={{ title: "Payments" }} />
    </Stack>
  );
}
