import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getPayments, getPaymentTotals } from "../api/payments";
import { colors, fonts, shadows } from "../app/theme";

const TOTAL_PERIODS = [
  { key: "MONTH", label: "Month" },
  { key: "QUARTER", label: "Quarter" },
  { key: "YEAR", label: "Year" },
  { key: "FIVE_YEARS", label: "Five Years" },
];

const formatDate = (value) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString();
};

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleString();
};

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  const numeric =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(numeric)) return String(value);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(numeric);
};

export default function PaymentsDashboard() {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePeriod, setActivePeriod] = useState("MONTH");
  const [totals, setTotals] = useState(null);
  const [totalsLoading, setTotalsLoading] = useState(true);
  const [totalsError, setTotalsError] = useState("");

  useEffect(() => {
    let isMounted = true;

    getPayments()
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        setPayments(list);
      })
      .catch((fetchError) => {
        if (!isMounted) return;
        setError(fetchError?.message || "Could not load payments.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    setTotalsLoading(true);
    setTotalsError("");

    getPaymentTotals(activePeriod)
      .then((data) => {
        if (!isMounted) return;
        setTotals(data);
      })
      .catch((fetchError) => {
        if (!isMounted) return;
        setTotalsError(fetchError?.message || "Could not load totals.");
      })
      .finally(() => {
        if (isMounted) setTotalsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activePeriod]);

  const orderedPayments = useMemo(() => {
    return [...payments].sort((a, b) => {
      const timeA = new Date(a?.createdAt || 0).getTime();
      const timeB = new Date(b?.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [payments]);

  return (
    <View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Totals</Text>
        <View style={styles.filterRow}>
          {TOTAL_PERIODS.map((period) => {
            const isActive = activePeriod === period.key;
            return (
              <Pressable
                key={period.key}
                onPress={() => setActivePeriod(period.key)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {period.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {totalsLoading ? (
          <View style={styles.inlineStatus}>
            <ActivityIndicator size="small" color={colors.violet} />
            <Text style={styles.statusText}>Loading totals...</Text>
          </View>
        ) : totalsError ? (
          <Text style={styles.errorText}>{totalsError}</Text>
        ) : (
          <View style={styles.totalsRow}>
            <View>
              <Text style={styles.totalsAmount}>
                {formatMoney(totals?.totalAmount)}
              </Text>
              <Text style={styles.totalsRange}>
                {formatDate(totals?.startDate)} - {formatDate(totals?.endDate)}
              </Text>
            </View>
            <View style={styles.totalsBadge}>
              <Text style={styles.totalsBadgeText}>{totals?.period || activePeriod}</Text>
            </View>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Recent Payments</Text>

      {isLoading ? (
        <View style={styles.inlineStatus}>
          <ActivityIndicator size="small" color={colors.violet} />
          <Text style={styles.statusText}>Loading payments...</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : !orderedPayments.length ? (
        <Text style={styles.statusText}>No payments recorded yet.</Text>
      ) : (
        orderedPayments.map((payment, index) => {
          const key = payment.paymentId || payment.referenceId || `${payment.userEmail || "payment"}-${index}`;
          return (
            <View key={key} style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <Text style={styles.paymentAmount}>{formatMoney(payment.amount)}</Text>
                <View style={styles.paymentBadge}>
                  <Text numberOfLines={1} ellipsizeMode="tail" style={styles.paymentBadgeText}>Ref {payment.referenceId || "N/A"}</Text>
                </View>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Payer</Text>
                <Text style={styles.paymentValue}>{payment.fullName || "Unknown"}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Email</Text>
                <Text style={styles.paymentValue}>{payment.userEmail || "N/A"}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Date</Text>
                <Text style={styles.paymentValue}>{formatDateTime(payment.createdAt)}</Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    padding: 20,
    marginBottom: 16,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.softOnyx,
    ...shadows.lift,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.onyx,
    fontFamily: fonts.display,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.whiteSmoke,
    borderWidth: 1,
    borderColor: colors.softViolet,
  },
  filterChipActive: {
    backgroundColor: colors.violet,
  },
  filterText: {
    color: colors.violet,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: fonts.body,
  },
  filterTextActive: {
    color: colors.white,
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
  },
  totalsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  totalsAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.onyx,
    fontFamily: fonts.display,
  },
  totalsRange: {
    marginTop: 6,
    fontSize: 12,
    color: colors.muted,
    fontFamily: fonts.body,
  },
  totalsBadge: {
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: colors.softCoral,
  },
  totalsBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.violet,
    fontFamily: fonts.body,
  },
  paymentCard: {
    width: "100%",
    padding: 18,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.softOnyx,
    ...shadows.lift,
  },
  paymentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 12,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.onyx,
    fontFamily: fonts.display,
  },
  paymentBadge: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: colors.softViolet,
  },
  paymentBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.violet,
    fontFamily: fonts.body,
    width: 150,
  },
  paymentRow: {
    marginBottom: 8,
  },
  paymentLabel: {
    color: colors.muted,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "700",
    fontFamily: fonts.body,
    marginBottom: 2,
  },
  paymentValue: {
    color: colors.onyx,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: fonts.body,
  },
});
