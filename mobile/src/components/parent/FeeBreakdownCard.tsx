import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { StatusBanner } from "@/src/components/common/StatusBanner";
import { COLORS, RADII, SPACING } from "@/src/theme/tokens";
import type { FeeObligation, Payment, Student } from "@/src/types/index";
import {
  buildStudentLedgerViewModel,
  type ObligationDisplayStatus,
} from "@/src/utils/feeLedgerViewModel";

export interface FeeBreakdownCardProps {
  student: Student;
  obligations: FeeObligation[];
  payments: Payment[];
}

const STATUS_BADGE_STYLES: Record<
  ObligationDisplayStatus,
  { backgroundColor: string; borderColor: string; color: string }
> = {
  cleared: {
    backgroundColor: COLORS.emeraldLight,
    borderColor: COLORS.emeraldBorder,
    color: COLORS.emeraldDeeper,
  },
  partial: {
    backgroundColor: COLORS.amberLight,
    borderColor: COLORS.amberBorder,
    color: COLORS.amberText,
  },
  due: {
    backgroundColor: COLORS.dangerBg,
    borderColor: COLORS.dangerBorder,
    color: COLORS.dangerText,
  },
};

export function FeeBreakdownCard({
  student,
  obligations,
  payments,
}: FeeBreakdownCardProps) {
  const ledger = useMemo(
    () => buildStudentLedgerViewModel(student, obligations, payments),
    [student, obligations, payments],
  );

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.badge}>FEE BREAKDOWN</Text>
        <Text style={styles.studentTag}>
          {student.name} • Class {student.gradeName}
        </Text>
      </View>

      <View style={styles.statsSection}>
        <View style={styles.statsTopRow}>
          <View
            accessible
            accessibilityLabel={`Total Assigned: ${ledger.summary.totalAssignedFormatted}`}
            style={styles.statBox}
          >
            <Text style={styles.statLabel}>TOTAL ASSIGNED</Text>
            <Text style={styles.statValue}>
              {ledger.summary.totalAssignedFormatted}
            </Text>
          </View>

          <View
            accessible
            accessibilityLabel={`Total Paid: ${ledger.summary.totalPaidFormatted}`}
            style={styles.statBox}
          >
            <Text style={styles.statLabel}>TOTAL PAID</Text>
            <Text style={[styles.statValue, styles.statValuePaid]}>
              {ledger.summary.totalPaidFormatted}
            </Text>
          </View>
        </View>

        <View
          accessible
          accessibilityLabel={`Net Balance: ${ledger.summary.netBalanceFormatted}`}
          style={[
            styles.netBalanceBox,
            ledger.summary.netBalance === 0
              ? styles.netBalanceCleared
              : styles.netBalanceDue,
          ]}
        >
          <Text style={styles.netBalanceLabel}>NET BALANCE</Text>
          <Text
            style={[
              styles.netBalanceValue,
              ledger.summary.netBalance === 0
                ? styles.statValuePaid
                : styles.statValueDue,
            ]}
          >
            {ledger.summary.netBalanceFormatted}
          </Text>
        </View>
      </View>

      {ledger.settlementBanner ? (
        <StatusBanner
          message={ledger.settlementBanner.message}
          variant={ledger.settlementBanner.variant}
        />
      ) : null}

      {ledger.rows.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text accessibilityRole="header" style={styles.emptyTitle}>
            No Fee Obligations Yet
          </Text>
          <Text style={styles.emptyText}>
            No fee obligations assigned by your school yet. Pull down to refresh
            or check back later.
          </Text>
        </View>
      ) : (
        <View style={styles.listSection}>
          <Text accessibilityRole="header" style={styles.sectionLabel}>
            MONTHLY LEDGER ({ledger.rows.length})
          </Text>
          <View style={styles.rowsContainer}>
            {ledger.rows.map((row) => {
              const badgePalette = STATUS_BADGE_STYLES[row.status];
              return (
                <View
                  key={row.id}
                  accessible
                  accessibilityLabel={`${row.title}, ${row.feeTypeLabel}, ${row.feeAmountFormatted}, ${row.statusLabel}${row.detailLine ? `, ${row.detailLine}` : ""}`}
                  style={styles.monthRow}
                >
                  <View style={styles.monthMeta}>
                    <Text style={styles.monthTitle}>{row.title}</Text>
                    <Text style={styles.feeTypeText}>{row.feeTypeLabel}</Text>
                    {row.detailLine ? (
                      <Text style={styles.partialSubText}>
                        {row.detailLine}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.monthFinance}>
                    <Text style={styles.monthAmount}>
                      {row.feeAmountFormatted}
                    </Text>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: badgePalette.backgroundColor,
                          borderColor: badgePalette.borderColor,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          { color: badgePalette.color },
                        ]}
                      >
                        {row.statusLabel}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  studentTag: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  statsSection: {
    gap: SPACING.sm,
  },
  statsTopRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  statBox: {
    flexGrow: 1,
    flexBasis: 130,
    backgroundColor: COLORS.inputBg,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  netBalanceBox: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
    borderWidth: 1,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  netBalanceCleared: {
    backgroundColor: COLORS.emeraldLight,
    borderColor: COLORS.emeraldBorder,
  },
  netBalanceDue: {
    backgroundColor: COLORS.amberLight,
    borderColor: COLORS.amberBorder,
  },
  netBalanceLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    letterSpacing: 0.4,
  },
  netBalanceValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  statValuePaid: {
    color: COLORS.emeraldDark,
  },
  statValueDue: {
    color: COLORS.amberText,
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
    lineHeight: 19,
  },
  listSection: {
    gap: SPACING.sm,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  rowsContainer: {
    gap: SPACING.sm,
  },
  monthRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.inputBg,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  monthMeta: {
    flexGrow: 1,
    flexBasis: 160,
    minWidth: 0,
    gap: 2,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  feeTypeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  partialSubText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.amberText,
    marginTop: 2,
  },
  monthFinance: {
    alignItems: "flex-end",
    flexShrink: 1,
    gap: SPACING.xs + 2,
  },
  monthAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: RADII.pill,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
