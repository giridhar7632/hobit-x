import { HABIT_COLORS } from '@/constants/habit-colors';
import { BellIcon, ClockIcon, FlameIcon, PlusIcon, TickIcon } from '@/constants/icons';
import { useColorScheme } from '@/hooks/use-color-scheme.web';
import { Text, TouchableOpacity, View } from 'react-native';

interface HabitCardProps {
    habit: any;
    onPress: () => void;
    onTrack: () => void;
    completedToday?: boolean;
}

export function HabitCard({ habit, onPress, onTrack, completedToday = false }: HabitCardProps) {
    const colorScheme = useColorScheme();
    const currentTheme = colorScheme === "dark" ? "dark" : "light";
    const theme = HABIT_COLORS[habit.color] || HABIT_COLORS.lime;

    const completedTime = habit.last_completed_date
        ? new Date(habit.last_completed_date.replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Today';

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            className="mb-3"
        >
            <View
                style={{
                    backgroundColor: currentTheme === 'dark' ? `${theme.accent}${completedToday ? '20' : '40'}` : `${theme.hex}${completedToday ? '60' : 'ff'}`,
                    borderColor: currentTheme === 'dark' ? `${theme.accent}40` : `${theme.accent}25`,
                    borderWidth: 1,
                }}
                className="rounded-2xl p-4 flex-row items-center"
            >
                <View
                    style={{ backgroundColor: theme.accent, opacity: completedToday ? 0.4 : 1 }}
                    className="w-1 h-10 rounded-full mr-4"
                />

                <View className="flex-1">
                    <Text
                        className={`text-base font-pbold ${theme.text}`}
                        style={completedToday ? { textDecorationLine: 'line-through', opacity: 0.5 } : undefined}
                        numberOfLines={1}
                    >
                        {habit.name}
                    </Text>

                    <View className="flex-row items-center mt-1 gap-4">
                        {completedToday ? (
                            <Text className={`text-xs font-pmedium opacity-70 ${theme.text}`}>
                                Completed at {completedTime}
                            </Text>
                        ) : (
                            <>
                                {habit.planned_time_minutes ? (
                                    <View className="flex-row items-center gap-1 opacity-60">
                                        <ClockIcon size={12} color={theme.accent} />
                                        <Text className={`text-xs font-pregular ${theme.text}`}>
                                            {habit.planned_time_minutes}m
                                        </Text>
                                    </View>
                                ) : null}

                                {habit.notify === 1 && habit.notify_time ? (
                                    <View className="flex-row items-center gap-1 opacity-60">
                                        <BellIcon size={12} color={theme.accent} />
                                        <Text className={`text-xs font-pregular ${theme.text}`}>
                                            {new Date(habit.notify_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                ) : null}

                                {habit.current_streak > 0 ? (
                                    <View className="flex-row items-center gap-1 opacity-70">
                                        <FlameIcon size={12} color={theme.accent} />
                                        <Text className={`text-xs font-pmedium ${theme.text}`}>
                                            {habit.current_streak}
                                        </Text>
                                    </View>
                                ) : null}
                            </>
                        )}
                    </View>
                </View>

                {completedToday ? (
                    <View
                        style={{ backgroundColor: `${theme.accent}20` }}
                        className="w-10 h-10 rounded-full items-center justify-center ml-3"
                    >
                        <TickIcon size={20} color={theme.accent} />
                    </View>
                ) : (
                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation();
                            onTrack();
                        }}
                        style={{ backgroundColor: theme.accent }}
                        className="w-10 h-10 rounded-full items-center justify-center ml-3"
                    >
                        <PlusIcon size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
}