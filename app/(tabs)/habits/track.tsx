import { ThemedView } from "@/components/themed-view";
import Button from "@/components/ui/button";
import FormInput from "@/components/ui/form-input";
import { Colors } from "@/constants/theme";
import { trackHabit, updateStreakOnComplete } from "@/utils/actions";
import { Picker } from "@react-native-picker/picker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Text, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TrackScreen() {
  const colorScheme = useColorScheme();
  const { id, name, planned_time, frequency, to } = useLocalSearchParams();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      status: "Completed",
      actual_time_minutes: planned_time?.toString() || "",
    },
  });

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: trackHabit,
    onSuccess: async (data, variables) => {
      reset();
      if (variables.status === "Completed") {
        await updateStreakOnComplete(Number(id), variables.entry_date);
      }
      queryClient.invalidateQueries({ queryKey: ["habit_entries", id] });
      queryClient.invalidateQueries({ queryKey: ["habit_summary", id] });
      router.push(`../`);
    },
    onError: (error) => {
      console.error("Error tracking habit:", error);
      Alert.alert("Error tracking habit:", error.message);
    },
  });

  const onTrackHabit = async (formData: any) =>
    mutation.mutate({
      habit_id: id,
      ...formData,
      entry_date: new Date().toISOString(),
    });

  return (
    <SafeAreaView className="h-full">
      <Text className="h-16 bg-lime-500 text-white font-psemibold text-xl py-4 text-center">
        Track: {name}
      </Text>
      <ThemedView className="flex flex-col space-y-2 gap-2 p-3 mt-5">
        <Text
          className="text-base font-pitalic mb-4"
          style={{ color: Colors[colorScheme ?? "light"].tabIconDefault }}
        >
          You planned to {name}{" "}
          <Text className="text-lime-600">{planned_time}</Text> minutes{" "}
          {frequency}
        </Text>

        <View className="mx-4 px-4">
          <Text
            style={{ color: Colors[colorScheme ?? "light"].tabIconDefault }}
            className="text-base"
          >
            Select status
          </Text>
          <Controller
            control={control}
            name="status"
            rules={{ required: "Status is required" }}
            render={({ field: { onChange, value } }) => (
              <Picker
                selectedValue={value}
                onValueChange={(itemValue) => onChange(itemValue)}
              >
                <Picker.Item label="Completed" value="Completed" />
                <Picker.Item label="Missed" value="Missed" />
                <Picker.Item label="Skipped" value="Skipped" />
              </Picker>
            )}
          />
          {errors.status && (
            <Text className="text-red-500 px-4">{errors.status.message}</Text>
          )}
        </View>
        <Controller
          control={control}
          name="actual_time_minutes"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              handleBlur={onBlur}
              handleChangeText={(value) => onChange(value)}
              value={value}
              label="Actual time (minutes)"
              placeholder="Enter actual time spent"
              keyboardType="numeric"
            />
          )}
        />
        {errors.actual_time_minutes && (
          <Text className="text-red-500 px-4">
            {errors.actual_time_minutes.message}
          </Text>
        )}

        <View className="flex gap-4 px-4">
          <Button
            containerStyles={"mt-10"}
            title={mutation.isPending ? "Adding..." : "Track Habit"}
            handlePress={handleSubmit(onTrackHabit)}
            loading={mutation.isPending}
          />

          <Button
            containerStyles={"mt-4"}
            title={"Dismiss"}
            handlePress={() => router.push(`../`)}
          />
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}
