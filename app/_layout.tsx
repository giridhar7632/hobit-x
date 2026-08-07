import { useFonts } from "expo-font";
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../global.css';

import { ThemeProvider } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { initDatabase } from '@/utils/database';
import { requestNotificationPermissions } from '@/utils/notifications';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Notifications from 'expo-notifications';
import * as SplashScreen from "expo-splash-screen";

import { useEffect, useState } from 'react';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

const queryClient = new QueryClient();

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
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-Italic": require("../assets/fonts/Poppins-Italic.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
  });

  useEffect(() => {
    // Ask for permission when the app starts
    requestNotificationPermissions();
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

  if (!fontsLoaded && !fontError || !dbReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style={colorScheme === "light" ? "dark" : "light"} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}