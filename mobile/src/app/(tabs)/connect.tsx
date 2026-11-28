import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { useSchoolData } from "@/src/context/SchoolDataContext";
import { sendPhoneOtpApi, verifyPhoneOtpApi } from "@/src/services/authApi";
import { COLORS, RADII, SPACING } from "@/src/theme/tokens";
import {
  formatPhoneOtpError,
  isActiveOtpConflictError,
  PHONE_OTP_COOLDOWN_SECONDS,
  sanitizeOtpCodeInput,
  sanitizePhoneInput,
} from "@/src/utils/phoneOtpHelpers";
import { normalizeIndianPhone } from "@/src/utils/validation";

export default function ConnectSchoolScreen() {
  const {
    students,
    isLoading,
    isRefreshing,
    error: schoolLoadError,
    refreshData,
  } = useSchoolData();

  const [phoneInput, setPhoneInput] = useState("");
  const [submittedPhone, setSubmittedPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const busyRef = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  function clearBanners() {
    setErrorMessage(null);
    setWarningMessage(null);
    setStatusMessage(null);
  }

  function handleChangePhone() {
    if (busyRef.current || isBusy) return;
    setOtpSent(false);
    setSubmittedPhone("");
    setOtpCode("");
    setCooldownSeconds(0);
    clearBanners();
  }

  async function handleSendOtp(targetPhoneRaw: string) {
    if (busyRef.current || isBusy) return;
    clearBanners();

    let normalizedPhone: string;
    try {
      normalizedPhone = normalizeIndianPhone(targetPhoneRaw);
    } catch (error) {
      setErrorMessage(
        formatPhoneOtpError(
          error,
          "Valid 10-digit Indian mobile number is required.",
        ),
      );
      return;
    }

    busyRef.current = true;
    setIsBusy(true);
    try {
      const response = await sendPhoneOtpApi(normalizedPhone);
      if (!mountedRef.current) return;

      setSubmittedPhone(normalizedPhone);
      setOtpSent(true);
      setOtpCode("");
      setCooldownSeconds(PHONE_OTP_COOLDOWN_SECONDS);
      setStatusMessage(response.message);
    } catch (error) {
      if (!mountedRef.current) return;

      if (isActiveOtpConflictError(error)) {
        setSubmittedPhone(normalizedPhone);
        setOtpSent(true);
        setCooldownSeconds(PHONE_OTP_COOLDOWN_SECONDS);
        setWarningMessage(
          "An active verification code was already sent to this number. Enter that 6-digit code below or wait up to 5 minutes for a new one.",
        );
      } else {
        setErrorMessage(
          formatPhoneOtpError(
            error,
            "Could not send verification code. Please try again.",
          ),
        );
      }
    } finally {
      busyRef.current = false;
      if (mountedRef.current) {
        setIsBusy(false);
      }
    }
  }

  async function handleVerifyOtp() {
    if (busyRef.current || isBusy) return;
    clearBanners();

    const cleanedCode = otpCode.trim();
    if (!/^\d{6}$/.test(cleanedCode)) {
      setErrorMessage("Please enter the 6-digit SMS verification code.");
      return;
    }

    busyRef.current = true;
    setIsBusy(true);
    try {
      await verifyPhoneOtpApi(submittedPhone, cleanedCode);
    } catch (error) {
      busyRef.current = false;
      if (mountedRef.current) {
        setErrorMessage(
          formatPhoneOtpError(
            error,
            "Could not verify the phone number. Please try again.",
          ),
        );
        setIsBusy(false);
      }
      return;
    }

    // Reload parent records in-memory using the same JWT (DB row now holds parent_id & school_id).
    const refreshed = await refreshData();
    busyRef.current = false;
    if (!mountedRef.current) return;

    setIsBusy(false);
    setOtpSent(false);
    setOtpCode("");
    setSubmittedPhone("");
    setCooldownSeconds(0);
    if (!refreshed) {
      setStatusMessage(
        "School account linked! Tap Retry below to load your children.",
      );
      return;
    }
    router.replace("/(tabs)");
  }

  if (isLoading) {
    return (
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.emeraldPrimary} />
          <Text style={styles.loadingText}>Checking school link status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (schoolLoadError && students.length === 0) {
    return (
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safeArea}>
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
          <View style={styles.card}>
            <Text style={styles.badge}>CONNECTION ERROR</Text>
            <Text accessibilityRole="header" style={styles.title}>
              Could Not Check Link Status
            </Text>
            {statusMessage ? (
              <StatusBanner message={statusMessage} variant="success" />
            ) : null}
            <StatusBanner message={schoolLoadError} variant="error" />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retry checking school link status"
              accessibilityState={{ busy: isRefreshing, disabled: isRefreshing }}
              disabled={isRefreshing}
              onPress={() => {
                void refreshData();
              }}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
                isRefreshing && styles.buttonDisabled,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {isRefreshing ? "Retrying..." : "Retry"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (students.length > 0) {
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
          <View style={styles.card}>
            <Text style={styles.badge}>SCHOOL CONNECTED</Text>
            <Text accessibilityRole="header" style={styles.title}>
              Account Already Linked
            </Text>
            <StatusBanner
              message={`Your parent account is connected to ${students.length} enrolled ${
                students.length === 1 ? "child" : "children"
              }.`}
              variant="success"
            />
            <View style={styles.linkedList}>
              {students.map((child) => (
                <View key={child.id} style={styles.linkedRow}>
                  <Text style={styles.linkedName}>{child.name}</Text>
                  <Text style={styles.linkedGrade}>
                    Class {child.gradeName}
                  </Text>
                </View>
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go to Home tab"
              onPress={() => router.navigate("/(tabs)")}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>Go to Home</Text>
            </Pressable>
          </View>
        </ScrollView>
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
        >
          <View style={styles.card}>
            <Text style={styles.badge}>CONNECT TO SCHOOL</Text>
            <Text accessibilityRole="header" style={styles.title}>
              Verify Your Phone Number
            </Text>
            <Text style={styles.subtitle}>
              Enter the Indian mobile number (+91) registered with your school
              office to link your children.
            </Text>

            {errorMessage ? (
              <StatusBanner message={errorMessage} variant="error" />
            ) : null}

            {warningMessage ? (
              <StatusBanner message={warningMessage} variant="warning" />
            ) : null}

            {statusMessage ? (
              <StatusBanner message={statusMessage} variant="success" />
            ) : null}

            {!otpSent ? (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Registered Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    accessibilityLabel="School-registered mobile number"
                    value={phoneInput}
                    onChangeText={(text) =>
                      setPhoneInput(sanitizePhoneInput(text))
                    }
                    placeholder="e.g. 9876543210 or +919876543210"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="phone-pad"
                    textContentType="telephoneNumber"
                    autoComplete="tel"
                    editable={!isBusy}
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      void handleSendOtp(phoneInput);
                    }}
                  />
                  <Text style={styles.helperText}>
                    Supports 10-digit numbers or +91XXXXXXXXXX format.
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Send SMS verification code"
                  accessibilityState={{ busy: isBusy, disabled: isBusy }}
                  disabled={isBusy}
                  onPress={() => {
                    void handleSendOtp(phoneInput);
                  }}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.primaryButtonPressed,
                    isBusy && styles.buttonDisabled,
                  ]}
                >
                  {isBusy ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Send OTP</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.phoneChip}>
                  <Text style={styles.phoneChipLabel}>PHONE NUMBER</Text>
                  <Text style={styles.phoneChipValue}>{submittedPhone}</Text>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>6-Digit SMS OTP</Text>
                  <TextInput
                    style={styles.otpInput}
                    accessibilityLabel="6-digit SMS verification code"
                    value={otpCode}
                    onChangeText={(text) =>
                      setOtpCode(sanitizeOtpCodeInput(text))
                    }
                    placeholder="123456"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="number-pad"
                    maxLength={6}
                    textContentType="oneTimeCode"
                    editable={!isBusy}
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      void handleVerifyOtp();
                    }}
                  />
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Verify SMS verification code"
                  accessibilityState={{ busy: isBusy, disabled: isBusy }}
                  disabled={isBusy}
                  onPress={() => {
                    void handleVerifyOtp();
                  }}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.primaryButtonPressed,
                    isBusy && styles.buttonDisabled,
                  ]}
                >
                  {isBusy ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Verify OTP</Text>
                  )}
                </Pressable>

                <Text style={styles.cooldownText}>
                  {cooldownSeconds > 0
                    ? `Resend cooldown: ${cooldownSeconds}s (active code expires in 5 min).`
                    : "Active codes expire after 5 minutes if unused."}
                </Text>

                <View style={styles.secondaryRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Resend SMS verification code"
                    accessibilityState={{
                      disabled: isBusy || cooldownSeconds > 0,
                    }}
                    hitSlop={8}
                    disabled={isBusy || cooldownSeconds > 0}
                    onPress={() => {
                      void handleSendOtp(submittedPhone);
                    }}
                    style={[
                      styles.secondaryButton,
                      (isBusy || cooldownSeconds > 0) && styles.buttonDisabled,
                    ]}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {cooldownSeconds > 0
                        ? `Resend (${cooldownSeconds}s)`
                        : "Resend OTP"}
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Change phone number"
                    accessibilityState={{ disabled: isBusy }}
                    hitSlop={8}
                    disabled={isBusy}
                    onPress={handleChangePhone}
                    style={styles.secondaryButton}
                  >
                    <Text style={styles.secondaryButtonText}>
                      Change phone number
                    </Text>
                  </Pressable>
                </View>
              </>
            )}

            {__DEV__ ? (
              <Text style={styles.devHint}>
                Dev note: With SMS_PROVIDER=console, read the 6-digit OTP from
                your FastAPI server terminal.
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADII.lg,
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  badge: {
    alignSelf: "center",
    backgroundColor: COLORS.emeraldLight,
    color: COLORS.emeraldDark,
    borderColor: COLORS.emeraldBorder,
    borderWidth: 1,
    borderRadius: RADII.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  fieldGroup: {
    gap: SPACING.xs + 2,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  input: {
    minHeight: 48,
    backgroundColor: COLORS.inputBg,
    borderColor: COLORS.inputBorder,
    borderWidth: 1,
    borderRadius: RADII.sm,
    paddingHorizontal: SPACING.md,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  phoneChip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADII.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
  phoneChipLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  phoneChipValue: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  otpInput: {
    minHeight: 54,
    backgroundColor: COLORS.inputBg,
    borderColor: COLORS.inputBorder,
    borderWidth: 1,
    borderRadius: RADII.sm,
    paddingHorizontal: SPACING.md,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 6,
    textAlign: "center",
    color: COLORS.textPrimary,
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
  cooldownText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  secondaryRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.sm,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  linkedList: {
    gap: SPACING.sm,
  },
  linkedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADII.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
  linkedName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  linkedGrade: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.emeraldDark,
  },
  devHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 16,
    marginTop: SPACING.xs,
  },
});
