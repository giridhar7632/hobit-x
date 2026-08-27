import { useAuth } from "@/context/auth-context";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { user, isGuest, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#151718" }}>
        <ActivityIndicator size="large" color="#84cc16" />
      </View>
    );
  }

  if (user || isGuest) {
    return <Redirect href="/(tabs)/habits" />;
  }

  return <Redirect href={"/auth" as any} />;
}