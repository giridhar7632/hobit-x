import { useFonts } from "expo-font";
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../global.css';

import { CustomAlertProvider } from '@/components/custom-alert-provider';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-context';
import { TimerProvider } from '@/context/timer-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { APP_NAME, databaseMigrations, handleSync } from '@/lib/meridian';
import { initDatabase } from '@/utils/database';
import { requestNotificationPermissions } from '@/utils/notifications';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from "expo-splash-screen";
import { MeridianProvider, MutationRecord } from 'meridian-lite';
import { useEffect, useState } from 'react';
import { Platform } from "react-native";

function onDeadLetter(mutation: MutationRecord, error: unknown) {
  console.error('[Meridian] Mutation dead-lettered:', mutation, error);
}

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const colorScheme = useColorScheme();

  const [fontsLoaded, fontError] = useFonts({
    "Obviously-Bold": require("../assets/fonts/ObviouslyDemo-Bold.otf"),
    "Obviously-Black": require("../assets/fonts/ObviouslyDemo-Black.otf"),
    "Obviously-RegularItalic": require("../assets/fonts/ObviouslyDemo-RegularItalic.otf"),
    "Obviously-Medium": require("../assets/fonts/ObviouslyDemo-Medium.otf"),
    "Obviously-Regular": require("../assets/fonts/ObviouslyDemo-Regular.otf"),
    "Obviously-SemiBold": require("../assets/fonts/ObviouslyDemo-Semibold.otf"),
  });

  useEffect(() => {
    async function setupNotifications() {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Hobit Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: true,
        });
      }
      await requestNotificationPermissions();
    }
    setupNotifications();
  }, []);

  useEffect(() => {
    async function prepareDatabase() {
      try {
        await initDatabase();
        setDbReady(true);
      } catch (e) {
        console.error("CRITICAL SQLITE ERROR:", e);
        setDbReady(true);
      }
    }
    prepareDatabase();
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, dbReady]);

  if ((!fontsLoaded && !fontError) || !dbReady) {
    return null;
  }

  return (
    <AuthProvider>
      <MeridianProvider
        appName={APP_NAME}
        migrations={databaseMigrations}
        onSync={handleSync}
        maxRetries={5}
        onDeadLetter={onDeadLetter}
      >
        <ThemeProvider>
          <TimerProvider>
            <CustomAlertProvider>
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
                <Stack.Screen name="auth" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" options={{ headerShown: false }} />
              </Stack>
            </CustomAlertProvider>
            <StatusBar style={colorScheme === "light" ? "dark" : "light"} />
          </TimerProvider>
        </ThemeProvider>
      </MeridianProvider>
    </AuthProvider>
  );
}