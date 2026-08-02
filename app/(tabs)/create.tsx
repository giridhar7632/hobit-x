import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Button from "@/components/ui/button";
import FormInput from "@/components/ui/form-input";
import { HABIT_COLORS, PASTEL_PALETTE } from "@/constants/habit-colors";
import { Colors } from "@/constants/theme";
import { useAppTheme } from "@/context/theme-context";
import { createHabit } from "@/utils/actions";
import { getBasePoints } from "@/utils/points";

const WEEK_DAYS = [
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
  { label: 'S', value: 0 },
];

export default function CreateScreen() {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notifyTime, setNotifyTime] = useState(new Date());

  const colorScheme = useColorScheme();
  const currentTheme = colorScheme === "dark" ? "dark" : "light";
  const { setActiveColor, resetColor } = useAppTheme();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      planned_time_minutes: "",
      frequency: "weekly",
      color: "lime", // Changed default to lime
      target_days: [1, 2, 3, 4, 5],
      interval: 1,
      notify: false,
    },
  });

  const frequencyWatch = watch("frequency");
  const selectedColorId = watch("color");
  const selectedTheme = HABIT_COLORS[selectedColorId] || HABIT_COLORS.lime;

  useEffect(() => {
    setActiveColor(selectedColorId);
  }, [selectedColorId, setActiveColor]);

  useFocusEffect(
    useCallback(() => {
      return () => resetColor();
    }, [resetColor])
  );

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createHabit,
    onSuccess: (data: any) => {
      reset();
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      router.push(`/habits/${data.id || data.lastInsertRowId}`);
    },
    onError: (error: any) => {
      console.error("Error creating habit:", error);
      Alert.alert("Error creating habit:", error.message);
    },
  });

  const onCreateTodo = async (formData: any) => {
    let points = 15;
    try {
      points = await getBasePoints(formData.name, Number(formData.planned_time_minutes));
    } catch (error) {
      console.log("Error getting AI points, falling back to 15.");
    }

    // if (formData.notify && notifyTime) {
    //   try {
    //     await scheduleHabitNotification(
    //       formData.name,
    //       notifyTime.toISOString(),
    //       formData.target_days
    //     );
    //   } catch (error) {
    //     console.error("Failed to schedule notification:", error);
    //   }
    // }

    return mutation.mutate({
      name: formData.name,
      description: formData.description,
      color: formData.color,
      frequency: formData.frequency,
      planned_time_minutes: Number(formData.planned_time_minutes),
      interval: Number(formData.interval),
      target_days: JSON.stringify(formData.target_days),
      notify: formData.notify ? 1 : 0,
      notify_time: formData.notify ? notifyTime.toISOString() : null,
      start_date: new Date().toISOString(),
      base_points: points / Number(formData.planned_time_minutes),
    });
  };

  const handleTimeChange = (event: any, selectedDate: any) => {
    if (selectedDate) setNotifyTime(selectedDate);
    setShowTimePicker(false);
  };

  return (
    <SafeAreaView
      style={{ backgroundColor: Colors[currentTheme].background }}
      className="flex-1"
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <ThemedView className="flex-1 flex-col space-y-4 p-4 mt-6" style={{ backgroundColor: 'transparent' }}>

          <ThemedText className="text-3xl font-pbold mb-2">New Habit</ThemedText>

          {/* Name & Description */}
          <Controller
            control={control}
            name="name"
            rules={{ required: "Habit name is required" }}
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                handleBlur={onBlur}
                handleChangeText={onChange}
                value={value}
                label="Habit name"
                placeholder="e.g., Read a book"
                error={errors.name?.message as string}
                accentColor={selectedTheme.accent}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                handleBlur={onBlur}
                handleChangeText={onChange}
                value={value}
                label="Description (Optional)"
                placeholder="A short and sweet description"
                error={errors.description?.message as string}
                accentColor={selectedTheme.accent}
              />
            )}
          />

          {/* Theme Color Picker */}
          <View className="mx-4 mt-2">
            <ThemedText className="text-sm opacity-70 mb-3">Color Theme</ThemedText>
            <View className="flex-row justify-between items-center px-2">
              {PASTEL_PALETTE.map((item) => {
                const isSelected = selectedColorId === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setValue("color", item.id)}
                    style={{
                      backgroundColor: item.hex,
                      borderColor: isSelected ? `${item.accent}30` : 'transparent',
                      borderWidth: 3
                    }}
                    className={`w-10 h-10 rounded-full items-center justify-center ${isSelected ? "scale-110" : ""}`}
                  />
                );
              })}
            </View>
          </View>

          {/* Frequency Type */}
          <View className="mx-4 mt-4">
            <ThemedText className="text-sm opacity-70 mb-1">Frequency</ThemedText>
            <Controller
              control={control}
              name="frequency"
              render={({ field: { onChange, value } }) => (
                <View className={`border rounded-xl mt-2 ${currentTheme === 'light' ? 'border-neutral-200 bg-neutral-100' : 'border-neutral-800 bg-neutral-900'}`}>
                  <Picker
                    selectedValue={value}
                    onValueChange={onChange}
                    style={{ color: Colors[currentTheme].text }}
                    dropdownIconColor={Colors[currentTheme].text}
                  >
                    <Picker.Item label="Daily" value="daily" />
                    <Picker.Item label="Weekly (Specific Days)" value="weekly" />
                    <Picker.Item label="Monthly" value="monthly" />
                  </Picker>
                </View>
              )}
            />
          </View>

          {/* Target Days (Week of Dots) */}
          {frequencyWatch !== "monthly" && (
            <View className="mx-4 mt-4">
              <ThemedText className="text-sm opacity-70 mb-3">Target Days</ThemedText>
              <Controller
                control={control}
                name="target_days"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row justify-between items-center">
                    {WEEK_DAYS.map((day) => {
                      const isActive = value.includes(day.value);

                      return (
                        <TouchableOpacity
                          key={day.label + day.value}
                          onPress={() => {
                            if (isActive) {
                              onChange(value.filter((v: number) => v !== day.value));
                            } else {
                              onChange([...value, day.value]);
                            }
                          }}
                          style={{
                            backgroundColor: isActive ? selectedTheme.hex : 'transparent',
                            borderColor: isActive ? `${selectedTheme.accent}40` : (currentTheme === 'dark' ? '#404040' : '#d4d4d8'),
                            borderWidth: isActive ? 3 : 1,
                          }}
                          className="w-10 h-10 rounded-full items-center justify-center"
                        >
                          <Text style={{ color: isActive ? selectedTheme.accent : (currentTheme === 'dark' ? '#a3a3a3' : '#737373') }} className="font-pbold text-sm">
                            {day.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              />
            </View>
          )}

          {/* Repeat Interval */}
          <View className="mx-4 mt-4 flex-row items-center justify-between">
            <ThemedText className="text-sm opacity-70">Repeat every</ThemedText>
            <Controller
              control={control}
              name="interval"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row items-center gap-4">
                  <TouchableOpacity
                    onPress={() => onChange(Math.max(1, value - 1))}
                    className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 items-center justify-center"
                  >
                    <Text className={`font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>-</Text>
                  </TouchableOpacity>

                  <ThemedText className="font-pbold text-lg">{value}</ThemedText>

                  <TouchableOpacity
                    onPress={() => onChange(value + 1)}
                    className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 items-center justify-center"
                  >
                    <Text className={`font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>+</Text>
                  </TouchableOpacity>

                  <ThemedText className="text-sm opacity-70 w-12">
                    {frequencyWatch === 'daily' ? 'days' : frequencyWatch === 'monthly' ? 'months' : 'weeks'}
                  </ThemedText>
                </View>
              )}
            />
          </View>

          {/* Planned Time */}
          <Controller
            control={control}
            name="planned_time_minutes"
            rules={{
              required: "Planned time is required",
              validate: (value) => {
                const parsed = Number(String(value).trim());

                if (isNaN(parsed) || parsed <= 0) {
                  return "Must be a valid number greater than 0";
                }
                if (parsed > 120) {
                  return "Maximum is 120 minutes (2 hours)";
                }
                return true;
              }
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                handleBlur={onBlur}
                handleChangeText={onChange}
                value={value}
                label="Planned time (minutes)"
                keyboardType="numeric"
                error={errors.planned_time_minutes?.message as string}
                accentColor={selectedTheme.accent}
              />
            )}
          />

          {/* Notifications */}
          <View className="mx-4 mt-4 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <View className="flex-row items-center justify-between">
              <ThemedText className="text-base font-pmedium">Enable Notifications</ThemedText>
              <Controller
                control={control}
                name="notify"
                render={({ field: { onChange, value } }) => (
                  <Switch
                    value={value}
                    trackColor={{ true: selectedTheme.accent, false: "#737373" }}
                    onValueChange={onChange}
                  />
                )}
              />
            </View>

            {watch("notify") && (
              <View className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <ThemedText className="text-sm opacity-70 mb-3">Notification Time</ThemedText>
                <View className="flex-row gap-4 items-center">
                  <Button
                    title="8:00 AM"
                    containerStyles="flex-1 min-h-[44px]"
                    style={{
                      backgroundColor: !showTimePicker ? selectedTheme.accent : 'transparent',
                      borderColor: selectedTheme.accent,
                      borderWidth: 1, // Keep border width on both so the size doesn't jump
                    }}
                    textStyle={{ color: !showTimePicker ? '#ffffff' : selectedTheme.accent }}
                    handlePress={() => {
                      const d = new Date();
                      d.setHours(8, 0, 0, 0);
                      setNotifyTime(d);
                      setShowTimePicker(false);
                    }}
                  />
                  <Button
                    title={notifyTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    containerStyles="flex-1 min-h-[44px]"
                    style={{
                      backgroundColor: showTimePicker ? selectedTheme.accent : 'transparent',
                      borderColor: selectedTheme.accent,
                      borderWidth: 1,
                    }}
                    textStyle={{ color: showTimePicker ? '#ffffff' : selectedTheme.accent }}
                    handlePress={() => setShowTimePicker(true)}
                  />
                </View>
              </View>
            )}
          </View>

          {showTimePicker && (
            <DateTimePicker
              value={notifyTime}
              mode="time"
              is24Hour={false}
              display="default"
              onChange={handleTimeChange}
            />
          )}

          <View className="w-full px-4 mt-6">
            {/* Create Habit Button updated to use selectedTheme.accent */}
            <Button
              title={mutation.isPending ? "Creating..." : "Create Habit"}
              handlePress={handleSubmit(onCreateTodo)}
              loading={mutation.isPending}
              style={{ backgroundColor: selectedTheme.accent }}
            />
          </View>

        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}