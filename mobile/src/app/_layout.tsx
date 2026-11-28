import { DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AdminNoticeScreen } from "@/src/components/common/AdminNoticeScreen";
import { AuthProvider, useAuth } from "@/src/context/AuthContext";
import { COLORS } from "@/src/theme/tokens";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

const FeeEaseLightTheme: typeof DefaultTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.emeraldPrimary,
    background: COLORS.bg,
    card: COLORS.cardBg,
    text: COLORS.textPrimary,
    border: COLORS.border,
    notification: COLORS.amberPrimary,
  },
};

SplashScreen.preventAutoHideAsync().catch(() => {
  // Safe no-op if splash screen was already hidden by native shell.
});

function RootNavigator() {
  const { isHydrating, isLoggedIn, userRole } = useAuth();

  useEffect(() => {
    if (!isHydrating) {
      SplashScreen.hideAsync().catch(() => {
        // Safe no-op in non-native or fast-reload environments.
      });
    }
  }, [isHydrating]);

  if (isHydrating) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={COLORS.emeraldPrimary} />
        <Text style={styles.loadingText}>Starting FeeEase...</Text>
      </View>
    );
  }

  // Admin accounts never enter Parent Tabs or mount Parent data routes.
  if (isLoggedIn && userRole === "admin") {
    return <AdminNoticeScreen />;
  }

  const isParentAuthenticated = isLoggedIn && userRole === "parent";

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isLoggedIn} redirectTo="/(tabs)">
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected
        guard={isParentAuthenticated}
        redirectTo="/(auth)/login"
      >
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider value={FeeEaseLightTheme}>
        <StatusBar style="dark" />
        <RootNavigator />
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
});
