import { StyleSheet, Text, View } from "react-native";
import { COLORS, RADII, SPACING } from "@/src/theme/tokens";

export type StatusBannerVariant = "warning" | "success" | "error";

interface StatusBannerProps {
  message: string;
  variant?: StatusBannerVariant;
}

const VARIANT_STYLES: Record<
  StatusBannerVariant,
  { backgroundColor: string; borderColor: string; color: string }
> = {
  warning: {
    backgroundColor: COLORS.amberLight,
    borderColor: COLORS.amberBorder,
    color: COLORS.amberText,
  },
  success: {
    backgroundColor: COLORS.emeraldLight,
    borderColor: COLORS.emeraldBorder,
    color: COLORS.emeraldDeeper,
  },
  error: {
    backgroundColor: COLORS.dangerBg,
    borderColor: COLORS.dangerBorder,
    color: COLORS.dangerText,
  },
};

export function StatusBanner({
  message,
  variant = "warning",
}: StatusBannerProps) {
  if (!message.trim()) {
    return null;
  }

  const palette = VARIANT_STYLES[variant];

  return (
    <View
      accessibilityRole={variant === "success" ? "text" : "alert"}
      accessibilityLiveRegion={
        variant === "error" || variant === "warning" ? "polite" : "none"
      }
      style={[
        styles.banner,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
        },
      ]}
    >
      <Text style={[styles.text, { color: palette.color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: RADII.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
});
