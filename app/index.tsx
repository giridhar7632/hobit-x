import { Image, ScrollView } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Button from "@/components/ui/button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import logo from "../assets/images/logo.png";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const path =
    colorScheme === "light" ? require("@/assets/images/path-light.png") : require("@/assets/images/path-dark.png")


  return (
    <SafeAreaView
      style={{ backgroundColor: Colors[colorScheme ?? "light"].background }}
      className="h-full"
    >
      <ScrollView contentContainerStyle={{ height: "100%" }}>
        <ThemedView className="relative flex-1 justify-center items-center">
          <Image source={logo} className="h-[150px]" resizeMode="contain" />
          <ThemedText className="text-5xl font-pbold py-2">Hobit App</ThemedText>
          <ThemedText className="text-base font-regular mb-6">
            Track your bite-sized habits
          </ThemedText>

          <Button
            title="Start tracking"
            handlePress={() => router.push("/habits")}
            containerStyles={"w-[80%] h-16 z-10"}
            textStyles={"text-xl"}
          />

          <Image
            source={path}
            className="w-screen h-full absolute -z-1 -bottom-40 left-0 right-0"
            resizeMode="contain"
          />
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}
