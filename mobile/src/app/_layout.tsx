import { DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { COLORS } from "@/src/theme/tokens";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

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

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {
      // Safe no-op in non-native or fast-reload environments.
    });
  }, []);

  return (
    <ThemeProvider value={FeeEaseLightTheme}>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
