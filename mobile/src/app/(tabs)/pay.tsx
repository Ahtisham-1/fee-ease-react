import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBanner } from "@/src/components/common/StatusBanner";
import { StudentSelectorCard } from "@/src/components/parent/StudentSelectorCard";
import { useSchoolData } from "@/src/context/SchoolDataContext";
import { COLORS, RADII, SPACING } from "@/src/theme/tokens";
import { getStudentFinancialSummary } from "@/src/utils/feeCalculator";
import { resolveActiveStudent } from "@/src/utils/feeLedgerViewModel";
import { formatRupees } from "@/src/utils/format";
import { validatePaymentInput } from "@/src/utils/paymentHelpers";

export default function PayFeesScreen() {
  const {
    students,
    fees,
    payments,
    selectedStudentId,
    setSelectedStudentId,
    isLoading,
    isRefreshing,
    isProcessingPayment,
    error,
    refreshData,
    processPayment,
  } = useSchoolData();

  const [amountInput, setAmountInput] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [lastPaidAmount, setLastPaidAmount] = useState<number | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{
    amount: number;
  } | null>(null);

  const submitLockRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const activeStudent = resolveActiveStudent(students, selectedStudentId);
  const activeStudentId = activeStudent?.id ?? "";

  useEffect(() => {
    setAmountInput("");
    setValidationError(null);
    setSubmissionError(null);
    setLastPaidAmount(null);
    setPendingConfirm(null);
  }, [activeStudentId]);

  const financialSummary = useMemo(() => {
    if (!activeStudent) {
      return { totalFees: 0, totalAssigned: 0, totalPaid: 0, netBalance: 0 };
    }
    return getStudentFinancialSummary(activeStudent.id, fees, payments);
  }, [activeStudent, fees, payments]);

  const netBalance = financialSummary.netBalance;

  useEffect(() => {
    if (
      !isProcessingPayment &&
      !submitLockRef.current &&
      pendingConfirm &&
      pendingConfirm.amount > netBalance
    ) {
      setPendingConfirm(null);
      setAmountInput("");
      setSubmissionError(null);
      setValidationError(
        "Your pending fee balance changed. Please review the updated balance before paying.",
      );
    }
  }, [isProcessingPayment, netBalance, pendingConfirm]);

  const parsedPreview = useMemo(
    () => validatePaymentInput(amountInput, netBalance),
    [amountInput, netBalance],
  );

  const isBusy = isProcessingPayment || submitLockRef.current;
  const formDisabled = isBusy || Boolean(error);
  const modalRemainingAfter = pendingConfirm
    ? Math.max(0, netBalance - pendingConfirm.amount)
    : 0;
  const paymentBannerMessage =
    lastPaidAmount === null
      ? null
      : error
        ? `Payment of ${formatRupees(lastPaidAmount)} was submitted, but your balance could not refresh. Tap Retry above before paying again.`
        : `Payment of ${formatRupees(lastPaidAmount)} completed! Ledger and receipts are updated.`;

  function handleInitiatePayment() {
    if (formDisabled) return;
    setValidationError(null);
    setSubmissionError(null);
    setLastPaidAmount(null);

    const checked = validatePaymentInput(amountInput, netBalance);
    if (!checked.valid) {
      setValidationError(checked.message);
      return;
    }

    setPendingConfirm({
      amount: checked.amount,
    });
  }

  function handleCloseModal() {
    if (submitLockRef.current || isProcessingPayment) {
      return;
    }
    setPendingConfirm(null);
    setSubmissionError(null);
  }

  async function handleConfirmPayment() {
    if (submitLockRef.current || isProcessingPayment || !pendingConfirm) return;

    const amountToPay = pendingConfirm.amount;
    submitLockRef.current = true;
    setSubmissionError(null);

    try {
      await processPayment(amountToPay);
      if (!mountedRef.current) return;

      setAmountInput("");
      setPendingConfirm(null);
      setLastPaidAmount(amountToPay);
    } catch (err) {
      if (!mountedRef.current) return;
      const msg =
        err instanceof Error && err.message.trim()
          ? err.message
          : "The payment could not be completed. Please try again.";
      // Partial failures already modified server truth and synced netBalance; close modal so user cannot retry stale chunks.
      if (/Partial payment applied/i.test(msg)) {
        setPendingConfirm(null);
        setAmountInput("");
        setSubmissionError(null);
        setValidationError(msg);
      } else {
        setSubmissionError(msg);
      }
    } finally {
      submitLockRef.current = false;
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.emeraldPrimary} />
          <Text style={styles.loadingText}>Loading fee balance...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
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
                accessibilityLabel="Retry loading fee balance"
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
              <Text style={styles.badge}>PAY FEES</Text>
              <Text accessibilityRole="header" style={styles.title}>
                No Children Linked
              </Text>
              <Text style={styles.subtitle}>
                Connect to your school first to view and pay student fees.
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

              {netBalance === 0 ? (
                <View style={styles.card}>
                  <Text style={styles.badge}>ALL FEES SETTLED</Text>
                  {paymentBannerMessage ? (
                    <StatusBanner
                      message={paymentBannerMessage}
                      variant={error ? "warning" : "success"}
                    />
                  ) : null}
                  <StatusBanner
                    message={`All fees for ${activeStudent.name} are fully settled!`}
                    variant="success"
                  />
                  {financialSummary.totalAssigned === 0 ? (
                    <Text style={styles.settledNote}>
                      No fee obligations have been assigned yet.
                    </Text>
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.navigate("/(tabs)/history")}
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed && styles.secondaryButtonPressed,
                    ]}
                  >
                    <Text style={styles.secondaryButtonText}>
                      View Receipt History
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.badge}>SUBMIT FEE PAYMENT</Text>
                    <Text style={styles.dueTag}>
                      Pending: {formatRupees(netBalance)}
                    </Text>
                  </View>

                  {paymentBannerMessage ? (
                    <StatusBanner
                      message={paymentBannerMessage}
                      variant={error ? "warning" : "success"}
                    />
                  ) : null}

                  {validationError ? (
                    <StatusBanner message={validationError} variant="error" />
                  ) : null}

                  <View style={styles.fieldGroup}>
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>Payment Amount (₹)</Text>
                      <Pressable
                        accessibilityRole="button"
                        hitSlop={8}
                        disabled={formDisabled}
                        onPress={() => {
                          setAmountInput(String(netBalance));
                          setValidationError(null);
                          setLastPaidAmount(null);
                        }}
                        style={styles.quickFillBtn}
                      >
                        <Text style={styles.quickFillText}>
                          Pay Full ({formatRupees(netBalance)})
                        </Text>
                      </Pressable>
                    </View>

                    <View style={styles.amountInputRow}>
                      <Text style={styles.currencyPrefix}>₹</Text>
                      <TextInput
                        style={styles.amountInput}
                        accessibilityLabel="Payment amount in rupees"
                        value={amountInput}
                        onChangeText={(text) => {
                          // Preserve '.' so pasted decimals are caught explicitly instead of multiplying 100x.
                          setAmountInput(text.replace(/[^\d.,]/g, ""));
                          if (validationError) setValidationError(null);
                          if (lastPaidAmount !== null) setLastPaidAmount(null);
                        }}
                        placeholder="Enter whole rupee amount"
                        placeholderTextColor={COLORS.textMuted}
                        keyboardType="numeric"
                        editable={!formDisabled}
                        returnKeyType="done"
                        onSubmitEditing={handleInitiatePayment}
                      />
                    </View>
                  </View>

                  {parsedPreview.valid ? (
                    <View style={styles.previewBox}>
                      <Text style={styles.previewLabel}>
                        Remaining Dues After Payment:
                      </Text>
                      <Text
                        style={[
                          styles.previewValue,
                          netBalance - parsedPreview.amount === 0
                            ? styles.previewCleared
                            : styles.previewPending,
                        ]}
                      >
                        {formatRupees(netBalance - parsedPreview.amount)}
                        {netBalance - parsedPreview.amount === 0
                          ? " (Fully Cleared)"
                          : ""}
                      </Text>
                    </View>
                  ) : null}

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      parsedPreview.valid
                        ? `Proceed to pay ${formatRupees(parsedPreview.amount)}`
                        : "Proceed to pay"
                    }
                    accessibilityState={{
                      disabled: formDisabled || !amountInput.trim(),
                    }}
                    disabled={formDisabled || !amountInput.trim()}
                    onPress={handleInitiatePayment}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      pressed && styles.primaryButtonPressed,
                      (formDisabled || !amountInput.trim()) && styles.buttonDisabled,
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>
                      {parsedPreview.valid
                        ? `Proceed to Pay ${formatRupees(parsedPreview.amount)}`
                        : "Proceed to Pay"}
                    </Text>
                  </Pressable>
                </View>
              )}
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={pendingConfirm !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView bounces={false} contentContainerStyle={styles.modalScrollContent}>
              <Text accessibilityRole="header" style={styles.modalTitle}>
                Confirm Fee Payment
              </Text>
              <Text style={styles.modalSubtitle}>
                You are authorizing a school fee payment for:
              </Text>

              {activeStudent && pendingConfirm ? (
                <View style={styles.confirmBox}>
                  <Text style={styles.confirmStudent}>
                    {activeStudent.name} • Class {activeStudent.gradeName}
                  </Text>
                  <Text style={styles.confirmAmount}>
                    {formatRupees(pendingConfirm.amount)}
                  </Text>
                  <Text style={styles.confirmRemaining}>
                    {modalRemainingAfter === 0
                      ? "Clears all pending monthly obligations!"
                      : `Remaining balance after payment: ${formatRupees(modalRemainingAfter)}`}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.fifoNote}>
                Oldest pending months are automatically settled first (FIFO).
              </Text>

              {submissionError ? (
                <StatusBanner message={submissionError} variant="error" />
              ) : null}

              <View style={styles.modalActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cancel fee payment"
                  accessibilityState={{ disabled: isProcessingPayment }}
                  disabled={isProcessingPayment}
                  onPress={handleCloseModal}
                  style={[
                    styles.modalCancelBtn,
                    isProcessingPayment && styles.buttonDisabled,
                  ]}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    pendingConfirm
                      ? `Confirm and pay ${formatRupees(pendingConfirm.amount)}`
                      : "Confirm and pay"
                  }
                  accessibilityState={{
                    busy: isProcessingPayment,
                    disabled: isProcessingPayment,
                  }}
                  disabled={isProcessingPayment}
                  onPress={() => {
                    void handleConfirmPayment();
                  }}
                  style={({ pressed }) => [
                    styles.modalConfirmBtn,
                    pressed && styles.primaryButtonPressed,
                    isProcessingPayment && styles.buttonDisabled,
                  ]}
                >
                  {isProcessingPayment ? (
                    <View style={styles.processingRow}>
                      <ActivityIndicator size="small" color={COLORS.white} />
                      <Text style={styles.modalConfirmText}>Processing…</Text>
                    </View>
                  ) : (
                    <Text style={styles.modalConfirmText}>Proceed & Pay</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  flex: {
    flex: 1,
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
  cardHeader: {
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
  dueTag: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.amberText,
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
  fieldGroup: {
    gap: SPACING.xs + 2,
  },
  labelRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  quickFillBtn: {
    backgroundColor: COLORS.emeraldLight,
    borderColor: COLORS.emeraldBorder,
    borderWidth: 1,
    borderRadius: RADII.pill,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
  },
  quickFillText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.emeraldDark,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 50,
    backgroundColor: COLORS.inputBg,
    borderColor: COLORS.inputBorder,
    borderWidth: 1,
    borderRadius: RADII.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textSecondary,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    paddingVertical: SPACING.sm,
  },
  previewBox: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.xs,
    backgroundColor: COLORS.emeraldLight,
    borderColor: COLORS.emeraldBorder,
    borderWidth: 1,
    borderRadius: RADII.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  previewValue: {
    fontSize: 14,
    fontWeight: "800",
  },
  previewCleared: {
    color: COLORS.emeraldDeeper,
  },
  previewPending: {
    color: COLORS.amberText,
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
  secondaryButton: {
    minHeight: 44,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonPressed: {
    backgroundColor: COLORS.border,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  modalCard: {
    maxHeight: "90%",
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADII.lg,
    padding: SPACING.xl,
  },
  modalScrollContent: {
    gap: SPACING.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  confirmBox: {
    backgroundColor: COLORS.inputBg,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADII.md,
    padding: SPACING.md,
    alignItems: "center",
    gap: SPACING.xs,
  },
  confirmStudent: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  confirmAmount: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  confirmRemaining: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.emeraldDark,
    textAlign: "center",
  },
  fifoNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  modalCancelBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  modalConfirmBtn: {
    flex: 1.3,
    minHeight: 46,
    borderRadius: RADII.md,
    backgroundColor: COLORS.emeraldPrimary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.md,
  },
  processingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
  },
  settledNote: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
