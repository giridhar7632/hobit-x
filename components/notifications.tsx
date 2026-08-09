import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { CustomAlert as Alert } from "@/utils/custom-alert";
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatRelative } from 'date-fns';

export default function DebugNotificationsScreen() {
    const [scheduled, setScheduled] = useState<Notifications.NotificationRequest[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchNotifications = async () => {
        setIsRefreshing(true);
        try {
            const notifs = await Notifications.getAllScheduledNotificationsAsync();
            setScheduled(notifs);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleCancelAll = async () => {
        Alert.alert(
            "Wipe All?",
            "This will cancel every scheduled notification on this device.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Wipe",
                    style: "destructive",
                    onPress: async () => {
                        await Notifications.cancelAllScheduledNotificationsAsync();
                        fetchNotifications();
                    }
                }
            ]
        );
    };

    const handleCancelSingle = async (id: string) => {
        await Notifications.cancelScheduledNotificationAsync(id);
        fetchNotifications();
    };

    // Safely format the trigger so we can read when it will fire
    const formatTrigger = (trigger: any) => {
        if (!trigger) return "Unknown";
        
        try {
            // Handle Timestamp / Date triggers
            if (trigger.type === 'date' || (trigger.value && typeof trigger.value === 'number')) {
                const dateValue = trigger.value || trigger.date;
                if (dateValue) {
                    return `Scheduled: ${new Date(dateValue).toLocaleString()}`;
                }
            }

            // Handle Daily triggers
            if (trigger.type === 'daily' || (trigger.hour !== undefined && trigger.minute !== undefined && trigger.type !== 'calendar')) {
                const h = trigger.hour?.toString().padStart(2, '0') || '00';
                const m = trigger.minute?.toString().padStart(2, '0') || '00';
                return `Daily at ${h}:${m}`;
            }

            // Handle Calendar triggers (iOS usually)
            if (trigger.type === 'calendar' && trigger.dateComponents) {
                const { year, month, day, hour, minute } = trigger.dateComponents;
                const datePart = [year, month, day].filter(Boolean).join('-');
                const hStr = hour !== undefined ? hour.toString().padStart(2, '0') : '';
                const mStr = minute !== undefined ? minute.toString().padStart(2, '0') : '';
                const timePart = hStr && mStr ? `${hStr}:${mStr}` : (hStr || mStr);
                
                if (datePart && timePart) return `Calendar: ${datePart} @ ${timePart}`;
                if (datePart) return `Calendar: ${datePart}`;
                if (timePart) return `Daily at ${timePart}`;
            }

            // Handle TimeInterval triggers
            if (trigger.type === 'timeInterval' && trigger.seconds) {
                if (trigger.repeats) {
                    return `Every ${Math.round(trigger.seconds)} seconds`;
                } else {
                    const approximateDate = new Date(Date.now() + trigger.seconds * 1000);
                    const relativeStr = formatRelative(approximateDate, new Date());
                    return relativeStr.charAt(0).toUpperCase() + relativeStr.slice(1);
                }
            }
        } catch (e) {
            // Fallback to JSON
        }

        return JSON.stringify(trigger, null, 2);
    };

    return (
        <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-neutral-900">
            <Stack.Screen options={{ title: 'Notification Queue', headerRight: () => null }} />

            <View className="flex-row justify-between items-center p-4 border-b border-neutral-200 dark:border-neutral-800">
                <Text className="text-lg font-pbold text-neutral-800 dark:text-neutral-100">
                    Total Queued: {scheduled.length}
                </Text>
                <View className="flex-row gap-2">
                    <TouchableOpacity
                        onPress={fetchNotifications}
                        className="bg-blue-500 px-3 py-2 rounded-lg"
                    >
                        <Text className="text-white font-psemibold text-xs">{isRefreshing ? '...' : 'Refresh'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleCancelAll}
                        className="bg-red-500 px-3 py-2 rounded-lg"
                    >
                        <Text className="text-white font-psemibold text-xs">Wipe All</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
                {scheduled.length === 0 ? (
                    <View className="items-center mt-10">
                        <Text className="text-neutral-500 font-pregular">Queue is completely empty.</Text>
                    </View>
                ) : (
                    scheduled.map((notif) => (
                        <View
                            key={notif.identifier}
                            className="bg-white dark:bg-neutral-800 p-4 rounded-2xl mb-4 border border-neutral-200 dark:border-neutral-700 shadow-sm"
                        >
                            <View className="flex-row justify-between items-start mb-2">
                                <Text className="font-pbold text-lg text-neutral-800 dark:text-neutral-100 flex-1">
                                    {notif.content.title || 'No Title'}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => handleCancelSingle(notif.identifier)}
                                    className="bg-neutral-200 dark:bg-neutral-700 px-2 py-1 rounded-md ml-2"
                                >
                                    <Text className="text-red-500 font-pbold text-xs">X</Text>
                                </TouchableOpacity>
                            </View>

                            <Text className="text-neutral-600 dark:text-neutral-400 font-pregular mb-3">
                                {notif.content.body || 'No Body'}
                            </Text>

                            <View className="bg-neutral-50 dark:bg-neutral-900 p-3 rounded-xl">
                                <Text className="text-xs font-psemibold text-neutral-500 mb-1">OS TRIGGER TIME:</Text>
                                <Text className="text-xs font-mono text-neutral-800 dark:text-neutral-200">
                                    {formatTrigger(notif.trigger)}
                                </Text>

                                <Text className="text-xs font-psemibold text-neutral-500 mt-3 mb-1">IDENTIFIER:</Text>
                                <Text className="text-xs font-mono text-neutral-800 dark:text-neutral-200">
                                    {notif.identifier}
                                </Text>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}