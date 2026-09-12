import { useAuth } from "@/context/auth-context";
import { hasCompletedOnboarding } from "@/utils/onboarding";
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { user, isGuest, isLoading: isAuthLoading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkOnboarding() {
      const completed = await hasCompletedOnboarding();
      setOnboardingDone(completed);
    }
    checkOnboarding();
  }, []);

  if (isAuthLoading || onboardingDone === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#151718" }}>
        <ActivityIndicator size="large" color="#4655E0" />
      </View>
    );
  }

  // First-time users who have not finished onboarding
  if (!onboardingDone) {
    return <Redirect href={"/onboarding" as any} />;
  }

  // Returning users
  if (user || isGuest) {
    return <Redirect href="/(tabs)/habits" />;
  }

  return <Redirect href={"/auth" as any} />;
}