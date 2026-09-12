import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/button';
import { HABIT_COLORS } from '@/constants/habit-colors';
import { GoogleIcon, renderHabitIcon, TickIcon } from '@/constants/icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatTimesOfDay } from '@/utils/notifications';
import { OnboardingHabitDraft } from '@/utils/onboarding';

interface OnboardingReadyProps {
  draft: OnboardingHabitDraft;
  onGoogleSignIn: () => void;
  onContinueAsGuest: () => void;
  isSubmitting?: boolean;
  accentColor?: string;
}

export function OnboardingReady({
  draft,
  onGoogleSignIn,
  onContinueAsGuest,
  isSubmitting = false,
  accentColor = '#4655E0',
}: OnboardingReadyProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? '#141517' : '#FAF9F6';
  const colorDef = HABIT_COLORS[draft.color] || HABIT_COLORS.purple;
  const habitAccent = colorDef.accent;

  // Animation values
  const checkScale = useSharedValue(0);
  const cardTranslateY = useSharedValue(24);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    checkScale.value = withSequence(
      withSpring(1.2, { damping: 10, stiffness: 120 }),
      withSpring(1, { damping: 12 })
    );

    cardOpacity.value = withDelay(250, withTiming(1, { duration: 400 }));
    cardTranslateY.value = withDelay(
      250,
      withSpring(0, { damping: 14, stiffness: 100 })
    );
  }, []);

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  // Build target / frequency subtitle
  const frequencyLabel =
    draft.frequency === 'daily'
      ? 'Every day'
      : draft.frequency === 'weekly'
        ? `${draft.target_days.length} days a week`
        : `Every ${draft.interval} days`;

  const timesOfDayLabel = formatTimesOfDay(draft.times_of_day);

  const goalSummary =
    draft.completion_type === 'time'
      ? `${draft.planned_time_minutes || 20} minutes`
      : draft.completion_type === 'quantity'
        ? `${draft.target_value || 10} ${draft.target_unit || 'units'}`
        : 'Daily check-in';

  return (
    <SafeAreaView style={{ backgroundColor: bgColor }} className="flex-1 justify-between px-7">
      <View className="flex-1 justify-center items-center py-5">
        {/* Animated Checkmark Emblem */}
        <Animated.View
          style={[
            {
              backgroundColor: isDark
                ? `${habitAccent}25`
                : `${habitAccent}18`,
              borderColor: habitAccent,
            },
            checkAnimatedStyle,
          ]}
          className="w-20 h-20 rounded-full border-2 items-center justify-center mb-7"
        >
          <TickIcon size={38} color={habitAccent} />
        </Animated.View>

        {/* Headline */}
        <Text className="text-3xl font-pbold text-center tracking-tight text-gray-900 dark:text-gray-100 mb-2.5">
          You're ready to begin.
        </Text>

        <Text className="text-sm font-pregular leading-5 text-center text-gray-500 dark:text-gray-400 max-w-[300px] mb-8">
          Your first habit is ready. Small actions become meaningful when you show up consistently.
        </Text>

        {/* Habit Card Preview */}
        <Animated.View
          style={cardAnimatedStyle}
          className="w-full max-w-[340px] flex-row items-center p-4 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#1F2023] shadow-md shadow-black/5"
        >
          <View
            style={{
              backgroundColor: isDark
                ? colorDef.pastelBgDark
                : colorDef.pastelBg,
            }}
            className="w-14 h-14 rounded-2xl items-center justify-center mr-3.5"
          >
            {renderHabitIcon(draft.icon, '#1C1C1E', 28)}
          </View>

          <View className="flex-1 gap-1">
            <Text className="text-base font-psemibold text-gray-900 dark:text-gray-100">
              {draft.name || 'My Habit'}
            </Text>
            <Text className="text-xs font-pregular text-gray-500 dark:text-gray-400">
              {frequencyLabel} · {goalSummary}
            </Text>
            {timesOfDayLabel !== 'Anytime' && (
              <Text style={{ color: habitAccent }} className="text-xs font-pmedium">
                {timesOfDayLabel}
              </Text>
            )}
          </View>
        </Animated.View>
      </View>

      {/* Action Buttons */}
      <View className="pb-8 w-full max-w-[360px] mx-auto gap-3">
        {/* Google Sign In & Save */}
        <Button
          title="Continue with Google"
          variant="outline"
          size="default"
          loading={isSubmitting}
          disabled={isSubmitting}
          onPress={onGoogleSignIn}
          leftIcon={<GoogleIcon size={20} />}
          className="w-full"
        />

        {/* Guest Continue */}
        <Button
          title="Skip for now · Start tracking"
          variant="ghost"
          size="md"
          disabled={isSubmitting}
          onPress={onContinueAsGuest}
          className="w-full"
        />
      </View>
    </SafeAreaView>
  );
}
