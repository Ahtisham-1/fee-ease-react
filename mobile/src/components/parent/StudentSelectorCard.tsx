import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS, RADII, SPACING } from "@/src/theme/tokens";
import type { Student } from "@/src/types/index";

export interface StudentSelectorCardProps {
  students: Student[];
  selectedStudentId: string;
  onSelectStudent: (studentId: string) => void;
  onConnectToSchool: () => void;
}

export function StudentSelectorCard({
  students,
  selectedStudentId,
  onSelectStudent,
  onConnectToSchool,
}: StudentSelectorCardProps) {
  if (students.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.badge}>PARENT PORTAL</Text>
        <Text accessibilityRole="header" style={styles.title}>
          No Children Linked to This Account
        </Text>
        <Text style={styles.subtitle}>
          Verify the mobile number registered with your school office to
          connect your account to your enrolled children.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Connect to your school"
          onPress={onConnectToSchool}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>Connect to Your School</Text>
        </Pressable>
      </View>
    );
  }

  if (students.length === 1) {
    const child = students[0];
    return (
      <View style={styles.card}>
        <Text style={styles.badge}>MY ENROLLED CHILD</Text>
        <View style={styles.singleChildBox}>
          <View style={styles.singleChildMeta}>
            <Text style={styles.metaLabel}>STUDENT</Text>
            <Text style={styles.singleChildName}>{child.name}</Text>
          </View>
          <View style={styles.classPill}>
            <Text style={styles.classPillText}>Class {child.gradeName}</Text>
          </View>
        </View>
      </View>
    );
  }

  const activeId =
    students.find((s) => s.id === selectedStudentId)?.id ?? students[0].id;

  return (
    <View style={styles.card}>
      <Text style={styles.badge}>
        MY ENROLLED CHILDREN ({students.length})
      </Text>
      <Text style={styles.selectorLabel}>
        Select a child to view fee breakdown
      </Text>
      <View style={styles.pillsGrid}>
        {students.map((child) => {
          const isSelected = child.id === activeId;
          return (
            <Pressable
              key={child.id}
              accessibilityRole="button"
              accessibilityLabel={`${child.name}, Class ${child.gradeName}`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelectStudent(child.id)}
              style={({ pressed }) => [
                styles.childPill,
                isSelected && styles.childPillSelected,
                pressed && !isSelected && styles.childPillPressed,
              ]}
            >
              <Text
                style={[
                  styles.pillName,
                  isSelected && styles.pillNameSelected,
                ]}
              >
                {child.name}
              </Text>
              <Text
                style={[
                  styles.pillGrade,
                  isSelected && styles.pillGradeSelected,
                ]}
              >
                Class {child.gradeName}
              </Text>
            </Pressable>
          );
        })}
      </View>
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
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
  singleChildBox: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.inputBg,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADII.md,
    padding: SPACING.md,
  },
  singleChildMeta: {
    flexGrow: 1,
    flexBasis: 150,
    gap: 2,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
    letterSpacing: 0.4,
  },
  singleChildName: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  classPill: {
    backgroundColor: COLORS.emeraldLight,
    borderColor: COLORS.emeraldBorder,
    borderWidth: 1,
    borderRadius: RADII.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  },
  classPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.emeraldDark,
  },
  selectorLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  pillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  childPill: {
    flexBasis: 135,
    flexGrow: 1,
    backgroundColor: COLORS.inputBg,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    gap: 2,
  },
  childPillSelected: {
    backgroundColor: COLORS.emeraldLight,
    borderColor: COLORS.emeraldPrimary,
    borderWidth: 1.5,
  },
  childPillPressed: {
    backgroundColor: COLORS.border,
  },
  pillName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  pillNameSelected: {
    color: COLORS.emeraldDeeper,
  },
  pillGrade: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  pillGradeSelected: {
    color: COLORS.emeraldDark,
  },
});
