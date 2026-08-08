import { useAppTheme } from '@/context/theme-context';
import React, { useMemo } from 'react';
import { Dimensions, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { CustomAlert as Alert } from '@/utils/custom-alert';
import { ThemedText } from './themed-text';

const { width } = Dimensions.get('window');
const WEEKS_TO_SHOW = 14;
const GAP_SIZE = 4;
const PADDING = 32;

const availableWidth = width - PADDING - (GAP_SIZE * (WEEKS_TO_SHOW - 1));
const SQUARE_SIZE = Math.floor(availableWidth / WEEKS_TO_SHOW);

const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
};

interface HeatmapProps {
    completedDates: string[];
}

export default function Heatmap({ completedDates = [] }: HeatmapProps) {
    const { activeColor } = useAppTheme();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const columns = useMemo(() => {
        const today = new Date();
        const daysData = [];

        for (let i = (WEEKS_TO_SHOW * 7) - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateString = formatDate(d);

            daysData.push({
                dateString,
                displayDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                completed: completedDates.includes(dateString),
            });
        }

        const weeks = [];
        for (let i = 0; i < daysData.length; i += 7) {
            weeks.push(daysData.slice(i, i + 7));
        }

        return weeks;
    }, [completedDates]);

    const handleSquarePress = (day: any) => {
        const status = day.completed ? 'Completed 🎉' : 'Missed';
        Alert.alert(day.displayDate, status);
    };

    return (
        <View className="w-full">
            <View
                className="flex-row px-4"
                style={{ gap: GAP_SIZE, justifyContent: 'center' }}
            >
                {columns.map((week, weekIndex) => (
                    <View key={weekIndex} style={{ gap: GAP_SIZE }}>
                        {week.map((day) => {
                            const isActive = day.completed;

                            return (
                                <TouchableOpacity
                                    key={day.dateString}
                                    onPress={() => handleSquarePress(day)}
                                    style={{
                                        width: SQUARE_SIZE,
                                        height: SQUARE_SIZE,
                                        borderRadius: SQUARE_SIZE * 0.25,
                                        backgroundColor: isActive
                                            ? activeColor.accent
                                            : (isDark ? '#262626' : '#e5e5e5'),
                                        borderColor: isActive ? 'transparent' : activeColor.hex,
                                        borderWidth: isActive ? 0 : 0.5,
                                    }}
                                    className={`${isActive ? 'opacity-100' : 'opacity-40'}`}
                                />
                            );
                        })}
                    </View>
                ))}
            </View>

            {/* Legend */}
            <View className="flex-row justify-end items-center px-4 mt-3 gap-2">
                <Text className="text-xs opacity-50 dark:text-neutral-400">Less</Text>
                <View style={{ width: SQUARE_SIZE * 0.75, height: SQUARE_SIZE * 0.75 }} className="rounded-sm bg-neutral-200 dark:bg-neutral-800 opacity-40" />
                <View style={{ width: SQUARE_SIZE * 0.75, height: SQUARE_SIZE * 0.75, backgroundColor: activeColor.accent }} className="rounded-sm opacity-50" />
                <View style={{ width: SQUARE_SIZE * 0.75, height: SQUARE_SIZE * 0.75, backgroundColor: activeColor.accent }} className="rounded-sm" />
                <Text className="text-xs opacity-50 dark:text-neutral-400">More</Text>
            </View>
        </View>
    );
}