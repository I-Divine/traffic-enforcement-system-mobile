import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { getOwnerViolations } from "../../../api/violations";
import { createAppeal } from "../../../api/appeals";
import { colors, fonts, shadows } from "../../theme";
import { BlurView } from "expo-blur";

const formatDate = (value) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString();
};

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  if (typeof value === "number") {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(value);
  }
  return String(value);
};

const formatViolationType = (value) => {
  if (!value) return null;
  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const formatStatusLabel = (value) => {
  if (!value) return "Unresolved";
  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const parseAmount = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  const digits = String(value).replace(/[^\d]/g, "");
  if (!digits) return null;
  return Number(digits);
};

const STATUS_TONE = {
  UNRESOLVED: { bg: colors.softViolet, text: colors.violet },
  APPEAL_PENDING: { bg: colors.softViolet, text: colors.violet },
  APPEAL_APPROVED: { bg: colors.whiteSmoke, text: colors.onyx },
  APPEAL_REJECTED: { bg: colors.softCoral, text: colors.violet },
  PAID: { bg: colors.whiteSmoke, text: colors.onyx },
  DISMISSED: { bg: colors.whiteSmoke, text: colors.muted },
  RESOLVED: { bg: colors.whiteSmoke, text: colors.muted },
};

const APPEAL_LOCKED_STATUSES = new Set([
  "APPEAL_PENDING",
  "APPEAL_REJECTED",
  "APPEAL_APPROVED",
]);

const PAYMENT_LOCKED_STATUSES = new Set([
  "PAID",
  "DISMISSED",
  "RESOLVED",
  "APPEAL_PENDING",
  "APPEAL_APPROVED",
]);

const RESOLVED_STATUSES = new Set([
  "PAID",
  "APPEAL_APPROVED",
  "DISMISSED",
  "RESOLVED",
]);

const pickValue = (item, keys, fallback = "N/A") => {
  for (const key of keys) {
    if (item?.[key] !== null && item?.[key] !== undefined && item?.[key] !== "") {
      return item[key];
    }
  }
  return fallback;
};

export default function OwnerViolationsTab() {
  const [violations, setViolations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [appealOpen, setAppealOpen] = useState(false);
  const [appealDescription, setAppealDescription] = useState("");
  const [appealViolation, setAppealViolation] = useState(null);
  const [appealSubmitting, setAppealSubmitting] = useState(false);
  const [appealError, setAppealError] = useState("");
  const [appealSuccess, setAppealSuccess] = useState("");

  const loadViolations = useCallback(() => {
    let isMounted = true;
    setIsLoading(true);
    setError("");

    getOwnerViolations()
      .then((data) => {
        if (!isMounted) return;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.violations)
              ? data.violations
              : [];

        setViolations(list);
      })
      .catch((requestError) => {
        if (!isMounted) return;
        setError(requestError?.message || "Could not load violations.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const cleanup = loadViolations();
      return () => {
        if (typeof cleanup === "function") cleanup();
      };
    }, [loadViolations])
  );

  const normalizedViolations = useMemo(
    () => {
      const normalized = violations.map((item, index) => {
        const backendId = pickValue(item, ["id", "violationId", "_id"], null);
        const fineValue = parseAmount(pickValue(item, ["fine", "amount", "fineAmount"], null));
        const rawStatus = pickValue(item, ["status", "paymentStatus", "state"]);
        const statusKey = String(rawStatus || "UNRESOLVED").toUpperCase();
        return {
          id: backendId || `VL-${index + 1}`,
          backendId,
        type:
          formatViolationType(pickValue(item, ["violationType", "type", "offense"], null)) ||
          pickValue(item, ["description"], "Unspecified Violation"),
        status: rawStatus,
        statusKey,
        date: pickValue(item, ["violationDate", "date", "issuedAt", "createdAt"], null),
        plateNumber: pickValue(item, ["plateNumber"]),
        location:
          [item?.lga, item?.state].filter(Boolean).join(", ") ||
          pickValue(item, ["location", "address", "place", "gpsCoordinates"]),
        fine: formatMoney(pickValue(item, ["fine", "amount", "fineAmount"], null)),
        fineValue,
        };
      });

      // Sort unresolved and pending violations to the top
      return normalized.sort((a, b) => {
        const aIsUnresolvedOrPending = a.statusKey === "UNRESOLVED" || a.statusKey === "APPEAL_PENDING";
        const bIsUnresolvedOrPending = b.statusKey === "UNRESOLVED" || b.statusKey === "APPEAL_PENDING";
        
        if (aIsUnresolvedOrPending && !bIsUnresolvedOrPending) return -1;
        if (!aIsUnresolvedOrPending && bIsUnresolvedOrPending) return 1;
        return 0;
      });
    },
    [violations]
  );

  const openAppeal = (violation) => {
    setAppealViolation(violation);
    setAppealDescription("");
    setAppealError("");
    setAppealSuccess("");
    setAppealOpen(true);
  };

  const submitAppeal = async () => {
    if (!appealViolation?.backendId || !appealDescription.trim()) {
      setAppealError("Please add a short description for the appeal.");
      return;
    }

    setAppealSubmitting(true);
    setAppealError("");

    try {
      await createAppeal({
        violationId: appealViolation.backendId,
        description: appealDescription.trim(),
        evidenceUrl: "",
      });
      setAppealOpen(false);
      setAppealSuccess("Appeal submitted. We will notify you with the outcome.");
    } catch (submitError) {
      setAppealError(submitError?.message || "Could not submit the appeal.");
    } finally {
      setAppealSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="small" color={colors.violet} />
        <Text style={styles.stateText}>Loading violations...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!normalizedViolations.length) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.stateText}>No violations found.</Text>
      </View>
    );
  }

  return (
    <View>
      {appealSuccess ? (
        <View style={styles.successCard}>
          <Text style={styles.successText}>{appealSuccess}</Text>
        </View>
      ) : null}
      {normalizedViolations.map((violation) => (
        <View key={violation.id} style={styles.card}>
          {(() => {
            const statusKey = violation.statusKey || "UNRESOLVED";
            const resolvedStatus = RESOLVED_STATUSES.has(statusKey) ? "RESOLVED" : statusKey;
            const tone = STATUS_TONE[resolvedStatus] || STATUS_TONE.UNRESOLVED;
            const label = resolvedStatus === "RESOLVED" ? "Resolved" : formatStatusLabel(statusKey);
            return (
              <View style={styles.headerRow}>
                <Text style={styles.title}>{violation.type}</Text>
                <View style={[styles.badge, { backgroundColor: tone.bg, borderColor: tone.text }]}>
                  <Text style={[styles.badgeText, { color: tone.text }]}>{label}</Text>
                </View>
              </View>
            );
          })()}
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{formatDate(violation.date)}</Text>
          </View>
           <View style={styles.row}>
            <Text style={styles.label}>Plate Number</Text>
            <Text style={styles.value}>{violation.plateNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>{violation.location}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fine</Text>
            <Text style={styles.value}>{violation.fine}</Text>
          </View>

          {(() => {
            const statusKey = violation.statusKey || "UNRESOLVED";
            if (RESOLVED_STATUSES.has(statusKey)) {
              return null;
            }
            const payLocked =
              !violation.backendId || PAYMENT_LOCKED_STATUSES.has(statusKey);
            const appealLocked =
              !violation.backendId || APPEAL_LOCKED_STATUSES.has(statusKey);
            return (
              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.payButton, payLocked && styles.appealButtonDisabled]}
                  onPress={() =>
                    router.push({
                      pathname: "/Owner/pay-now",
                      params: {
                        violationId: violation.backendId,
                      },
                    })
                  }
                  disabled={payLocked}
                >
                  <Text style={styles.payButtonText}>
                    {payLocked ? "Paid" : "Pay Now"}
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.appealButton,
                    appealLocked && styles.appealButtonDisabled,
                  ]}
                  onPress={() => openAppeal(violation)}
                  disabled={appealLocked}
                >
                  <Text style={styles.appealButtonText}>
                    {appealLocked ? "Appeal Unavailable" : "Appeal"}
                  </Text>
                </Pressable>
              </View>
            );
          })()}
        </View>
      ))}

      <Modal
        visible={appealOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setAppealOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <BlurView intensity={35} tint="light" style={StyleSheet.absoluteFillObject} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submit Appeal</Text>
              <Pressable onPress={() => setAppealOpen(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Violation</Text>
              <Text style={styles.modalValue}>{appealViolation?.type || "Violation"}</Text>

              <Text style={styles.modalLabel}>Reason for appeal</Text>
              <TextInput
                value={appealDescription}
                onChangeText={setAppealDescription}
                placeholder="I was not the driver at the time of the incident."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={styles.modalInput}
              />

              {appealError ? <Text style={styles.errorText}>{appealError}</Text> : null}

              <View style={styles.modalActions}>
                <Pressable style={styles.secondaryButton} onPress={() => setAppealOpen(false)}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.payButton, appealSubmitting && styles.buttonDisabled]}
                  onPress={submitAppeal}
                  disabled={appealSubmitting}
                >
                  {appealSubmitting ? (
                    <ActivityIndicator size="small" color={colors.onyx} />
                  ) : (
                    <Text style={styles.payButtonText}>Submit Appeal</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  centerState: {
    width: "100%",
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  stateText: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
    fontFamily: fonts.body,
  },
  errorText: {
    color: colors.coral,
    fontSize: 14,
    textAlign: "center",
    fontFamily: fonts.body,
  },
  successCard: {
    width: "100%",
    marginBottom: 12,
    borderRadius: 14,
    padding: 12,
    backgroundColor: colors.whiteSmoke,
    borderWidth: 1,
    borderColor: colors.softOnyx,
  },
  successText: {
    color: colors.violet,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: fonts.body,
  },
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
    borderWidth: 1,
    borderColor: colors.violet,
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
  actionRow: {
    marginTop: 4,
    flexDirection: "row",
    gap: 10,
  },
  payButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: colors.coral,
    paddingVertical: 10,
    alignItems: "center",
  },
  payButtonText: {
    color: colors.onyx,
    fontWeight: "700",
    fontSize: 13,
    fontFamily: fonts.body,
  },
  appealButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.softViolet,
    backgroundColor: colors.whiteSmoke,
    paddingVertical: 10,
    alignItems: "center",
  },
  appealButtonDisabled: {
    opacity: 0.6,
  },
  appealButtonText: {
    color: colors.violet,
    fontWeight: "700",
    fontSize: 13,
    fontFamily: fonts.body,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(7, 17, 8, 0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.softOnyx,
    overflow: "hidden",
    ...shadows.lift,
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.softOnyx,
    backgroundColor: colors.whiteSmoke,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.onyx,
    fontFamily: fonts.display,
  },
  modalClose: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  modalCloseText: {
    color: colors.muted,
    fontWeight: "700",
    fontFamily: fonts.body,
  },
  modalBody: {
    padding: 16,
  },
  modalLabel: {
    color: colors.muted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "700",
    fontFamily: fonts.body,
    marginBottom: 6,
  },
  modalValue: {
    color: colors.onyx,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: fonts.body,
  },
  modalSubValue: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.mono,
    marginBottom: 12,
  },
  modalInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.softViolet,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.whiteSmoke,
    color: colors.onyx,
    fontFamily: fonts.body,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: 6,
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.softOnyx,
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    color: colors.muted,
    fontWeight: "700",
    fontFamily: fonts.body,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
