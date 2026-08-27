import { useAppTheme } from '@/context/theme-context';
import { CustomAlert as Alert } from '@/utils/custom-alert';
import React, { useMemo } from 'react';
import { Dimensions, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

const { width } = Dimensions.get('window');
const WEEKS_TO_SHOW = 14;
const GAP_SIZE = 4;
const PADDING = 32;

const availableWidth = width - PADDING - (GAP_SIZE * (WEEKS_TO_SHOW - 1));
const SQUARE_SIZE = Math.floor(availableWidth / WEEKS_TO_SHOW);

const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
};

interface HeatmapDateEntry {
    date: string;
    status: string;
}

interface HeatmapProps {
    completedDates: HeatmapDateEntry[];
}

export default function Heatmap({ completedDates = [] }: HeatmapProps) {
    const { activeColor } = useAppTheme();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Build a lookup map for quick access
    const dateStatusMap = useMemo(() => {
        const map = new Map<string, string>();
        for (const entry of completedDates) {
            map.set(entry.date, entry.status);
        }
        return map;
    }, [completedDates]);

    const columns = useMemo(() => {
        const today = new Date();
        const daysData = [];

        for (let i = (WEEKS_TO_SHOW * 7) - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateString = formatDate(d);

            const status = dateStatusMap.get(dateString);

            daysData.push({
                dateString,
                displayDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                status: status || null,
            });
        }

        const weeks = [];
        for (let i = 0; i < daysData.length; i += 7) {
            weeks.push(daysData.slice(i, i + 7));
        }

        return weeks;
    }, [dateStatusMap]);

    const handleSquarePress = (day: any) => {
        if (day.status === 'Completed') {
            Alert.alert(day.displayDate, 'Completed');
        } else if (day.status === 'Skipped') {
            Alert.alert(day.displayDate, 'Skipped');
        } else {
            Alert.alert(day.displayDate, 'No activity');
        }
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
                            const isCompleted = day.status === 'Completed';
                            const isSkipped = day.status === 'Skipped';
                            const isActive = isCompleted || isSkipped;

                            let bgColor: string;
                            let borderColor: string;
                            let opacity = 1;

                            if (isCompleted) {
                                bgColor = activeColor.accent;
                                borderColor = 'transparent';
                                opacity = 1;
                            } else if (isSkipped) {
                                bgColor = `${activeColor.accent}25`;
                                borderColor = `${activeColor.accent}70`;
                                opacity = 1;
                            } else {
                                bgColor = isDark ? '#262626' : '#e5e5e5';
                                borderColor = 'transparent';
                                opacity = 0.4;
                            }

                            return (
                                <TouchableOpacity
                                    key={day.dateString}
                                    onPress={() => handleSquarePress(day)}
                                    style={{
                                        width: SQUARE_SIZE,
                                        height: SQUARE_SIZE,
                                        borderRadius: SQUARE_SIZE * 0.25,
                                        backgroundColor: bgColor,
                                        borderColor: borderColor,
                                        borderWidth: isSkipped ? 1 : 0,
                                        borderStyle: isSkipped ? 'dashed' : 'solid',
                                        opacity,
                                    }}
                                />
                            );
                        })}
                    </View>
                ))}
            </View>

            {/* Legend */}
            <View className="flex-row justify-end items-center px-4 mt-3 gap-2">
                <Text className="text-xs opacity-50 dark:text-neutral-400">Missed</Text>
                <View style={{ width: SQUARE_SIZE * 0.75, height: SQUARE_SIZE * 0.75 }} className="rounded-sm bg-neutral-200 dark:bg-neutral-800 opacity-40" />

                <View
                    style={{
                        width: SQUARE_SIZE * 0.75,
                        height: SQUARE_SIZE * 0.75,
                        backgroundColor: `${activeColor.accent}25`,
                        borderColor: `${activeColor.accent}70`,
                        borderWidth: 1,
                        borderStyle: 'dashed',
                    }}
                    className="rounded-sm"
                />
                <Text className="text-xs opacity-50 dark:text-neutral-400">Skipped</Text>

                <View style={{ width: SQUARE_SIZE * 0.75, height: SQUARE_SIZE * 0.75, backgroundColor: activeColor.accent }} className="rounded-sm" />
                <Text className="text-xs opacity-50 dark:text-neutral-400">Done</Text>
            </View>
        </View>
    );
}