import { useEffect, useLayoutEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { clearToken } from "../../api/tokenStorage";
import { getUserProfile } from "../../api/userProfile";
import DecorativeBackground from "../../component/DecorativeBackground";
import { colors } from "../theme";
import OwnerContent from "./components/OwnerContent";
import OwnerDropdownMenu from "./components/OwnerDropdownMenu";
import OwnerHeaderMenuButton from "./components/OwnerHeaderMenuButton";
import OwnerTabBar from "./components/OwnerTabBar";

const OWNER_TABS = {
  DETAILS: "details",
  VEHICLES: "vehicles",
  VIOLATIONS: "violations",
};

export default function home() {
  const { tab } = useLocalSearchParams();
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(OWNER_TABS.DETAILS);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    getUserProfile()
      .then((data) => {
        console.log("User data:", data);
        setProfile(data);
      })
      .catch((profileError) => {
        console.error("Error fetching user profile:", profileError);
        setError("Could not load profile. Please try again.");
      });
  }, []);

  useEffect(() => {
    const requestedTab = Array.isArray(tab) ? tab[0] : tab;
    if (Object.values(OWNER_TABS).includes(requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [tab]);

  const onSettingsPress = () => {
    setMenuOpen(false);
    router.push("/Owner/settings");
  };

  const onLogout = async () => {
    setMenuOpen(false);
    await clearToken();
    router.replace("/login");
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <OwnerHeaderMenuButton onPress={() => setMenuOpen((prev) => !prev)} />
      ),
    });
  }, [navigation]);

  const tabItems = [
    { key: OWNER_TABS.DETAILS, label: "Details", icon: "person-circle-outline" },
    { key: OWNER_TABS.VEHICLES, label: "Vehicles", icon: "car-sport-outline" },
    { key: OWNER_TABS.VIOLATIONS, label: "Violations", icon: "alert-circle-outline" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <DecorativeBackground variant="light">
        <View style={styles.contentWrap}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.animatedContent}>
              <OwnerContent
                activeTab={activeTab}
                profile={profile}
                error={error}
                tabs={OWNER_TABS}
              />
            </View>
          </ScrollView>
        </View>

        <OwnerDropdownMenu
          visible={menuOpen}
          onClose={() => setMenuOpen(false)}
          onSettingsPress={onSettingsPress}
          onLogout={onLogout}
        />

        <OwnerTabBar
          tabs={tabItems}
          activeTab={activeTab}
          onTabPress={setActiveTab}
        />
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
