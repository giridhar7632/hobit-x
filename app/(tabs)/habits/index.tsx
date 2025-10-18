import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getHabits } from "@/utils/actions";
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HabitsScreen() {
  const colorScheme = useColorScheme();

  const {
    data: habits,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["habits"],
    queryFn: getHabits,
  });

  return (
    <SafeAreaView
      style={{ backgroundColor: Colors[colorScheme ?? "light"].background }}
      className="h-full"
    >
      <ScrollView contentContainerStyle={{ height: "100%" }}>
        <ThemedView className="flex-1 flex-col space-y-2">
          <View
            className={`flex flex-col py-10 my-10 items-center justify-center ${
              colorScheme === "light" ? "bg-neutral-100" : "bg-neutral-800"
            }`}
          >
            <ThemedText className="text-3xl font-pbold mt-10">
              Welcome back!
            </ThemedText>
          </View>

          <View className="px-4">
            <ThemedText className="text-xl font-pbold mb-4">
              Your habits:
            </ThemedText>
            <View className="space-y-2 gap-2">
              {isLoading ? (
                <View className="mt-10">
                  <ActivityIndicator
                    animating={isLoading}
                    color="#84cc16"
                    size="large"
                  />
                </View>
              ) : isError ? (
                <ThemedText className="text-lg text-center opacity-30 font-pbold">
                  {error.message}
                </ThemedText>
              ) : habits?.length === 0 ? (
                <ThemedText className="text-lg text-center opacity-30 font-pbold">
                  No Habits added yet
                </ThemedText>
              ) : (
                habits?.map((habit: any) => (
                  <ThemedView
                    key={habit.id}
                    className="flex-row items-center justify-between p-3 border border-neutral-700 rounded-lg"
                  >
                    <ThemedText className="flex-1 font-pbold">{habit.name}</ThemedText>
                    <View className="flex flex-row items-center gap-4">
                      <Link
                        className="text-lime-600"
                        href={`/habits/track?id=${habit.id}&name=${habit.name}&frequency=${habit.frequency}&planned_time=${habit.planned_time_minutes}&to=`}
                      >
                        Track
                      </Link>
                      <Link
                        className="text-lime-600"
                        href={`/habits/${habit.id}?name=${habit.name}&description=${habit.description}&frequency=${habit.frequency}&planned_time=${habit.planned_time_minutes}&notify=${habit.notify}&total_points=${habit.total_points}`}
                      >
                        View
                      </Link>
                    </View>
                  </ThemedView>
                ))
              )}
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}
