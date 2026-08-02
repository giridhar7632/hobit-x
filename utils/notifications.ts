import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function requestNotificationPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    return finalStatus === 'granted';
}

export async function scheduleHabitNotification(
    habitName: string,
    notifyTimeISO: string,
    targetDays: number[]
) {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return [];

    const notifyDate = new Date(notifyTimeISO);
    const hour = notifyDate.getHours();
    const minute = notifyDate.getMinutes();

    const notificationIds = [];

    if (!targetDays || targetDays.length === 0) {
        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: "Time for your habit! 🌱",
                body: `It's time to: ${habitName}`,
                sound: true,
            },
            trigger: {
                hour,
                minute,
                repeats: true,
            } as Notifications.NotificationTriggerInput,
        });
        notificationIds.push(id);
        return notificationIds;
    }

    for (const day of targetDays) {
        const expoWeekday = day === 0 ? 1 : day + 1;

        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: "Time for your habit! 🌱",
                body: `It's time to: ${habitName}`,
                sound: true,
            },
            trigger: {
                weekday: expoWeekday,
                hour,
                minute,
                repeats: true,
            } as Notifications.NotificationTriggerInput,
        });
        notificationIds.push(id);
    }

    return notificationIds;
}