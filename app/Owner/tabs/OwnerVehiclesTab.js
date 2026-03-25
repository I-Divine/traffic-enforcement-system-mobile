import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { getMyVehicles } from "../../../api/vehicle";
import { colors, fonts, shadows } from "../../theme";

const formatDate = (value) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString();
};

const getRegistrationStatus = (expiry) => {
  if (!expiry) return "Unknown";
  const expiryDate = new Date(expiry);
  if (Number.isNaN(expiryDate.getTime())) return "Unknown";

  const now = new Date();
  if (expiryDate < now) return "Expired";

  const millisDiff = expiryDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(millisDiff / (1000 * 60 * 60 * 24));
  if (daysDiff <= 30) return `Expires in ${daysDiff} day${daysDiff > 1 ? "s" : ""}`;
  return "Valid";
};

export default function OwnerVehiclesTab() {
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyVehicles()
      .then((data) => {
        const safeList = Array.isArray(data) ? data : [];
        setVehicles(safeList);
      })
      .catch((fetchError) => {
        setError(fetchError?.message || "Could not load vehicles.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <Text style={styles.statusText}>Loading vehicles...</Text>;
  }

  if (error) {
    return <Text style={styles.statusText}>{error}</Text>;
  }

  if (!vehicles.length) {
    return <Text style={styles.statusText}>No vehicles found.</Text>;
  }

  return (
    <View>
      {vehicles.map((vehicle) => (
        <View key={vehicle.vehicleId} style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Plate {vehicle.plateNumber}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {getRegistrationStatus(vehicle.registrationExpiry)}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Make</Text>
            <Text style={styles.value}>{vehicle.make}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Model</Text>
            <Text style={styles.value}>{vehicle.model}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Year</Text>
            <Text style={styles.value}>{vehicle.year}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Color</Text>
            <Text style={styles.value}>{vehicle.color}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Registration Date</Text>
            <Text style={styles.value}>{formatDate(vehicle.registrationDate)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Registration Expiry</Text>
            <Text style={styles.value}>{formatDate(vehicle.registrationExpiry)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    padding: 20,
    marginBottom: 12,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.softOnyx,
    ...shadows.lift,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 19,
    fontWeight: "700",
    color: colors.onyx,
    flex: 1,
    fontFamily: fonts.display,
  },
  badge: {
    backgroundColor: colors.softCoral,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.violet,
    fontSize: 11,
    fontWeight: "700",
    fontFamily: fonts.body,
  },
  divider: {
    height: 1,
    backgroundColor: colors.softOnyx,
    marginBottom: 12,
  },
  row: {
    marginBottom: 10,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 2,
    fontFamily: fonts.body,
  },
  value: {
    color: colors.onyx,
    fontSize: 15,
    fontWeight: "600",
    fontFamily: fonts.body,
  },
  statusText: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 16,
    marginTop: 40,
    fontFamily: fonts.body,
  },
});
