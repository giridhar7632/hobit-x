import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const ENCOURAGING_MESSAGES = [
    "It's almost time for {habit}! A quick 5-minute heads up to get ready. ✨",
    "Your daily dose of progress: {habit} starts in 5 minutes! 🚀",
    "Small habits create big results. Ready for {habit}? 💪",
    "Your future self will thank you for doing {habit} today! 🌟",
    "5 minutes until {habit}. Take a deep breath and let's do this! 🌿",
    "Consistency is your superpower! Time to shine with {habit}. ⭐",
    "Friendly reminder: {habit} is coming up in 5 minutes. You've got this! 🎯",
    "Keep your streak alive! {habit} starts in just a few minutes. 🔥",
    "Time to invest in yourself: {habit} is up next in 5 minutes! ⏳",
    "Every session counts. Get ready for {habit}! 🏆",
    "A little progress each day adds up to big results. {habit} in 5 minutes! 📈",
    "Time to conquer the day! Get set for {habit}. ⚡",
    "Make today count! {habit} is scheduled in 5 minutes. 🌈",
    "Stay focused and build the momentum with {habit}! 💫",
    "You're doing amazing! Get ready for your {habit} session. 🎈",
];

export const NOTIFICATION_TITLES = [
    "Almost Time!",
    "Time to Focus!",
    "Habit Reminder",
    "Get Ready!",
    "Stay on Track!",
    "Keep Going!",
];

export function getRandomNotification(habitName: string): { title: string; body: string } {
    const randomBodyTemplate = ENCOURAGING_MESSAGES[Math.floor(Math.random() * ENCOURAGING_MESSAGES.length)];
    const randomTitle = NOTIFICATION_TITLES[Math.floor(Math.random() * NOTIFICATION_TITLES.length)];
    return {
        title: randomTitle,
        body: randomBodyTemplate.replace(/\{habit\}/g, habitName),
    };
}

export function parseNotifyTimes(notifyTime: string | null | undefined): string[] {
    if (!notifyTime) return [];
    try {
        const parsed = JSON.parse(notifyTime);
        if (Array.isArray(parsed)) {
            return parsed.filter(Boolean);
        }
    } catch (e) {
        // Single string format
    }
    return [notifyTime];
}

export function getHabitTotalReminders(habit: any): number {
    if (!habit || !habit.notify || !habit.notify_time) return 1;
    const times = parseNotifyTimes(habit.notify_time);
    return times.length > 0 ? times.length : 1;
}

export async function requestNotificationPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    return finalStatus === 'granted';
}

export async function refreshHabitNotifications(
    habit: any,
    trackedMinutesToday: number = 0,
    isCompletedToday: boolean = false
) {

    if (Platform.OS === 'web') return [];

    let oldIds = [];
    if (habit.notification_ids) {
        if (typeof habit.notification_ids === 'string') {
            try {
                oldIds = JSON.parse(habit.notification_ids);
            } catch (err) {
                oldIds = [];
            }
        } else if (Array.isArray(habit.notification_ids)) {
            oldIds = habit.notification_ids;
        }

        for (const id of oldIds) {
            if (typeof id === 'string') {
                try {
                    await Notifications.cancelScheduledNotificationAsync(id);
                } catch (cancelError) {
                    // Ignore individual cancellation failures on Android
                    console.warn(`Failed to cancel notification ${id}`, cancelError);
                }
            }
        }
    }

    if (!habit.notify || !habit.notify_time) return [];

    const notifyTimes = parseNotifyTimes(habit.notify_time);
    if (notifyTimes.length === 0) return [];

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return [];

    const targetDays = typeof habit.target_days === 'string'
        ? JSON.parse(habit.target_days)
        : (habit.target_days || []);

    const newIds: string[] = [];
    const progress = trackedMinutesToday / (habit.planned_time_minutes || 1);
    const todayISO = new Date().toISOString().split('T')[0];

    const isDoneToday = isCompletedToday || 
                        progress >= 1 || 
                        habit.last_completed_date?.startsWith(todayISO);

    const WINDOW_DAYS = 7;
    const ADVANCE_MINUTES = 5;

    for (let reminderIdx = 0; reminderIdx < notifyTimes.length; reminderIdx++) {
        const timeStr = notifyTimes[reminderIdx];
        const notifyDate = new Date(timeStr);
        if (isNaN(notifyDate.getTime())) continue;

        // Smart scheduling: Calculate trigger time 5 minutes before planned time
        const reminderTarget = new Date(notifyDate.getTime() - ADVANCE_MINUTES * 60 * 1000);
        const hour = reminderTarget.getHours();
        const minute = reminderTarget.getMinutes();

        for (let i = 0; i < WINDOW_DAYS; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            date.setHours(hour, minute, 0, 0);

            if (date.getTime() < Date.now()) continue;

            const dayOfWeek = date.getDay(); // 0 is Sunday
            const isTargetDay = targetDays.length === 0 || targetDays.includes(dayOfWeek);

            if (!isTargetDay) continue;

            let { title, body } = getRandomNotification(habit.name);

            if (i === 0) {
                if (isDoneToday) {
                    // Today's habit is completed/skipped — do NOT schedule a notification for today
                    continue;
                } else if (progress >= 0.5) {
                    title = "You're halfway there!";
                    body = `You've done 50% of ${habit.name}. Finish strong!`;
                }
            }

            const id = await Notifications.scheduleNotificationAsync({
                identifier: `habit-${habit.id || 'new'}-day-${i}-rem-${reminderIdx}`,
                content: { title, body, sound: true },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: date,
                },
            });
            newIds.push(id);
        }
    }

    return newIds;
}

export async function scheduleTimerNotification(habitName: string, seconds: number, title?: string, body?: string) {
    const id = await Notifications.scheduleNotificationAsync({
        content: {
            title: title || "Timer Complete!",
            body: body || `Great job focusing on ${habitName}.`,
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: Math.max(1, Math.round(seconds))
        },
    });

    return id;
}

export async function cancelScheduledNotification(notificationId: string | null) {
    if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
    }
}