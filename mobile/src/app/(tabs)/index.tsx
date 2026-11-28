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
import { FeeBreakdownCard } from "@/src/components/parent/FeeBreakdownCard";
import { StudentSelectorCard } from "@/src/components/parent/StudentSelectorCard";
import { useSchoolData } from "@/src/context/SchoolDataContext";
import { COLORS, RADII, SPACING } from "@/src/theme/tokens";
import { resolveActiveStudent } from "@/src/utils/feeLedgerViewModel";

export default function HomeScreen() {
  const {
    students,
    fees,
    payments,
    selectedStudentId,
    setSelectedStudentId,
    isLoading,
    isRefreshing,
    error,
    refreshData,
  } = useSchoolData();

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

  const activeStudent = resolveActiveStudent(students, selectedStudentId);

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
          <StudentSelectorCard
            students={[]}
            selectedStudentId=""
            onSelectStudent={setSelectedStudentId}
            onConnectToSchool={() => router.navigate("/(tabs)/connect")}
          />
        ) : null}

        {activeStudent ? (
          <>
            <StudentSelectorCard
              students={students}
              selectedStudentId={activeStudent.id}
              onSelectStudent={setSelectedStudentId}
              onConnectToSchool={() => router.navigate("/(tabs)/connect")}
            />
            <FeeBreakdownCard
              student={activeStudent}
              obligations={fees}
              payments={payments}
            />
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
    padding: SPACING.xl,
    gap: SPACING.md,
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
});
