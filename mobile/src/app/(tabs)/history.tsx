import { router } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBanner } from "@/src/components/common/StatusBanner";
import { StudentSelectorCard } from "@/src/components/parent/StudentSelectorCard";
import { useSchoolData } from "@/src/context/SchoolDataContext";
import { COLORS, RADII, SPACING } from "@/src/theme/tokens";
import { resolveActiveStudent } from "@/src/utils/feeLedgerViewModel";
import { buildReceiptListViewModel } from "@/src/utils/paymentHelpers";

export default function ReceiptHistoryScreen() {
  const {
    students,
    payments,
    selectedStudentId,
    setSelectedStudentId,
    isLoading,
    isRefreshing,
    error,
    refreshData,
  } = useSchoolData();

  const activeStudent = resolveActiveStudent(students, selectedStudentId);

  const receipts = useMemo(
    () =>
      activeStudent
        ? buildReceiptListViewModel(payments, activeStudent.id)
        : [],
    [payments, activeStudent],
  );

  if (isLoading) {
    return (
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.emeraldPrimary} />
          <Text style={styles.loadingText}>Loading receipt history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              void refreshData();
            }}
            tintColor={COLORS.emeraldPrimary}
            colors={[COLORS.emeraldPrimary]}
          />
        }
      >
        {error ? (
          <View style={styles.card}>
            <StatusBanner message={error} variant="error" />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retry loading payment history"
              accessibilityState={{ busy: isRefreshing, disabled: isRefreshing }}
              disabled={isRefreshing}
              onPress={() => {
                void refreshData();
              }}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.retryButtonPressed,
                isRefreshing && styles.buttonDisabled,
              ]}
            >
              <Text style={styles.retryButtonText}>
                {isRefreshing ? "Retrying..." : "Retry"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {!error && students.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.badge}>RECEIPT HISTORY</Text>
            <Text accessibilityRole="header" style={styles.title}>
              No Children Linked
            </Text>
            <Text style={styles.subtitle}>
              Connect to your school first to view payment receipts.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Connect to your school"
              onPress={() => router.navigate("/(tabs)/connect")}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                Connect to Your School
              </Text>
            </Pressable>
          </View>
        ) : null}

        {activeStudent ? (
          <>
            <StudentSelectorCard
              students={students}
              selectedStudentId={activeStudent.id}
              onSelectStudent={setSelectedStudentId}
              onConnectToSchool={() => router.navigate("/(tabs)/connect")}
            />

            <View style={styles.card}>
              <View style={styles.headerRow}>
                <Text style={styles.badge}>PAYMENT RECEIPTS</Text>
                <Text style={styles.countTag}>
                  {receipts.length}{" "}
                  {receipts.length === 1 ? "receipt" : "receipts"}
                </Text>
              </View>

              {receipts.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text accessibilityRole="header" style={styles.emptyTitle}>
                    No Receipts Yet
                  </Text>
                  <Text style={styles.emptyText}>
                    No payment receipts yet for this student.
                  </Text>
                </View>
              ) : (
                <View style={styles.list}>
                  {receipts.map((receipt) => (
                    <View
                      key={receipt.id}
                      accessible
                      accessibilityLabel={`Receipt ${receipt.id}, ${receipt.amountFormatted}, ${receipt.statusLabel}, ${receipt.timestampFormatted}${receipt.failureNote ? `, ${receipt.failureNote}` : ""}`}
                      style={[
                        styles.receiptCard,
                        receipt.isSuccess
                          ? styles.receiptSuccessBorder
                          : styles.receiptFailedBorder,
                      ]}
                    >
                      <View style={styles.receiptMeta}>
                        <Text style={styles.receiptId}>
                          Receipt #{receipt.id}
                        </Text>
                        <Text style={styles.timestampText}>
                          {receipt.timestampFormatted}
                        </Text>
                        {receipt.failureNote ? (
                          <Text style={styles.failureNote}>
                            {receipt.failureNote}
                          </Text>
                        ) : null}
                      </View>

                      <View style={styles.receiptFinance}>
                        <Text
                          style={[
                            styles.receiptAmount,
                            receipt.isSuccess
                              ? styles.amountSuccess
                              : styles.amountFailed,
                          ]}
                        >
                          {receipt.amountFormatted}
                        </Text>
                        <View
                          style={[
                            styles.statusPill,
                            receipt.isSuccess
                              ? styles.pillSuccess
                              : styles.pillFailed,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusPillText,
                              receipt.isSuccess
                                ? styles.pillTextSuccess
                                : styles.pillTextFailed,
                            ]}
                          >
                            {receipt.statusLabel}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  headerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.emeraldLight,
    color: COLORS.emeraldDark,
    borderColor: COLORS.emeraldBorder,
    borderWidth: 1,
    borderRadius: RADII.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
  },
  countTag: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: RADII.md,
    backgroundColor: COLORS.emeraldPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.xs,
  },
  primaryButtonPressed: {
    backgroundColor: COLORS.emeraldDark,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
  retryButton: {
    minHeight: 44,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonPressed: {
    backgroundColor: COLORS.border,
  },
  retryButtonText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  emptyBox: {
    backgroundColor: COLORS.inputBg,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADII.md,
    padding: SPACING.lg,
    alignItems: "center",
    gap: SPACING.xs + 2,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  list: {
    gap: SPACING.sm,
  },
  receiptCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: SPACING.sm,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  receiptSuccessBorder: {
    backgroundColor: COLORS.cardBg,
    borderLeftColor: COLORS.emeraldPrimary,
  },
  receiptFailedBorder: {
    backgroundColor: COLORS.dangerBg,
    borderLeftColor: COLORS.dangerText,
  },
  receiptMeta: {
    flexGrow: 1,
    flexBasis: 160,
    minWidth: 0,
    gap: 3,
  },
  receiptId: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  timestampText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  failureNote: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.dangerText,
    marginTop: 2,
  },
  receiptFinance: {
    alignItems: "flex-end",
    flexShrink: 1,
    gap: SPACING.xs + 2,
  },
  receiptAmount: {
    fontSize: 16,
    fontWeight: "800",
  },
  amountSuccess: {
    color: COLORS.emeraldDark,
  },
  amountFailed: {
    color: COLORS.dangerText,
    textDecorationLine: "line-through",
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: RADII.pill,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 3,
  },
  pillSuccess: {
    backgroundColor: COLORS.emeraldLight,
    borderColor: COLORS.emeraldBorder,
  },
  pillFailed: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.dangerBorder,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  pillTextSuccess: {
    color: COLORS.emeraldDeeper,
  },
  pillTextFailed: {
    color: COLORS.dangerText,
  },
});
