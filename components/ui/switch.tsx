import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Switch, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

interface CustomSwitchProps {
    value: boolean;
    onValueChange: (value: boolean) => void;
    activeColor?: string;
}

export function CustomSwitch({ value, onValueChange, activeColor = '#4655E0' }: CustomSwitchProps) {
    const isDark = useColorScheme() === 'dark';
    const inactiveTrack = isDark ? '#39393d' : '#e9e9eb';

    const handleToggle = (val: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onValueChange(val);
    };

    return (
        <View style={{ transform: [{ scale: Platform.OS === 'ios' ? 0.92 : 1 }] }}>
            <Switch
                value={value}
                onValueChange={handleToggle}
                trackColor={{
                    false: inactiveTrack,
                    true: activeColor,
                }}
                thumbColor={Platform.OS === 'android' ? (value ? activeColor : '#f4f3f4') : '#ffffff'}
                ios_backgroundColor={inactiveTrack}
            />
        </View>
    );
}