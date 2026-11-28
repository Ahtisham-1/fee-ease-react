import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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
import { COLORS, RADII, SPACING } from "@/src/theme/tokens";

export default function LoginScreen() {
  const { login, sessionNotice, clearSessionNotice } = useAuth();
  const params = useLocalSearchParams<{ email?: string; notice?: string }>();

  const initialEmail =
    typeof params.email === "string" ? params.email.trim() : "";
  const verifiedSuccess =
    params.notice === "verified"
      ? "Email verified! Please sign in to continue."
      : null;

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  async function handleLogin() {
    if (isSubmitting) return;
    setErrorMessage(null);
    clearSessionNotice();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(trimmedEmail, password);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Unable to sign in right now. Please try again.");
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
            <Text style={styles.badge}>PARENT PORTAL</Text>
            <Text style={styles.title}>FeeEase Login</Text>
            <Text style={styles.subtitle}>
              Sign in with your parent account to view fees and receipts.
            </Text>

            {sessionNotice ? (
              <StatusBanner message={sessionNotice} variant="warning" />
            ) : null}

            {!sessionNotice && verifiedSuccess && !errorMessage ? (
              <StatusBanner message={verifiedSuccess} variant="success" />
            ) : null}

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
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  textContentType="password"
                  editable={!isSubmitting}
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    void handleLogin();
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
                void handleLogin();
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
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={() => {
                clearSessionNotice();
                router.push("/(auth)/register");
              }}
              style={styles.switchLink}
            >
              <Text style={styles.switchLinkText}>
                Need an account? <Text style={styles.switchLinkAccent}>Register</Text>
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
