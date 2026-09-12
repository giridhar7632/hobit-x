export interface HabitColorDef {
    id: string;
    name: string;
    hex: string;
    accent: string;
    bg: string;
    text: string;
    border: string;
    pastelBg: string;
    pastelBgDark: string;
}

export const HABIT_COLORS: Record<string, HabitColorDef> = {
    purple: {
        id: "purple",
        name: "Purple",
        hex: "#4655E0",
        accent: "#4655E0",
        bg: "bg-purple-100 dark:bg-purple-800/40",
        text: "text-purple-700 dark:text-purple-300",
        border: "border-purple-200 dark:border-purple-800",
        pastelBg: "#4655E0",
        pastelBgDark: "#4655E0",
    },
    yellow: {
        id: "yellow",
        name: "Yellow",
        hex: "#f7cd63",
        accent: "#f7cd63",
        bg: "bg-yellow-100 dark:bg-yellow-800/40",
        text: "text-yellow-700 dark:text-yellow-300",
        border: "border-yellow-200 dark:border-yellow-800",
        pastelBg: "#f7cd63",
        pastelBgDark: "#f7cd63",
    },
    pink: {
        id: "pink",
        name: "Pink",
        hex: "#fc87c6",
        accent: "#fc87c6",
        bg: "bg-pink-100 dark:bg-pink-800/40",
        text: "text-pink-700 dark:text-pink-300",
        border: "border-pink-200 dark:border-pink-800",
        pastelBg: "#fc87c6",
        pastelBgDark: "#fc87c6",
    },
    blue: {
        id: "blue",
        name: "Blue",
        hex: "#a3c7fe",
        accent: "#a3c7fe",
        bg: "bg-blue-100 dark:bg-blue-800/40",
        text: "text-blue-700 dark:text-blue-300",
        border: "border-blue-200 dark:border-blue-800",
        pastelBg: "#a3c7fe",
        pastelBgDark: "#a3c7fe",
    },
    green: {
        id: "green",
        name: "Green",
        hex: "#b8eb6c",
        accent: "#b8eb6c",
        bg: "bg-green-100 dark:bg-green-800/40",
        text: "text-green-700 dark:text-green-300",
        border: "border-green-200 dark:border-green-800",
        pastelBg: "#b8eb6c",
        pastelBgDark: "#b8eb6c",
    },
    orange: {
        id: "orange",
        name: "Orange",
        hex: "#ff8d4d",
        accent: "#ff8d4d",
        bg: "bg-orange-100 dark:bg-orange-800/40",
        text: "text-orange-700 dark:text-orange-300",
        border: "border-orange-200 dark:border-orange-800",
        pastelBg: "#ff8d4d",
        pastelBgDark: "#ff8d4d",
    },
    cyan: {
        id: "cyan",
        name: "Cyan",
        hex: "#aae8e7",
        accent: "#aae8e7",
        bg: "bg-cyan-100 dark:bg-cyan-800/40",
        text: "text-cyan-700 dark:text-cyan-300",
        border: "border-cyan-200 dark:border-cyan-800",
        pastelBg: "#aae8e7",
        pastelBgDark: "#aae8e7",
    },
    red: {
        id: "red",
        name: "Red",
        hex: "#ff7979",
        accent: "#ff7979",
        bg: "bg-red-100 dark:bg-red-800/40",
        text: "text-red-700 dark:text-red-300",
        border: "border-red-200 dark:border-red-800",
        pastelBg: "#ff7979",
        pastelBgDark: "#ff7979",
    },
};

export const PASTEL_PALETTE = Object.values(HABIT_COLORS);

export function getHabitColor(colorName?: string | null): HabitColorDef {
    if (!colorName) return HABIT_COLORS.purple;
    return HABIT_COLORS[colorName] || HABIT_COLORS.purple;
}

export function getContrastTextColor(colorHexOrName?: string | null): string {
    if (!colorHexOrName) return '#FFFFFF';
    const darkColors = ['#4655E0', 'purple', '#1C1C1E', '#11181C', '#000000', '#27272a', '#1F2023'];
    if (darkColors.includes(colorHexOrName)) return '#FFFFFF';
    return '#1C1C1E';
}