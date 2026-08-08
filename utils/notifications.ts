import * as Notifications from 'expo-notifications';

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
    trackedMinutesToday: number = 0
) {
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

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return [];

    const notifyDate = new Date(habit.notify_time);
    const hour = notifyDate.getHours();
    const minute = notifyDate.getMinutes();

    const targetDays = typeof habit.target_days === 'string'
        ? JSON.parse(habit.target_days)
        : (habit.target_days || []);

    const newIds = [];
    const progress = trackedMinutesToday / (habit.planned_time_minutes || 1);

    const WINDOW_DAYS = 7;

    for (let i = 0; i < WINDOW_DAYS; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        date.setHours(hour, minute, 0, 0);

        if (date.getTime() < Date.now()) continue;

        const dayOfWeek = date.getDay(); // 0 is Sunday
        const isTargetDay = targetDays.length === 0 || targetDays.includes(dayOfWeek);

        if (!isTargetDay) continue;

        let title = "Time for your habit! 🌱";
        let body = `It's time to: ${habit.name}`;

        if (i === 0) {
            if (progress >= 1) {
                continue;
            } else if (progress >= 0.5) {
                title = "You're halfway there! 🚀";
                body = `You've done 50% of ${habit.name}. Finish strong!`;
            }
        }

        const id = await Notifications.scheduleNotificationAsync({
            identifier: `habit-${habit.id || 'new'}-day-${i}`,
            content: { title, body, sound: true },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: date,
            },
        });
        newIds.push(id);
    }

    return newIds;
}

export async function scheduleTimerNotification(habitName: string, seconds: number) {
    const id = await Notifications.scheduleNotificationAsync({
        content: {
            title: "Timer Complete! 🎉",
            body: `Great job focusing on ${habitName}.`,
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: seconds
        },
    });

    return id;
}

export async function cancelScheduledNotification(notificationId: string | null) {
    if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
    }
}