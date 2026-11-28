import { router } from "expo-router";
import { useState } from "react";
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
import { ApiError } from "@/src/services/apiClient";
import { registerApi } from "@/src/services/authApi";
import { COLORS, RADII, SPACING } from "@/src/theme/tokens";
import {
  clearPendingRegistration,
  setPendingRegistration,
} from "@/src/utils/pendingRegistration";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRegister() {
    if (isSubmitting) return;
    setErrorMessage(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setErrorMessage("Please enter an email address and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await registerApi(normalizedEmail, password);
      // Keep password strictly in RAM (never in URL params) for post-OTP auto-login.
      setPendingRegistration(normalizedEmail, password);
      router.push({
        pathname: "/(auth)/verify-otp",
        params: { email: normalizedEmail },
      });
    } catch (error) {
      clearPendingRegistration();
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          "Could not start registration. Please try again later.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
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
            <Text style={styles.badge}>NEW PARENT ACCOUNT</Text>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              We will email a 6-digit verification code to confirm your account.
            </Text>

            {errorMessage ? (
              <StatusBanner message={errorMessage} variant="error" />
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="parent@example.com"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                editable={!isSubmitting}
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  editable={!isSubmitting}
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    void handleRegister();
                  }}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    showPassword ? "Hide password" : "Show password"
                  }
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.toggleBtn}
                >
                  <Text style={styles.toggleText}>
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={() => {
                void handleRegister();
              }}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
                isSubmitting && styles.buttonDisabled,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  Register & Send Code
                </Text>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={() => {
                clearPendingRegistration();
                router.replace("/(auth)/login");
              }}
              style={styles.switchLink}
            >
              <Text style={styles.switchLinkText}>
                Already have an account?{" "}
                <Text style={styles.switchLinkAccent}>Sign In</Text>
              </Text>
            </Pressable>
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
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.xs,
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
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    backgroundColor: COLORS.inputBg,
    borderColor: COLORS.inputBorder,
    borderWidth: 1,
    borderRadius: RADII.sm,
  },
  passwordInput: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: SPACING.md,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  toggleBtn: {
    minHeight: 44,
    paddingHorizontal: SPACING.md,
    justifyContent: "center",
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.emeraldDark,
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
    opacity: 0.65,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
  switchLink: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  switchLinkText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  switchLinkAccent: {
    color: COLORS.emeraldDark,
    fontWeight: "700",
  },
});
