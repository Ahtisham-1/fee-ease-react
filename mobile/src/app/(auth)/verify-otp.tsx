import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBanner } from "@/src/components/common/StatusBanner";
import { useAuth } from "@/src/context/AuthContext";
import { ApiError } from "@/src/services/apiClient";
import { registerApi, verifyOtpApi } from "@/src/services/authApi";
import { COLORS, RADII, SPACING } from "@/src/theme/tokens";
import {
  clearPendingRegistration,
  getPendingRegistration,
} from "@/src/utils/pendingRegistration";

const OTP_COOLDOWN_SECONDS = 60;

function formatOtpError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.message === "Invalid") {
      return "Invalid verification code. Please check the 6-digit code and try again.";
    }
    return error.message;
  }
  return fallback;
}

export default function VerifyOtpScreen() {
  const { login } = useAuth();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const rawEmail = Array.isArray(params.email) ? params.email[0] : params.email;
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

  const [otpCode, setOtpCode] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(OTP_COOLDOWN_SECONDS);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    email ? `A 6-digit verification code was sent to ${email}.` : null,
  );
  const [isBusy, setIsBusy] = useState(false);

  const actionLockRef = useRef(false);
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

  if (!email) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.fallbackContainer}>
          <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.title}>
              Verification Session Missing
            </Text>
            <StatusBanner
              message="Please start registration again to verify your email address."
              variant="warning"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to registration"
              onPress={() => {
                clearPendingRegistration();
                router.replace("/(auth)/register");
              }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Back to Registration</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  async function handleVerify() {
    if (actionLockRef.current || isBusy) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanedCode = otpCode.trim();
    if (!/^\d{6}$/.test(cleanedCode)) {
      setErrorMessage("Please enter the 6-digit numeric verification code.");
      return;
    }

    actionLockRef.current = true;
    setIsBusy(true);
    try {
      await verifyOtpApi(email, cleanedCode);
    } catch (error) {
      actionLockRef.current = false;
      if (mountedRef.current) {
        setErrorMessage(
          formatOtpError(error, "Verification failed. Please try again."),
        );
        setIsBusy(false);
      }
      return;
    }

    // Backend has verified and activated the User row; attempt automatic login from RAM credentials.
    const creds = getPendingRegistration(email);
    try {
      if (creds) {
        await login(creds.email, creds.password);
        return;
      }
    } catch {
      // Account is verified; fall back cleanly to login screen below.
    } finally {
      clearPendingRegistration();
      actionLockRef.current = false;
    }

    if (mountedRef.current) {
      setIsBusy(false);
      router.replace({
        pathname: "/(auth)/login",
        params: { email, notice: "verified" },
      });
    }
  }

  async function handleResend() {
    if (actionLockRef.current || isBusy || cooldownSeconds > 0) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    const creds = getPendingRegistration(email);
    if (!creds) {
      clearPendingRegistration();
      router.replace("/(auth)/register");
      return;
    }

    actionLockRef.current = true;
    setIsBusy(true);
    try {
      await registerApi(creds.email, creds.password);
      if (mountedRef.current) {
        setOtpCode("");
        setCooldownSeconds(OTP_COOLDOWN_SECONDS);
        setSuccessMessage(
          `A new 6-digit verification code was sent to ${email}.`,
        );
      }
    } catch (error) {
      if (mountedRef.current) {
        setErrorMessage(
          formatOtpError(error, "Could not resend the verification code."),
        );
      }
    } finally {
      actionLockRef.current = false;
      if (mountedRef.current) {
        setIsBusy(false);
      }
    }
  }

  function handleEditEmail() {
    if (actionLockRef.current || isBusy) return;
    clearPendingRegistration();
    router.replace("/(auth)/register");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.badge}>EMAIL VERIFICATION</Text>
            <Text accessibilityRole="header" style={styles.title}>
              Verify Your Email
            </Text>
            <Text style={styles.subtitle}>{email}</Text>

            {errorMessage ? (
              <StatusBanner message={errorMessage} variant="error" />
            ) : null}

            {successMessage ? (
              <StatusBanner message={successMessage} variant="success" />
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>6-Digit Verification Code</Text>
              <TextInput
                style={styles.otpInput}
                accessibilityLabel="6-digit email verification code"
                value={otpCode}
                onChangeText={(text) =>
                  setOtpCode(text.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                textContentType="oneTimeCode"
                editable={!isBusy}
                returnKeyType="done"
                onSubmitEditing={() => {
                  void handleVerify();
                }}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Verify email code and enter FeeEase"
              accessibilityState={{ busy: isBusy, disabled: isBusy }}
              disabled={isBusy}
              onPress={() => {
                void handleVerify();
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
                <Text style={styles.primaryButtonText}>
                  Verify & Enter FeeEase
                </Text>
              )}
            </Pressable>

            <Text style={styles.cooldownText}>
              {cooldownSeconds > 0
                ? `You can request another code in ${cooldownSeconds}s.`
                : "You can request a new verification code now."}
            </Text>

            <View style={styles.secondaryRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Resend verification code"
                accessibilityState={{
                  disabled: isBusy || cooldownSeconds > 0,
                }}
                hitSlop={8}
                disabled={isBusy || cooldownSeconds > 0}
                onPress={() => {
                  void handleResend();
                }}
                style={[
                  styles.secondaryButton,
                  (isBusy || cooldownSeconds > 0) && styles.buttonDisabled,
                ]}
              >
                <Text style={styles.secondaryButtonText}>
                  {cooldownSeconds > 0
                    ? `Resend (${cooldownSeconds}s)`
                    : "Resend Code"}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit email address"
                accessibilityState={{ disabled: isBusy }}
                hitSlop={8}
                disabled={isBusy}
                onPress={handleEditEmail}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Edit Email</Text>
              </Pressable>
            </View>
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
  flex: {
    flex: 1,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: "center",
    padding: SPACING.xl,
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
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.emeraldDark,
    textAlign: "center",
  },
  fieldGroup: {
    gap: SPACING.xs + 2,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
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
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  secondaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  },
});
