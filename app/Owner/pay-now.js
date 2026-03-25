import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { BlurView } from "expo-blur";
import { getOwnerViolations } from "../../api/violations";
import { createPayment } from "../../api/payments";
import DecorativeBackground from "../../component/DecorativeBackground";
import { colors, fonts, shadows } from "../theme";

const RESOLVED_STATUSES = new Set([
  "PAID",
  "APPEAL_APPROVED",
  "DISMISSED",
  "RESOLVED",
]);

const isSelectableStatus = (statusKey) => {
  if (!statusKey || statusKey === "UNRESOLVED") return true;
  return statusKey.includes("PENDING");
};

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

const parseAmount = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  const digits = String(value).replace(/[^\d]/g, "");
  if (!digits) return null;
  return Number(digits);
};

const formatViolationType = (value) => {
  if (!value) return null;
  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const pickValue = (item, keys, fallback = "N/A") => {
  for (const key of keys) {
    if (item?.[key] !== null && item?.[key] !== undefined && item?.[key] !== "") {
      return item[key];
    }
  }
  return fallback;
};

export default function PayNow() {
  const { violationId } = useLocalSearchParams();
  const initialViolationId = Array.isArray(violationId) ? violationId[0] : violationId;
  const [violations, setViolations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectionOpen, setSelectionOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(initialViolationId || "");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  useEffect(() => {
    let isMounted = true;

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
      .catch((fetchError) => {
        if (!isMounted) return;
        setError(fetchError?.message || "Could not load violations.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const normalizedViolations = useMemo(
    () =>
      violations.map((item, index) => {
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
          date: pickValue(item, ["violationDate", "date", "issuedAt", "createdAt"], null),
          plateNumber: pickValue(item, ["plateNumber"], "N/A"),
          fine: formatMoney(pickValue(item, ["fine", "amount", "fineAmount"], null)),
          fineValue,
          status: rawStatus,
          statusKey,
        };
      }),
    [violations]
  );

  const selectedViolation = useMemo(() => {
    if (!selectedId) return null;
    return normalizedViolations.find((item) => String(item.backendId) === String(selectedId)) || null;
  }, [normalizedViolations, selectedId]);

  const selectableViolations = useMemo(() => {
    return normalizedViolations.filter((item) =>
      isSelectableStatus(item.statusKey)
    );
  }, [normalizedViolations]);

  const selectedPayable = selectedViolation
    ? isSelectableStatus(selectedViolation.statusKey)
    : false;

  useEffect(() => {
    if (!selectedViolation) return;
    if (selectedPayable) return;
    setSelectedId("");
    setSubmitError("That violation is already resolved. Please pick another.");
  }, [selectedPayable, selectedViolation]);

  const onSubmit = async () => {
    if (paymentSuccess) {
      return;
    }
    if (!selectedViolation?.backendId) {
      setSubmitError("Please select a violation to pay.");
      return;
    }

    if (!selectedPayable) {
      setSubmitError("Selected violation is already resolved.");
      return;
    }

    if (selectedViolation?.fineValue === null || selectedViolation?.fineValue === undefined) {
      setSubmitError("Selected violation does not have a payable amount.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await createPayment({
        violationId: selectedViolation.backendId,
        amount: selectedViolation.fineValue,
      });
      setPaymentSuccess(response);
    } catch (submitErrorState) {
      setSubmitError(submitErrorState?.message || "Could not create payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <DecorativeBackground variant="light">
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.headerBlock}>
            <Text style={styles.title}>Pay Now</Text>
            <Text style={styles.subtitle}>Select a violation and confirm the amount.</Text>
          </View>

          {isLoading ? (
            <View style={styles.inlineStatus}>
              <ActivityIndicator size="small" color={colors.violet} />
              <Text style={styles.statusText}>Loading violations...</Text>
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : paymentSuccess ? null : (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Violation</Text>
              <Pressable style={styles.selectButton} onPress={() => setSelectionOpen(true)}>
                <View>
                  <Text style={styles.selectValue}>
                    {selectedViolation?.type || "Select a violation"}
                  </Text>
                  <Text style={styles.selectHint}>
                    {selectedViolation?.plateNumber
                      ? `Plate ${selectedViolation.plateNumber}`
                      : "Tap to choose"}
                  </Text>
                </View>
                <Text style={styles.selectAction}>Change</Text>
              </Pressable>

              {selectedViolation ? (
                <View style={styles.detailBlock}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedViolation.date)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Fine Amount</Text>
                    <Text style={styles.detailValue}>{selectedViolation.fine}</Text>
                  </View>
                </View>
              ) : null}

              <Text style={styles.sectionLabel}>Amount</Text>
              <View style={styles.amountField}>
                <Text style={styles.amountValue}>
                  {selectedViolation?.fine || "N/A"}
                </Text>
                <Text style={styles.amountHint}>Auto-filled from violation</Text>
              </View>

              {!selectedViolation && !selectableViolations.length ? (
                <Text style={styles.statusText}>No unresolved or pending violations.</Text>
              ) : null}

              {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

              <Pressable
                style={[
                  styles.primaryButton,
                  (submitting || paymentSuccess || !selectedPayable) && styles.buttonDisabled,
                ]}
                onPress={onSubmit}
                disabled={submitting || paymentSuccess || !selectedPayable}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={colors.onyx} />
                ) : (
                  <Text style={styles.primaryButtonText}>Submit Payment</Text>
                )}
              </Pressable>
            </View>
          )}

          {paymentSuccess ? (
            <View style={styles.successCard}>
              <Text style={styles.successTitle}>Payment created</Text>
              <Text style={styles.successText}>
                Reference ID: {paymentSuccess.referenceId || "N/A"}
              </Text>
              <Text style={styles.successSubtext}>
                Amount: {formatMoney(paymentSuccess.amount)}
              </Text>
              <Pressable style={styles.secondaryButton} onPress={() => router.push("/Owner/home")}>
                <Text style={styles.secondaryButtonText}>Back to Violations</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>

        <Modal
          visible={selectionOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectionOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <BlurView intensity={35} tint="light" style={StyleSheet.absoluteFillObject} />
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Violation</Text>
                <Pressable onPress={() => setSelectionOpen(false)} style={styles.modalClose}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={styles.modalBody}>
                {selectableViolations.length ? (
                  selectableViolations.map((item) => {
                    const isActive = String(item.backendId) === String(selectedId);
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => {
                          setSelectedId(item.backendId || "");
                          setSelectionOpen(false);
                        }}
                        style={[styles.modalItem, isActive && styles.modalItemActive]}
                      >
                        <Text style={styles.modalItemTitle}>{item.type}</Text>
                        <Text style={styles.modalItemMeta}>
                          {item.plateNumber} • {formatDate(item.date)} • {item.fine}
                        </Text>
                      </Pressable>
                    );
                  })
                ) : (
                  <Text style={styles.statusText}>No violations available.</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </DecorativeBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.whiteSmoke,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 110,
  },
  headerBlock: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.onyx,
    fontFamily: fonts.display,
  },
  subtitle: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 14,
    fontFamily: fonts.body,
  },
  card: {
    width: "100%",
    padding: 20,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.softOnyx,
    ...shadows.lift,
  },
  sectionLabel: {
    color: colors.violet,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "700",
    fontFamily: fonts.body,
    marginBottom: 8,
  },
  selectButton: {
    borderWidth: 1,
    borderColor: colors.softViolet,
    borderRadius: 14,
    padding: 14,
    backgroundColor: colors.whiteSmoke,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  selectValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.onyx,
    fontFamily: fonts.body,
  },
  selectHint: {
    marginTop: 4,
    fontSize: 12,
    color: colors.muted,
    fontFamily: fonts.body,
  },
  selectAction: {
    color: colors.violet,
    fontWeight: "700",
    fontFamily: fonts.body,
  },
  detailBlock: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.softOnyx,
    backgroundColor: colors.mist,
    padding: 12,
    marginBottom: 16,
  },
  detailRow: {
    marginBottom: 8,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "700",
    fontFamily: fonts.body,
    marginBottom: 2,
  },
  detailValue: {
    color: colors.onyx,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: fonts.body,
  },
  amountField: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.softViolet,
    padding: 14,
    backgroundColor: colors.whiteSmoke,
    marginBottom: 16,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.onyx,
    fontFamily: fonts.display,
  },
  amountHint: {
    marginTop: 4,
    fontSize: 12,
    color: colors.muted,
    fontFamily: fonts.body,
  },
  inlineStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusText: {
    color: colors.muted,
    fontSize: 13,
    fontFamily: fonts.body,
  },
  errorText: {
    color: colors.coral,
    fontSize: 13,
    fontFamily: fonts.body,
    marginBottom: 12,
  },
  primaryButton: {
    borderRadius: 14,
    backgroundColor: colors.coral,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.onyx,
    fontWeight: "700",
    fontSize: 14,
    fontFamily: fonts.body,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  successCard: {
    width: "100%",
    marginTop: 16,
    padding: 18,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.softOnyx,
    ...shadows.lift,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.violet,
    fontFamily: fonts.display,
  },
  successText: {
    marginTop: 6,
    color: colors.onyx,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: fonts.body,
  },
  successSubtext: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.body,
  },
  secondaryButton: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.softOnyx,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.muted,
    fontWeight: "700",
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
    maxHeight: "80%",
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
    gap: 10,
  },
  modalItem: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.softOnyx,
    backgroundColor: colors.whiteSmoke,
  },
  modalItemActive: {
    borderColor: colors.violet,
    backgroundColor: colors.softViolet,
  },
  modalItemTitle: {
    color: colors.onyx,
    fontWeight: "700",
    fontSize: 14,
    fontFamily: fonts.body,
  },
  modalItemMeta: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.body,
  },
});
