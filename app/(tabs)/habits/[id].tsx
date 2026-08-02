import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatRelative } from "date-fns";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";

import Heatmap from "@/components/heat-map";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Button from "@/components/ui/button";
import { HABIT_COLORS } from "@/constants/habit-colors";
import icons from "@/constants/icons";
import { Colors } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";
import { deleteEntry, deleteHabit, getHabitActivity, getHabitById, getHabitCompletedDates } from "@/utils/actions";
import { Habit, HabitEntry } from "@/utils/types";

export default function HabitScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const currentTheme = colorScheme === "dark" ? "dark" : "light";
  const { setActiveColor } = useAppTheme();

  const {
    data: habit,
    isLoading: isLoadingHabit,
    isError: isErrorHabit,
    error: errorHabit,
  } = useQuery<Habit, Error>({
    queryKey: ["habit", id],
    queryFn: async () => {
      const habit = await getHabitById(id?.toString() ?? "");
      if (!habit) throw new Error("Habit not found");
      return habit;
    },
  });

  const {
    data: activity,
    isLoading: isLoadingActivity,
    isError,
    error,
  } = useQuery<HabitEntry[], Error>({
    queryKey: ["habit_entries", id],
    queryFn: () => getHabitActivity(id?.toString() ?? ""),
  });

  const { data: completedDates = [], isLoading: isLoadingDates } = useQuery({
    queryKey: ["habit-dates", id],
    queryFn: () => getHabitCompletedDates(Number(id)),
  });

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habit_entries", id] });
      queryClient.invalidateQueries({ queryKey: ["habit_summary", id] });
      queryClient.invalidateQueries({ queryKey: ["habit-dates", id] });
    },
    onError: (error) => {
      console.error("Error deleting entry:", error);
      Alert.alert("Error", error.message);
    },
  });

  const onDeleteEntry = async (entry_id: number) => await deleteMutation.mutate(entry_id);

  const deleteHabitMutation = useMutation({
    mutationFn: deleteHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habit_entries", id] });
      queryClient.invalidateQueries({ queryKey: ["habit_summary", id] });
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      router.push("/habits");
    },
    onError: (error) => {
      console.error("Error deleting habit:", error);
      Alert.alert("Error", error.message);
    },
  });

  const onDeleteHabit = (habit_id: number) => {
    Alert.alert(
      "Delete Habit",
      "Are you sure? This will delete all activity data for this habit.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteHabitMutation.mutate(habit_id),
        },
      ]
    );
  };

  // Set app-wide theme to this habit's color when screen is focused
  // Must be before early returns to satisfy React's rules of hooks
  useFocusEffect(
    useCallback(() => {
      if (habit?.color) {
        setActiveColor(habit.color);
      }
    }, [habit?.color, setActiveColor])
  );

  if (isLoadingHabit) {
    return (
      <SafeAreaView style={{ backgroundColor: Colors[currentTheme].background, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors[currentTheme].tint} />
      </SafeAreaView>
    );
  }

  if (isErrorHabit) {
    return (
      <SafeAreaView style={{ backgroundColor: Colors[currentTheme].background, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View className="px-6 items-center">
          <ThemedText className="text-xl font-pbold mb-2 text-center">
            Oops! Couldn't load habit details.
          </ThemedText>
          <ThemedText className="text-base font-pmedium opacity-50 text-center mb-6">
            {errorHabit?.message || "Something went wrong while fetching the data."}
          </ThemedText>
          <Button title="Go Back" handlePress={() => router.push("/habits")} />
        </View>
      </SafeAreaView>
    );
  }

  if (!habit) {
    return (
      <SafeAreaView style={{ backgroundColor: Colors[currentTheme].background, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText className="text-lg font-pbold mb-4">Habit not found.</ThemedText>
        <Button title="Go Back" handlePress={() => router.push("/habits")} />
      </SafeAreaView>
    );
  }

  const habitColorId = habit?.color || "lime";
  const theme = HABIT_COLORS[habitColorId] || HABIT_COLORS.lime;

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'Completed': return '✓';
      case 'Skipped': return '⏭';
      case 'Missed': return '✗';
      default: return '•';
    }
  };

  return (
    <SafeAreaView
      style={{ backgroundColor: Colors[currentTheme].background }}
      className="flex-1"
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <ThemedView className="flex-1" style={{ backgroundColor: "transparent" }}>

          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="mx-4 mt-2 mb-2 self-start py-2 pr-4"
          >
            <ThemedText className="text-base font-pmedium opacity-60">
              Back
            </ThemedText>
          </TouchableOpacity>

          {/* Hero Section — no border, clean themed bg */}
          <View
            style={{ backgroundColor: `${theme.hex}90` }}
            className="mx-4 rounded-3xl py-10 px-6 items-center"
          >
            {habit.notify === 1 ? (
              <View className="absolute top-5 left-5">
                <Image
                  source={icons.notification}
                  resizeMode="contain"
                  tintColor={theme.accent}
                  className="w-5 h-5 opacity-70"
                />
              </View>
            ) : null}

            <Text className={`text-3xl font-pbold mb-2 text-center ${theme.text}`}>
              {habit.name}
            </Text>

            {habit.description ? (
              <Text className={`font-pmedium text-center px-4 mb-4 opacity-70 ${theme.text}`}>
                {habit.description}
              </Text>
            ) : null}

            {Number(habit.current_streak) > 0 ? (
              <View
                style={{ backgroundColor: `${theme.accent}18` }}
                className="px-5 py-2 rounded-full mt-2"
              >
                <Text style={{ color: theme.accent }} className="font-pbold text-sm">
                  🔥 {habit.current_streak} day streak
                </Text>
              </View>
            ) : null}
          </View>

          {/* Stats Row */}
          <View className="flex-row mx-4 mt-4 gap-3">
            <View
              className="flex-1 rounded-2xl p-4 items-center"
              style={{ backgroundColor: currentTheme === 'dark' ? '#1c1c1e' : '#f5f5f4' }}
            >
              <Text className="text-2xl font-pbold" style={{ color: theme.accent }}>
                {habit.planned_time_minutes || 0}
              </Text>
              <Text className="text-xs font-pregular opacity-50 mt-1" style={{ color: Colors[currentTheme].text }}>
                min / session
              </Text>
            </View>

            <View
              className="flex-1 rounded-2xl p-4 items-center"
              style={{ backgroundColor: currentTheme === 'dark' ? '#1c1c1e' : '#f5f5f4' }}
            >
              <Text className="text-2xl font-pbold" style={{ color: theme.accent }}>
                {habit.total_points || 0}
              </Text>
              <Text className="text-xs font-pregular opacity-50 mt-1" style={{ color: Colors[currentTheme].text }}>
                total pts
              </Text>
            </View>

            <View
              className="flex-1 rounded-2xl p-4 items-center"
              style={{ backgroundColor: currentTheme === 'dark' ? '#1c1c1e' : '#f5f5f4' }}
            >
              <Text className="text-2xl font-pbold" style={{ color: theme.accent }}>
                {habit.longest_streak || 0}
              </Text>
              <Text className="text-xs font-pregular opacity-50 mt-1" style={{ color: Colors[currentTheme].text }}>
                best streak
              </Text>
            </View>
          </View>

          {/* Track Button */}
          <View className="mx-4 mt-5">
            <Button
              title="Track Activity"
              handlePress={() =>
                router.push(
                  `/habits/track?id=${id}&name=${encodeURIComponent(habit.name)}&frequency=${habit.frequency}&planned_time=${habit.planned_time_minutes}&to=${id}`
                )
              }
              style={{ backgroundColor: theme.accent }}
              textStyle={{ color: '#ffffff' }}
            />
          </View>


          <View className="flex flex-col px-4 mt-4">
            <View className="mt-4 mb-8">
              <ThemedText type="subtitle" className="font-pbold mb-4">
                Activity
              </ThemedText>

              {!isLoadingDates && completedDates?.length != 0 && (
                <Heatmap completedDates={completedDates} />
              )}
            </View>

            {/* Activity Section */}
            {isLoadingActivity ? (
              <View className="mt-6 items-center">
                <ActivityIndicator
                  animating={isLoadingActivity}
                  color={theme.accent}
                  size="large"
                />
              </View>
            ) : isError ? (
              <ThemedText className="text-base text-center opacity-30 font-pbold mt-6">
                {error.message}
              </ThemedText>
            ) : activity?.length === 0 ? (
              <View className="mt-6 items-center py-8">
                <Text className="text-3xl mb-3">📝</Text>
                <ThemedText className="text-sm font-pmedium text-center opacity-40">
                  No activity logged yet.{"\n"}Tap "Track Activity" to get started!
                </ThemedText>
              </View>
            ) : (
              activity?.map((entry: any) => (
                <View
                  key={entry?.id || entry?.entry_date}
                  className="flex-row items-center mb-3 rounded-2xl p-4"
                  style={{
                    backgroundColor: currentTheme === "dark" ? '#1c1c1e' : '#f5f5f4',
                  }}
                >
                  {/* Status indicator */}
                  <View
                    style={{
                      backgroundColor: entry.status === 'Completed' ? `${theme.accent}20` : (currentTheme === 'dark' ? '#333' : '#e5e5e5'),
                    }}
                    className="w-9 h-9 rounded-full items-center justify-center mr-3"
                  >
                    <Text
                      style={{ color: entry.status === 'Completed' ? theme.accent : Colors[currentTheme].icon }}
                      className="text-sm font-pbold"
                    >
                      {getStatusEmoji(entry.status)}
                    </Text>
                  </View>

                  <View className="flex-1">
                    <ThemedText className="font-pbold text-sm">
                      {entry.status}
                    </ThemedText>
                    <ThemedText className="font-pregular text-xs opacity-50 mt-0.5">
                      {entry?.entry_date
                        ? formatRelative(new Date(entry.entry_date), new Date())
                        : null}
                    </ThemedText>
                  </View>

                  {entry.actual_time_minutes ? (
                    <Text className="text-xs font-pmedium opacity-50 mr-3" style={{ color: Colors[currentTheme].text }}>
                      {entry.actual_time_minutes}m
                    </Text>
                  ) : null}

                  <TouchableOpacity
                    onPress={() => onDeleteEntry(entry.id)}
                    className="p-1"
                  >
                    <Image
                      source={icons.bin}
                      resizeMode="contain"
                      tintColor="#ef4444"
                      className="w-4 h-4 opacity-40"
                    />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* Delete habit — bottom of page */}
          <TouchableOpacity
            onPress={() => onDeleteHabit(Number(id))}
            className="mx-4 mt-10 mb-4 py-3 items-center"
          >
            <Text className="text-red-400 text-sm font-pmedium opacity-70">
              Delete this habit
            </Text>
          </TouchableOpacity>

        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}