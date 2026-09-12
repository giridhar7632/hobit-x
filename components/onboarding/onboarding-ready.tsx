import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import {
  Text,
  View
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
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

  const iconScale = useSharedValue(0.85);
  const iconOpacity = useSharedValue(0);

  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(14);

  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(16);

  const footerOpacity = useSharedValue(0);
  const footerTranslateY = useSharedValue(12);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    iconOpacity.value = withTiming(1, {
      duration: 380,
      easing: Easing.out(Easing.cubic),
    });
    iconScale.value = withSpring(1, {
      damping: 24,
      stiffness: 220,
      mass: 0.85,
    });

    headerOpacity.value = withDelay(
      100,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) })
    );
    headerTranslateY.value = withDelay(
      100,
      withSpring(0, { damping: 25, stiffness: 200 })
    );

    cardOpacity.value = withDelay(
      220,
      withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) })
    );
    cardTranslateY.value = withDelay(
      220,
      withSpring(0, { damping: 25, stiffness: 200 })
    );

    footerOpacity.value = withDelay(
      320,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) })
    );
    footerTranslateY.value = withDelay(
      320,
      withSpring(0, { damping: 25, stiffness: 200 })
    );
  }, [cardOpacity, cardTranslateY, footerOpacity, footerTranslateY, headerOpacity, headerTranslateY, iconOpacity, iconScale]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const footerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
    transform: [{ translateY: footerTranslateY.value }],
  }));

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
        <Animated.View
          style={[
            {
              backgroundColor: isDark
                ? `${habitAccent}25`
                : `${habitAccent}18`,
              borderColor: habitAccent,
            },
            iconAnimatedStyle,
          ]}
          className="w-20 h-20 rounded-full border-2 items-center justify-center mb-7"
        >
          <TickIcon size={38} color={habitAccent} />
        </Animated.View>

        <Animated.View style={[{ alignItems: 'center' }, headerAnimatedStyle]}>
          <Text className="text-3xl font-pbold text-center tracking-tight text-gray-900 dark:text-gray-100 mb-2.5">
            You&apos;re ready to begin.
          </Text>

          <Text className="text-sm font-pregular leading-5 text-center text-gray-500 dark:text-gray-400 max-w-[300px] mb-8">
            Your first habit is ready. Small actions become meaningful when you show up consistently.
          </Text>
        </Animated.View>

        <Animated.View
          style={[cardAnimatedStyle, { width: '100%', maxWidth: 340 }]}
          className="flex-row items-center p-4 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#1F2023] shadow-md shadow-black/5"
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

      <Animated.View
        style={footerAnimatedStyle}
        className="pb-8 w-full max-w-[360px] mx-auto gap-3"
      >
        <Button
          title="Continue with Google"
          variant="outline"
          size="lg"
          loading={isSubmitting}
          disabled={isSubmitting}
          onPress={onGoogleSignIn}
          leftIcon={<GoogleIcon size={20} />}
          className="w-full"
        />

        <Button
          title="Skip for now · Start tracking"
          variant="ghost"
          size="md"
          disabled={isSubmitting}
          onPress={onContinueAsGuest}
          className="w-full"
        />
      </Animated.View>
    </SafeAreaView>
  );
}
