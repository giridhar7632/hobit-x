import React, { useEffect } from 'react';
import { Animated, Text, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

interface StepProgressHeaderProps {
  currentStep: number;
  totalSteps?: number;
  title: string;
  subtitle: string;
  accentColor?: string;
}

export function StepProgressHeader({
  currentStep,
  totalSteps = 4,
  title,
  subtitle,
  accentColor = '#4655E0',
}: StepProgressHeaderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const clampedStep = Math.min(Math.max(currentStep, 1), totalSteps);
  const targetPercent = (clampedStep / totalSteps) * 100;

  const [animatedPercent] = React.useState(() => new Animated.Value(targetPercent));

  useEffect(() => {
    Animated.timing(animatedPercent, {
      toValue: targetPercent,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [targetPercent, animatedPercent]);

  const width = animatedPercent.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const trackBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <View className="px-5 pt-2 pb-4">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs font-psemibold tracking-wider text-gray-500 dark:text-gray-400">
          Step {clampedStep} of {totalSteps}
        </Text>
      </View>

      <View style={{ backgroundColor: trackBg }} className="h-1.5 rounded-full overflow-hidden mb-5">
        <Animated.View
          style={{
            backgroundColor: accentColor,
            width,
            height: '100%',
            borderRadius: 9999,
          }}
        />
      </View>

      <View className="gap-1">
        <Text className="text-2xl font-pbold tracking-tight text-gray-900 dark:text-gray-100">
          {title}
        </Text>
        <Text className="text-sm font-pregular leading-5 text-gray-500 dark:text-gray-400">
          {subtitle}
        </Text>
      </View>
    </View>
  );
}
