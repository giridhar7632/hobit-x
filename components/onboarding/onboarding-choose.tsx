import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HabitTemplatePicker } from '@/components/create/habit-template-picker';
import { HabitTemplate } from '@/constants/habit-templates';
import { ChevronIcon } from '@/constants/icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface OnboardingChooseProps {
  onSelectTemplate: (template: HabitTemplate) => void;
  onSelectCustom: () => void;
  onBack: () => void;
  accentColor?: string;
}

export function OnboardingChoose({
  onSelectTemplate,
  onSelectCustom,
  onBack,
  accentColor = '#4655E0',
}: OnboardingChooseProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? '#141517' : '#FAF9F6';
  const textColor = isDark ? '#F4F4F6' : '#18191B';

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ backgroundColor: bgColor }}
      className="flex-1"
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Back Navigation & Header */}
        <View className="mb-6">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              Haptics.selectionAsync();
              onBack();
            }}
            className="w-10 h-10 rounded-full items-center justify-center border border-black/5 dark:border-white/10 bg-white dark:bg-[#1F2023] mb-4 shadow-sm shadow-black/5"
          >
            <ChevronIcon direction="left" size={18} color={textColor} />
          </TouchableOpacity>

          <Text className="text-3xl leading-9 font-pbold tracking-tight text-neutral-900 dark:text-neutral-100 mb-2">
            Choose your first habit
          </Text>
          <Text className="text-sm leading-5 font-pregular text-neutral-500 dark:text-neutral-400 max-w-[320px]">
            Pick one to get started, or create your own ritual from scratch.
          </Text>
        </View>

        {/* Reusable Template Picker Component */}
        <HabitTemplatePicker
          onSelectTemplate={onSelectTemplate}
          onSelectCustom={onSelectCustom}
          accentColor={accentColor}
          showCustomOption={true}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
