import { Image, ScrollView } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/theme";
import logo from "../assets/images/logo.png";
import { router } from "expo-router";
import Button from "@/components/ui/button";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const path =
    colorScheme === "light"
      ? require("../assets/images/path-light.png")
      : require("../assets/images/path-dark.png");


  return (
    <SafeAreaView
      style={{ backgroundColor: Colors[colorScheme ?? "light"].background }}
      className="h-full"
    >
      <ScrollView contentContainerStyle={{ height: "100%" }}>
        <ThemedView className="relative flex-1 justify-center items-center">
          <Image source={logo} className="h-[150px]" resizeMode="contain" />
          <ThemedText className="text-5xl font-pbold py-2">Hobit</ThemedText>
          <ThemedText className="text-sm font-regular mb-2">
            Track your stuff without forgetting
          </ThemedText>

          <Button
            title="Go to Home"
            handlePress={() => router.push("/habits")}
            containerStyles={"w-[80%] h-16"}
            textStyles={"text-xl"}
          />

          <Image
            source={path}
            className="w-screen absolute -z-10 -bottom-40 left-0 right-0"
            resizeMode="contain"
          />
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}
