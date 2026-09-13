export interface HabitColorDef {
    id: string;
    name: string;
    hex: string;
    accent: string;
    textLight: string;
    textDark: string;
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
        textLight: "#4655E0",
        textDark: "#818cf8",
        bg: "bg-indigo-50 dark:bg-indigo-900/30",
        text: "text-indigo-600 dark:text-indigo-300",
        border: "border-indigo-200 dark:border-indigo-800",
        pastelBg: "#4655E0",
        pastelBgDark: "#4655E0",
    },
    yellow: {
        id: "yellow",
        name: "Yellow",
        hex: "#f7cd63",
        accent: "#f7cd63",
        textLight: "#d97706",
        textDark: "#f7cd63",
        bg: "bg-amber-50 dark:bg-amber-900/30",
        text: "text-amber-600 dark:text-amber-300",
        border: "border-amber-200 dark:border-amber-800",
        pastelBg: "#f7cd63",
        pastelBgDark: "#f7cd63",
    },
    pink: {
        id: "pink",
        name: "Pink",
        hex: "#fc87c6",
        accent: "#fc87c6",
        textLight: "#db2777",
        textDark: "#fc87c6",
        bg: "bg-pink-50 dark:bg-pink-900/30",
        text: "text-pink-600 dark:text-pink-300",
        border: "border-pink-200 dark:border-pink-800",
        pastelBg: "#fc87c6",
        pastelBgDark: "#fc87c6",
    },
    blue: {
        id: "blue",
        name: "Blue",
        hex: "#a3c7fe",
        accent: "#a3c7fe",
        textLight: "#2563eb",
        textDark: "#93c5fd",
        bg: "bg-blue-50 dark:bg-blue-900/30",
        text: "text-blue-600 dark:text-blue-300",
        border: "border-blue-200 dark:border-blue-800",
        pastelBg: "#a3c7fe",
        pastelBgDark: "#a3c7fe",
    },
    green: {
        id: "green",
        name: "Green",
        hex: "#b8eb6c",
        accent: "#b8eb6c",
        textLight: "#65a30d",
        textDark: "#b8eb6c",
        bg: "bg-lime-50 dark:bg-lime-900/30",
        text: "text-lime-600 dark:text-lime-300",
        border: "border-lime-200 dark:border-lime-800",
        pastelBg: "#b8eb6c",
        pastelBgDark: "#b8eb6c",
    },
    orange: {
        id: "orange",
        name: "Orange",
        hex: "#ff8d4d",
        accent: "#ff8d4d",
        textLight: "#ea580c",
        textDark: "#ff8d4d",
        bg: "bg-orange-50 dark:bg-orange-900/30",
        text: "text-orange-600 dark:text-orange-300",
        border: "border-orange-200 dark:border-orange-800",
        pastelBg: "#ff8d4d",
        pastelBgDark: "#ff8d4d",
    },
    cyan: {
        id: "cyan",
        name: "Cyan",
        hex: "#aae8e7",
        accent: "#aae8e7",
        textLight: "#0891b2",
        textDark: "#67e8f9",
        bg: "bg-cyan-50 dark:bg-cyan-900/30",
        text: "text-cyan-600 dark:text-cyan-300",
        border: "border-cyan-200 dark:border-cyan-800",
        pastelBg: "#aae8e7",
        pastelBgDark: "#aae8e7",
    },
    red: {
        id: "red",
        name: "Red",
        hex: "#ff7979",
        accent: "#ff7979",
        textLight: "#dc2626",
        textDark: "#fca5a5",
        bg: "bg-red-50 dark:bg-red-900/30",
        text: "text-red-600 dark:text-red-300",
        border: "border-red-200 dark:border-red-800",
        pastelBg: "#ff7979",
        pastelBgDark: "#ff7979",
    },
};

export const PASTEL_PALETTE = Object.values(HABIT_COLORS);

export function getHabitColor(colorNameOrHex?: string | null): HabitColorDef {
    if (!colorNameOrHex) return HABIT_COLORS.purple;
    if (HABIT_COLORS[colorNameOrHex]) return HABIT_COLORS[colorNameOrHex];
    const found = Object.values(HABIT_COLORS).find(
        (c) => c.hex.toLowerCase() === colorNameOrHex.toLowerCase() || c.id === colorNameOrHex
    );
    return found || HABIT_COLORS.purple;
}

export function getContrastTextColor(colorHexOrName?: string | null): string {
    if (!colorHexOrName) return '#FFFFFF';
    const darkColors = ['#4655E0', 'purple', '#1C1C1E', '#11181C', '#000000', '#27272a', '#1F2023', '#232428', '#18191B'];
    if (darkColors.includes(colorHexOrName)) return '#FFFFFF';
    return '#1C1C1E';
}

export function getReadableAccentColor(colorNameOrHex?: string | null, isDark: boolean = false): string {
    const def = getHabitColor(colorNameOrHex);
    return isDark ? def.textDark : def.textLight;
}