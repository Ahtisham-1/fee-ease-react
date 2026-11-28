import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text } from "react-native";
import { useAuth } from "@/src/context/AuthContext";
import { SchoolDataProvider } from "@/src/context/SchoolDataContext";
import { COLORS, RADII, SPACING } from "@/src/theme/tokens";

export default function TabLayout() {
  const { logout } = useAuth();

  return (
    <SchoolDataProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: COLORS.emeraldPrimary,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarStyle: {
            backgroundColor: COLORS.cardBg,
            borderTopColor: COLORS.border,
          },
          headerStyle: { backgroundColor: COLORS.cardBg },
          headerTintColor: COLORS.textPrimary,
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void logout().catch(() => {});
              }}
              style={styles.signOutBtn}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "FeeEase",
            tabBarLabel: "Home",
            tabBarIcon: ({ color }) => (
              <SymbolView
                name={{
                  ios: "house.fill",
                  android: "home",
                  web: "home",
                }}
                tintColor={color}
                size={22}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="connect"
          options={{
            title: "Connect School",
            tabBarLabel: "Connect School",
            tabBarIcon: ({ color }) => (
              <SymbolView
                name={{
                  ios: "building.2.fill",
                  android: "school",
                  web: "school",
                }}
                tintColor={color}
                size={22}
              />
            ),
          }}
        />
      </Tabs>
    </SchoolDataProvider>
  );
}

const styles = StyleSheet.create({
  signOutBtn: {
    marginRight: SPACING.md,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.inputBg,
  },
  signOutText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
});
