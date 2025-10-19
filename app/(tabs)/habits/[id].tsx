import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Button from "@/components/ui/button";
import icons from "@/constants/icons";
import { Colors } from "@/constants/theme";
import { deleteEntry, deleteHabit, getHabitActivity } from "@/utils/actions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatRelative } from 'date-fns';
import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
// import { ContributionGraph } from "react-native-chart-kit";
import { SafeAreaView } from 'react-native-safe-area-context';


export default function HabitScreen() {
  const {
    id,
    name,
    description,
    current_streak,
    frequency,
    planned_time,
    notify,
    total_points,
  } = useLocalSearchParams();
  const colorScheme = useColorScheme();

  const {
    data: activity,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["habit_entries", id],
    queryFn: () => getHabitActivity(id?.toString() ?? ""),
  });

  // const { data: activitySummary, isLoading: isLoadingSummary } = useQuery({
  //   queryKey: ["habit_summary", id],
  //   queryFn: () => getHabitActivitySummary(id?.toString() ?? ""),
  // });


  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: deleteEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habit_entries", id] });
      queryClient.invalidateQueries({ queryKey: ["habit_summary", id] });
    },
    onError: (error) => {
      console.error("Error deleting entry:", error);
      Alert.alert("Error deleting entry:", error.message);
    },
  })
  const onDeleteEntry = async (entry_id: number) =>
    await deleteMutation.mutate(entry_id);

  const deleteHabitMutation = useMutation({
    mutationFn: deleteHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habit_entries", id] });
      queryClient.invalidateQueries({ queryKey: ["habit_summary", id] });
      router.push("/habits");
    },
    onError: (error) => {
      console.error("Error deleting entry:", error);
      Alert.alert("Error deleting entry:", error.message);
    },
  })
  const onDeleteHabit = async (entry_id: number) =>
    deleteHabitMutation.mutate(entry_id);

  return (
    <SafeAreaView
      style={{ backgroundColor: Colors[colorScheme ?? "light"].background }}
      className="h-full"
    >
      <ScrollView>
        <ThemedView className="flex-1 pb-20">
          <View
            className={`relative flex flex-col py-10 my-10 items-center justify-center ${
              colorScheme === "light" ? "bg-neutral-100" : "bg-neutral-800"
            }`}
          >
            {notify === "true" ? (
              <View className="absolute top-4 right-12">
                <Image
                  source={icons.notification}
                  resizeMode="contain"
                  tintColor={Colors[colorScheme ?? "light"].tint}
                  className="w-6 h-6 rotate-45 opacity-80"
                />
              </View>
            ) : null}
            <TouchableOpacity className="absolute top-4 right-4" onPress={() => onDeleteHabit(Number(id))}>
                <Image
                  source={icons.bin}
                  resizeMode="contain"
                  tintColor={'#f00'}
                  className="w-6 h-6"
                />
              </TouchableOpacity>
            <ThemedText className="text-3xl font-pbold">{name}</ThemedText>
            <ThemedText className="font-pmedium">{description}</ThemedText>
            <ThemedText
              style={{ color: Colors[colorScheme ?? "light"].tabIconDefault }}
              className="font-pitalic text-sm"
            >
              You planned this {frequency} for{" "}
              <Text className="text-lime-500">{planned_time}</Text> minutes.
            </ThemedText>
            <ThemedText className="text-sm font-pregular">
              {total_points && Number(total_points) > 0
                ? `Total points: ${total_points}`
                : null}
            </ThemedText>
          </View>
          {Number(current_streak) > 0 ? <ThemedText className="text-center">Streak: <Text className="text-lime-500">{current_streak}</Text>🔥</ThemedText> : null }
          {/* <ScrollView horizontal>
            {isLoadingSummary ? (
              <View className="h-60 max-h-96 w-96 mx-auto flex items-center justify-center">
                <ActivityIndicator />
              </View>
            ) : // <Heatmap data={activitySummary} width={420} height={200} />
            activitySummary && activitySummary?.length > 0 ? (
              <View className="h-60 max-h-96 w-96 mx-auto overflow-y-hidden overflow-x-auto">
                <ContributionGraph
                  values={activitySummary}
                  endDate={new Date(activitySummary[0]?.date)}
                  numDays={105}
                  width={500}
                  height={220}
                  gutterSize={2}
                  tooltipDataAttrs={({ value }) => handleToolTip}
                  chartConfig={{
                    backgroundColor: "#fff",
                    backgroundGradientFrom: "#fff",
                    backgroundGradientTo: "#fff",
                    color: (opacity = 1) => `rgba(132, 204, 22, ${opacity})`,
                    labelColor: () => `rgb(101, 163, 13)`,
                    style: {
                      borderRadius: 16,
                    },
                  }}
                />
              </View>
            ) : null}
          </ScrollView> */}
          <View className="flex flex-col space-y-2 px-4">
            <View className="flex flex-row items-center justify-between mb-4">
              <ThemedText className="text-xl font-pbold">
                Recent activity
              </ThemedText>
              <Button
                title="Track"
                handlePress={() =>
                  router.push(
                    `/habits/track?id=${id}&name=${name}&frequency=${frequency}&planned_time=${planned_time}&to=${id}`,
                  )
                }
              />
            </View>
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
            ) : activity?.length === 0 ? (
              <ThemedText className="text-lg text-center opacity-30 font-pbold">
                No activity yet
              </ThemedText>
            ) : (
              activity?.map((entry: any) => (
                <ThemedView
                  key={entry?.entry_date}
                  className={`flex-row items-center justify-between p-3 rounded-lg border ${
                    colorScheme === "light"
                      ? "border-neutral-200"
                      : "border-neutral-700"
                  }`}
                >
                  <ThemedText className="font-pbold">{entry.status}</ThemedText>

                  <View className="flex flex-row gap-2">
                    <ThemedText className="font-pregular">
                      {entry?.entry_date ? formatRelative(new Date(entry.entry_date), new Date()) : null}
                    </ThemedText>
                    <TouchableOpacity onPress={() => onDeleteEntry(entry.id)}>
                      <Image
                        source={icons.bin}
                        resizeMode="contain"
                        tintColor={'#f00'}
                        className="w-6 h-6"
                      />
                    </TouchableOpacity>
                  </View>
                  
                </ThemedView>
              ))
            )}
          </View>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}
