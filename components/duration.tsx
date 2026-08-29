import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

interface DurationSelectorProps {
    value: string | number;
    onChange: (value: number) => void;
    accentColor: string;
}

const PRESET_DURATIONS = [5, 10, 15, 20, 30, 45, 60, 90, 120];

export function DurationSelector({ value, onChange, accentColor }: DurationSelectorProps) {
    const isDark = useColorScheme() === 'dark';
    const numericValue = Number(value) || 0;
    const isPreset = PRESET_DURATIONS.includes(numericValue);

    const [customText, setCustomText] = useState(
        isPreset ? '' : (numericValue > 0 ? String(numericValue) : '')
    );

    useEffect(() => {
        if (isPreset) {
            setCustomText('');
        } else if (numericValue > 0) {
            setCustomText(String(numericValue));
        } else {
            setCustomText('');
        }
    }, [value, isPreset, numericValue]);

    const handleSelect = (duration: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onChange(duration);
    };

    const handleCustomChange = (text: string) => {
        const clean = text.replace(/[^0-9]/g, '');
        setCustomText(clean);
        if (clean) {
            onChange(Number(clean));
        } else {
            onChange(0);
        }
    };

    const isCustomActive = !isPreset && numericValue > 0;

    return (
        <View className="flex-row flex-wrap gap-3 mt-2">
            {PRESET_DURATIONS.map((duration) => {
                const isSelected = isPreset && numericValue === duration;

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

            {/* Custom Input Chip */}
            <View
                className="flex-row items-center px-4 py-2.5 rounded-xl border"
                style={{
                    backgroundColor: isCustomActive
                        ? 'transparent'
                        : (isDark ? '#262626' : '#f5f5f5'),
                    borderColor: isCustomActive
                        ? accentColor
                        : (isDark ? '#404040' : '#e5e5e5'),
                    borderWidth: isCustomActive ? 2 : 1,
                    minWidth: 120,
                }}
            >
                <TextInput
                    keyboardType="numeric"
                    placeholder="Custom"
                    placeholderTextColor={isDark ? '#666666' : '#999999'}
                    value={customText}
                    onChangeText={handleCustomChange}
                    style={{
                        color: isDark ? '#ffffff' : '#171717',
                        fontFamily: 'Poppins-Medium',
                        fontSize: 16,
                        flex: 1,
                        padding: 0,
                    }}
                />
                <Text
                    className="font-pmedium text-sm opacity-55 ml-1.5"
                    style={{ color: isDark ? '#d4d4d4' : '#525252' }}
                >
                    min
                </Text>
            </View>
        </View>
    );
}