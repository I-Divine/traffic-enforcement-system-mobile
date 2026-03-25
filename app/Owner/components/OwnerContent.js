import { StyleSheet, Text } from "react-native";
import OwnerDetailsTab from "../tabs/OwnerDetailsTab";
import OwnerVehiclesTab from "../tabs/OwnerVehiclesTab";
import OwnerViolationsTab from "../tabs/OwnerViolationsTab";
// import { colors, fonts } from "../theme";
import { colors, fonts } from "../../theme";

export default function OwnerContent({ activeTab, profile, error, tabs }) {
  if (error) {
    return <Text style={styles.statusText}>{error}</Text>;
  }

  if (!profile) {
    return <Text style={styles.statusText}>Loading profile...</Text>;
  }

  if (activeTab === tabs.VEHICLES) {
    return <OwnerVehiclesTab />;
  }

  if (activeTab === tabs.VIOLATIONS) {
    return <OwnerViolationsTab />;
  }

  return <OwnerDetailsTab profile={profile} />;
}

const styles = StyleSheet.create({
  statusText: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 16,
    marginTop: 40,
    fontFamily: fonts.body,
  },
});
