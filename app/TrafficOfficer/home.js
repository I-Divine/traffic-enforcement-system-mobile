import { useEffect, useLayoutEffect, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { clearToken } from "../../api/tokenStorage";
import { getUserProfile } from "../../api/userProfile";
import TrafficOfficerDetailsTab from "./tabs/TrafficOfficerDetailsTab";
import TrafficOfficerPlateSearchTab from "./tabs/TrafficOfficerPlateSearchTab";
import TrafficOfficerPaymentsTab from "./tabs/TrafficOfficerPaymentsTab";
import DecorativeBackground from "../../component/DecorativeBackground";
import { colors, fonts, shadows } from "../theme";

const OFFICER_TABS = {
  DETAILS: "details",
  SEARCH: "search",
  PAYMENTS: "payments",
};

export default function home() {
  const { tab } = useLocalSearchParams();
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(OFFICER_TABS.DETAILS);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    getUserProfile()
      .then((data) => {
        console.log("Traffic officer data:", data);
        setProfile(data);
      })
      .catch((fetchError) => {
        console.error("Error fetching traffic officer profile:", fetchError);
        setError("Could not load profile. Please try again.");
      });
  }, []);

  useEffect(() => {
    const requestedTab = Array.isArray(tab) ? tab[0] : tab;
    if (Object.values(OFFICER_TABS).includes(requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [tab]);

  const onSettingsPress = () => {
    setMenuOpen(false);
  };

  const onLogout = async () => {
    setMenuOpen(false);
    await clearToken();
    router.replace("/login");
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => setMenuOpen((prev) => !prev)}
          hitSlop={10}
          style={styles.headerMenuButton}
        >
          <Ionicons name="menu" size={24} color={colors.onyx} />
        </Pressable>
      ),
    });
  }, [navigation]);

  const renderTabs = () => {
    const tabs = [
      { key: OFFICER_TABS.DETAILS, label: "Details", icon: "person-circle-outline" },
      { key: OFFICER_TABS.SEARCH, label: "Plate Search", icon: "scan-outline" },
      { key: OFFICER_TABS.PAYMENTS, label: "Payments", icon: "cash-outline" },
    ];

    return (
      <View style={styles.bottomTabBar}>
        {tabs.map((tabItem) => {
          const isActive = activeTab === tabItem.key;
          return (
            <Pressable
              key={tabItem.key}
              onPress={() => setActiveTab(tabItem.key)}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
            >
              <Ionicons
                name={tabItem.icon}
                size={18}
                color={isActive ? colors.violet : colors.muted}
              />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tabItem.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderContent = () => {
    if (activeTab === OFFICER_TABS.SEARCH) {
      return <TrafficOfficerPlateSearchTab />;
    }

    if (activeTab === OFFICER_TABS.PAYMENTS) {
      return <TrafficOfficerPaymentsTab />;
    }

    if (error) {
      return <Text style={styles.statusText}>{error}</Text>;
    }

    if (!profile) {
      return <Text style={styles.statusText}>Loading profile...</Text>;
    }

    return <TrafficOfficerDetailsTab profile={profile} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <DecorativeBackground variant="light">
        <View style={styles.contentWrap}>
          {activeTab === OFFICER_TABS.SEARCH ? (
            <View style={styles.searchContentWrap}>
              <View style={styles.animatedContent}>{renderContent()}</View>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.animatedContent}>{renderContent()}</View>
            </ScrollView>
          )}
        </View>

        {menuOpen ? (
          <View style={styles.dropdownLayer} pointerEvents="box-none">
            <Pressable style={styles.dropdownBackdrop} onPress={() => setMenuOpen(false)} />
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
        ) : null}
        {renderTabs()}
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
  searchContentWrap: {
    flex: 1,
    padding: 20,
    paddingBottom: 110,
  },
  headerMenuButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 2,
  },
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
  statusText: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 16,
    fontFamily: fonts.body,
  },
});
