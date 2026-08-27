import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
    interpolate,
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

interface CustomSwitchProps {
    value: boolean;
    onValueChange: (value: boolean) => void;
    activeColor: string;
}

const SWITCH_WIDTH = 50;
const SWITCH_HEIGHT = 30;
const THUMB_SIZE = 26;
const PADDING = 2;
const TRAVEL_DISTANCE = SWITCH_WIDTH - THUMB_SIZE - PADDING * 2; // 20px

export function CustomSwitch({ value, onValueChange, activeColor }: CustomSwitchProps) {
    const isDark = useColorScheme() === 'dark';

    const inactiveColor = isDark ? '#39393d' : '#e9e9eb';

    const progress = useSharedValue(value ? 1 : 0);

    useEffect(() => {
        progress.value = withSpring(value ? 1 : 0, {
            mass: 1,
            damping: 15,
            stiffness: 120,
            overshootClamping: false,
        });
    }, [value]);

    const toggleSwitch = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onValueChange(!value);
    };

    const trackAnimatedStyle = useAnimatedStyle(() => {
        return {
            backgroundColor: interpolateColor(
                progress.value,
                [0, 1],
                [inactiveColor, activeColor]
            ),
        };
    });

    const thumbAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateX: interpolate(progress.value, [0, 1], [PADDING, PADDING + TRAVEL_DISTANCE]),
                },
            ],
        };
    });

    return (
        <Pressable onPress={toggleSwitch} hitSlop={10}>
            <Animated.View
                style={[
                    styles.track,
                    trackAnimatedStyle,
                ]}
            >
                <Animated.View
                    style={[
                        styles.thumb,
                        thumbAnimatedStyle,
                    ]}
                />
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    track: {
        width: SWITCH_WIDTH,
        height: SWITCH_HEIGHT,
        borderRadius: SWITCH_HEIGHT / 2,
        justifyContent: 'center',
    },
    thumb: {
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: THUMB_SIZE / 2,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2.5,
        elevation: 4,
    },
});