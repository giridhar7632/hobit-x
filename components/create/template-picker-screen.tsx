import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { HabitTemplatePicker } from '@/components/create/habit-template-picker';
import { HabitTemplate } from '@/constants/habit-templates';
import { ChevronIcon } from '@/constants/icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface TemplatePickerScreenProps {
  onSelectTemplate: (template: HabitTemplate) => void;
  onSelectCustom: () => void;
  onBack?: () => void;
  accentColor?: string;
}

export function TemplatePickerScreen({
  onSelectTemplate,
  onSelectCustom,
  onBack,
  accentColor = '#4655E0',
}: TemplatePickerScreenProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const textColor = isDark ? '#ECEDEE' : '#11181C';

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="mb-5">
        {onBack && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack}
            className="w-10 h-10 rounded-full items-center justify-center border border-black/5 dark:border-white/10 bg-white dark:bg-[#1F2023] mb-3 shadow-sm shadow-black/5"
          >
            <ChevronIcon direction="left" size={18} color={textColor} />
          </TouchableOpacity>
        )}
        <Text className="text-3xl leading-9 font-pbold tracking-tight text-neutral-900 dark:text-neutral-100 mb-2">
          Let's build a new habit
        </Text>
        <Text className="text-sm leading-5 font-pregular text-neutral-500 dark:text-neutral-400 max-w-[320px]">
          Start with your own goal or pick from our curated rituals.
        </Text>
      </View>

      {/* Reusable Template Picker */}
      <HabitTemplatePicker
        onSelectTemplate={onSelectTemplate}
        onSelectCustom={onSelectCustom}
        accentColor={accentColor}
        showCustomOption={true}
      />
    </ScrollView>
  );
}
