import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { TickIcon } from '@/constants/icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

const ChevronDownIcon = ({ color = '#a3a3a3', size = 20 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

interface Option {
    label: string;
    value: string;
}

interface CustomPickerProps {
    label: string;
    value: string;
    options: Option[];
    onValueChange: (value: string) => void;
    accentColor: string;
}

export function CustomActionSheetPicker({ label, value, options, onValueChange, accentColor }: CustomPickerProps) {
    const isDark = useColorScheme() === 'dark';
    const [visible, setVisible] = useState(false);

    // Find the label for the currently selected value
    const selectedLabel = options.find((opt) => opt.value === value)?.label || 'Select...';

    const handleSelect = (newValue: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onValueChange(newValue);
        setVisible(false);
    };

    const bgModal = isDark ? 'bg-black/60' : 'bg-black/40';
    const bgSheet = isDark ? 'bg-[#1c1c1e]' : 'bg-[#f2f2f7]'; // Exact iOS system background colors
    const bgCard = isDark ? 'bg-[#2c2c2e]' : 'bg-white';
    const textColor = isDark ? 'text-white' : 'text-black';
    const borderColor = isDark ? 'border-[#38383a]' : 'border-neutral-200';

    return (
        <>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setVisible(true);
                }}
                className={`flex-row items-center justify-between p-4 rounded-xl border ${borderColor} ${bgCard}`}
            >
                <Text className={`font-pmedium text-base ${textColor}`}>{selectedLabel}</Text>
                <ChevronDownIcon color={isDark ? '#a3a3a3' : '#737373'} />
            </TouchableOpacity>

            <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
                <View className={`flex-1 justify-end ${bgModal}`}>

                    <Pressable style={{ flex: 1 }} onPress={() => setVisible(false)} />

                    <View className={`w-full rounded-t-3xl pt-2 pb-10 px-4 ${bgSheet}`}>

                        <View className="items-center mb-4 mt-2">
                            <View className="w-12 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600 opacity-50" />
                        </View>

                        <View className="flex-row items-center justify-between mb-4 px-2">
                            <Text className={`text-xl font-psemibold ${textColor}`}>Select {label}</Text>
                            <TouchableOpacity onPress={() => setVisible(false)}>
                                <Text style={{ color: accentColor }} className="font-psemibold text-base">Done</Text>
                            </TouchableOpacity>
                        </View>

                        <View className={`rounded-2xl overflow-hidden ${bgCard}`}>
                            {options.map((option, index) => {
                                const isSelected = option.value === value;
                                const isLast = index === options.length - 1;

                                return (
                                    <TouchableOpacity
                                        key={option.value}
                                        activeOpacity={0.7}
                                        onPress={() => handleSelect(option.value)}
                                        className={`flex-row items-center justify-between p-4 ${!isLast ? `border-b ${borderColor}` : ''}`}
                                    >
                                        <Text
                                            className="font-pmedium text-base"
                                            style={{ color: isSelected ? accentColor : (isDark ? '#ffffff' : '#000000') }}
                                        >
                                            {option.label}
                                        </Text>

                                        {isSelected && (
                                            <TickIcon size={20} color={accentColor} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                    </View>
                </View>
            </Modal>
        </>
    );
}