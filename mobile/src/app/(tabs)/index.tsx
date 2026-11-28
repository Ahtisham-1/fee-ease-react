import { router } from "expo-router";
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
import { useSchoolData } from "@/src/context/SchoolDataContext";
import { COLORS, RADII, SPACING } from "@/src/theme/tokens";

export default function HomeScreen() {
  const { students, fees, isLoading, isRefreshing, error, refreshData } =
    useSchoolData();

  if (isLoading) {
    return (
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.emeraldPrimary} />
          <Text style={styles.loadingText}>Loading your school records...</Text>
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
            <Text style={styles.badge}>PARENT PORTAL</Text>
            <Text style={styles.title}>No Children Linked to This Account</Text>
            <Text style={styles.subtitle}>
              Verify the mobile number registered with your school office to
              connect your account to your enrolled children.
            </Text>
            <Pressable
              accessibilityRole="button"
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

        {students.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.badge}>SCHOOL LINKED</Text>
            <Text style={styles.title}>My Enrolled Children</Text>
            <Text style={styles.subtitle}>
              {students.length}{" "}
              {students.length === 1 ? "child linked" : "children linked"} •{" "}
              {fees.length} {fees.length === 1 ? "fee record" : "fee records"}{" "}
              loaded in memory.
            </Text>
            <View style={styles.childList}>
              {students.map((child) => (
                <View key={child.id} style={styles.childRow}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <Text style={styles.childGrade}>Class {child.gradeName}</Text>
                </View>
              ))}
            </View>
            <StatusBanner
              message="Parent account connected cleanly. Full student selector and FIFO fee ledger will be wired in Feature 6."
              variant="success"
            />
          </View>
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
    padding: SPACING.xl,
    gap: SPACING.md,
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
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
  },
  title: {
    fontSize: 21,
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
  buttonDisabled: {
    opacity: 0.55,
  },
  retryButtonText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  childList: {
    gap: SPACING.sm,
  },
  childRow: {
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
  childName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  childGrade: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.emeraldDark,
  },
});
