import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/src/context/AuthContext";
import { COLORS, RADII, SPACING } from "@/src/theme/tokens";
import { StatusBanner } from "./StatusBanner";

export function AdminNoticeScreen() {
  const { userEmail, logout } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSignOut() {
    if (isSigningOut) return;
    setErrorMessage(null);
    setIsSigningOut(true);
    try {
      await logout();
    } catch {
      setErrorMessage("Could not complete sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.badge}>SCHOOL ADMIN ACCOUNT</Text>
          <Text style={styles.title}>Use the Desktop Web Portal</Text>
          {userEmail ? <Text style={styles.email}>{userEmail}</Text> : null}
          <Text style={styles.body}>
            This mobile app is for Parents only. Please use the FeeEase web
            portal on a desktop browser for Admin tasks.
          </Text>

          {errorMessage ? (
            <View style={styles.bannerWrap}>
              <StatusBanner message={errorMessage} variant="error" />
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={isSigningOut}
            onPress={() => {
              void handleSignOut();
            }}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              isSigningOut && styles.buttonDisabled,
            ]}
          >
            {isSigningOut ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Sign Out</Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADII.lg,
    padding: SPACING.xl,
    alignItems: "center",
    gap: SPACING.md,
  },
  badge: {
    backgroundColor: COLORS.amberLight,
    color: COLORS.amberText,
    borderColor: COLORS.amberBorder,
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
  email: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.emeraldDark,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  bannerWrap: {
    width: "100%",
  },
  button: {
    width: "100%",
    minHeight: 48,
    borderRadius: RADII.md,
    backgroundColor: COLORS.emeraldPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.xs,
  },
  buttonPressed: {
    backgroundColor: COLORS.emeraldDark,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
