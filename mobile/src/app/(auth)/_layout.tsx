import { Stack } from "expo-router";
import { COLORS } from "@/src/theme/tokens";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bg },
      }}
    />
  );
}
