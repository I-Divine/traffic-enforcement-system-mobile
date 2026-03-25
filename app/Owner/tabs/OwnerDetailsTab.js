import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, shadows } from "../../theme";

const formatDate = (value) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString();
};

export default function OwnerDetailsTab({ profile }) {
  const { firstName, lastName, ownerDetails, email, phoneNumber, createdAt } =
    profile || {};

  const fullName = `${firstName || ""} ${lastName || ""}`.trim() || "N/A";
  const licenseNumber = ownerDetails?.driversLicenseNumber || "N/A";
  const address =
    [ownerDetails?.address, ownerDetails?.city, ownerDetails?.state]
      .filter(Boolean)
      .join(", ") || "N/A";

  return (
    <View style={styles.shellCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.issuer}>Traffic Enforcement Authority</Text>
          <Text style={styles.docType}>Driver License</Text>
        </View>
        <View style={styles.validTag}>
          <Text style={styles.validTagText}>VALID</Text>
        </View>
      </View>

      <View style={styles.watermarkWrap}>
        <Text style={styles.watermark}>DL</Text>
      </View>

      <View style={styles.mainSection}>
        <View style={styles.avatarBox}>
          <Text style={styles.avatarText}>
            {`${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "--"}
          </Text>
        </View>

        <View style={styles.identityBlock}>
          <Text style={styles.fieldLabel}>License Holder</Text>
          <Text style={styles.holderName}>{fullName}</Text>

          <Text style={styles.fieldLabel}>License Number</Text>
          <Text style={styles.licenseNumber}>{licenseNumber}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.gridRow}>
        <View style={styles.gridItem}>
          <Text style={styles.fieldLabel}>Issued</Text>
          <Text style={styles.fieldValue}>{formatDate(createdAt)}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.fieldLabel}>Phone</Text>
          <Text style={styles.fieldValue}>{phoneNumber || "N/A"}</Text>
        </View>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.gridItemFull}>
          <Text style={styles.fieldLabel}>Email</Text>
          <Text style={styles.fieldValue} numberOfLines={1}>
            {email || "N/A"}
          </Text>
        </View>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.gridItemFull}>
          <Text style={styles.fieldLabel}>Address</Text>
          <Text style={styles.fieldValue}>{address}</Text>
        </View>
      </View>

      <View style={styles.footerStrip}>
        <Text style={styles.footerText}>ID Card</Text>
        <Text style={styles.footerText}>Road Safety Unit</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shellCard: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.softOnyx,
    ...shadows.soft,
    position: "relative",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.whiteSmoke,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  issuer: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    fontWeight: "700",
    fontFamily: fonts.body,
  },
  docType: {
    color: colors.onyx,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 2,
    fontFamily: fonts.display,
  },
  validTag: {
    backgroundColor: colors.coral,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  validTagText: {
    color: colors.onyx,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  watermarkWrap: {
    position: "absolute",
    right: 10,
    top: 62,
    zIndex: 0,
  },
  watermark: {
    fontSize: 72,
    color: colors.softViolet,
    fontWeight: "800",
  },
  mainSection: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
    zIndex: 1,
  },
  avatarBox: {
    width: 74,
    height: 90,
    borderRadius: 10,
    backgroundColor: colors.softCoral,
    borderWidth: 1,
    borderColor: colors.coral,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: colors.onyx,
    fontSize: 28,
    fontWeight: "800",
    fontFamily: fonts.display,
  },
  identityBlock: {
    flex: 1,
    justifyContent: "center",
  },
  fieldLabel: {
    fontSize: 11,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
    fontFamily: fonts.body,
  },
  holderName: {
    fontSize: 20,
    color: colors.onyx,
    fontWeight: "800",
    marginBottom: 8,
    fontFamily: fonts.display,
  },
  licenseNumber: {
    fontSize: 18,
    color: colors.violet,
    fontWeight: "800",
    letterSpacing: 1,
    fontFamily: fonts.mono,
  },
  divider: {
    height: 1,
    marginTop: 14,
    marginHorizontal: 16,
    backgroundColor: colors.softOnyx,
  },
  gridRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 10,
  },
  gridItem: {
    flex: 1,
  },
  gridItemFull: {
    flex: 1,
    paddingBottom: 2,
  },
  fieldValue: {
    color: colors.onyx,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
    fontFamily: fonts.body,
  },
  footerStrip: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.whiteSmoke,
    borderTopWidth: 1,
    borderTopColor: colors.softOnyx,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    fontFamily: fonts.body,
  },
});
