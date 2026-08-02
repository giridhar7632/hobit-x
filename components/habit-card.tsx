import { HABIT_COLORS } from '@/constants/habit-colors';
import { Text, TouchableOpacity, View } from 'react-native';

interface HabitCardProps {
    habit: any;
    onPress: () => void;
    onTrack: () => void;
    completedToday?: boolean;
}

export function HabitCard({ habit, onPress, onTrack, completedToday = false }: HabitCardProps) {
    const theme = HABIT_COLORS[habit.color] || HABIT_COLORS.lime;

    // Safely extract the time if last_completed_date exists
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
                    backgroundColor: `${theme.hex}${completedToday ? '60' : 'ff'}`,
                    borderColor: `${theme.accent}25`,
                    borderWidth: 1,
                }}
                className="rounded-2xl p-4 flex-row items-center"
            >
                {/* Left accent bar */}
                <View
                    style={{ backgroundColor: theme.accent, opacity: completedToday ? 0.4 : 1 }}
                    className="w-1 h-10 rounded-full mr-4"
                />

                {/* Content */}
                <View className="flex-1">
                    <Text
                        className={`text-base font-pbold ${theme.text}`}
                        style={completedToday ? { textDecorationLine: 'line-through', opacity: 0.5 } : undefined}
                        numberOfLines={1}
                    >
                        {habit.name}
                    </Text>

                    <View className="flex-row items-center mt-1 gap-3">
                        {completedToday ? (
                            <Text className={`text-xs font-pmedium opacity-70 ${theme.text}`}>
                                Completed at {completedTime}
                            </Text>
                        ) : (
                            <>
                                {habit.planned_time_minutes ? (
                                    <Text className={`text-xs font-pregular opacity-60 ${theme.text}`}>
                                        ⏱ {habit.planned_time_minutes}m
                                    </Text>
                                ) : null}
                                {habit.notify === 1 && habit.notify_time ? (
                                    <Text className={`text-xs font-pregular opacity-60 ${theme.text}`}>
                                        🔔 {new Date(habit.notify_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                ) : null}
                                {habit.current_streak > 0 && (
                                    <Text className={`text-xs font-pmedium opacity-70 ${theme.text}`}>
                                        🔥 {habit.current_streak}
                                    </Text>
                                )}
                            </>
                        )}
                    </View>
                </View>

                {/* Track / Done button */}
                {completedToday ? (
                    <View
                        style={{ backgroundColor: `${theme.accent}20` }}
                        className="w-10 h-10 rounded-full items-center justify-center ml-3"
                    >
                        <Text style={{ color: theme.accent }} className="text-lg font-pbold">✓</Text>
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
                        <Text className="text-white text-lg font-bold">+</Text>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
}