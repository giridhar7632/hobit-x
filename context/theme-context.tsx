import { HABIT_COLORS } from '@/constants/habit-colors';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type HabitColor = typeof HABIT_COLORS[keyof typeof HABIT_COLORS];

interface ThemeContextValue {
    activeColor: HabitColor;
    setActiveColor: (colorId: string) => void;
    resetColor: () => void;
}

const DEFAULT_COLOR = HABIT_COLORS.lime;

const ThemeContext = createContext<ThemeContextValue>({
    activeColor: DEFAULT_COLOR,
    setActiveColor: () => { },
    resetColor: () => { },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [activeColor, setActiveColorState] = useState<HabitColor>(DEFAULT_COLOR);

    const setActiveColor = useCallback((colorId: string) => {
        const color = HABIT_COLORS[colorId];
        if (color) {
            setActiveColorState(color);
        }
    }, []);

    const resetColor = useCallback(() => {
        setActiveColorState(DEFAULT_COLOR);
    }, []);

    const value = useMemo(() => ({
        activeColor,
        setActiveColor,
        resetColor,
    }), [activeColor, setActiveColor, resetColor]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useAppTheme() {
    return useContext(ThemeContext);
}
