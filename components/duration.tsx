import * as Haptics from 'expo-haptics';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme.web'; // Adjust if needed

interface DurationSelectorProps {
    value: string | number;
    onChange: (value: number) => void;
    accentColor: string;
}

const PRESET_DURATIONS = [5, 10, 15, 20, 30, 45, 60, 90, 120];

export function DurationSelector({ value, onChange, accentColor }: DurationSelectorProps) {
    const isDark = useColorScheme() === 'dark';
    const numericValue = Number(value) || 0;

    const handleSelect = (duration: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onChange(duration);
    };

    return (
        <View className="flex-row flex-wrap gap-3 mt-2">
            {PRESET_DURATIONS.map((duration) => {
                const isSelected = numericValue === duration;

                return (
                    <TouchableOpacity
                        key={duration}
                        activeOpacity={0.7}
                        onPress={() => handleSelect(duration)}
                        className={`px-4 py-2.5 rounded-xl border`}
                        style={{
                            backgroundColor: isSelected
                                ? accentColor
                                : (isDark ? '#262626' : '#f5f5f5'),
                            borderColor: isSelected
                                ? accentColor
                                : (isDark ? '#404040' : '#e5e5e5'),
                        }}
                    >
                        <Text
                            className="font-pmedium text-base"
                            style={{
                                color: isSelected
                                    ? '#ffffff'
                                    : (isDark ? '#d4d4d4' : '#525252'),
                            }}
                        >
                            {duration >= 60
                                ? duration === 60 ? '1 hr' : `${duration / 60} hr`
                                : `${duration} min`}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}