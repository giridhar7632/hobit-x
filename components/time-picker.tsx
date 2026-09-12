import { getContrastTextColor } from '@/constants/habit-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useState } from 'react';
import { Keyboard, Modal, Text, TouchableOpacity, View } from 'react-native';

interface CustomTimePickerProps {
    visible: boolean;
    onClose: () => void;
    initialTime: Date;
    onSave: (date: Date) => void;
    accentColor: string;
}

interface TimePickerModalContentProps {
    onClose: () => void;
    initialTime: Date;
    onSave: (date: Date) => void;
    accentColor: string;
}

function TimePickerModalContent({ onClose, initialTime, onSave, accentColor }: TimePickerModalContentProps) {
    const isDark = useColorScheme() === 'dark';
    const contrastTextColor = getContrastTextColor(accentColor);

    const [activeTab, setActiveTab] = useState<'hour' | 'minute'>('hour');

    const [hour, setHour] = useState(() => initialTime.getHours() % 12 || 12);
    const [minute, setMinute] = useState(() => initialTime.getMinutes());
    const [period, setPeriod] = useState<'AM' | 'PM'>(() => initialTime.getHours() >= 12 ? 'PM' : 'AM');

    const hourStr = hour.toString();
    const minuteStr = minute.toString().padStart(2, '0');

    const handleSave = () => {
        const newDate = new Date(initialTime);
        let finalHour = hour;

        if (period === 'PM' && finalHour !== 12) finalHour += 12;
        if (period === 'AM' && finalHour === 12) finalHour = 0;

        newDate.setHours(finalHour, minute, 0, 0);
        onSave(newDate);
        onClose();
    };

    const hoursGrid = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutesGrid = Array.from({ length: 12 }, (_, i) => i * 5);

    const bgModal = isDark ? 'bg-black/60' : 'bg-black/40';
    const bgCard = isDark ? 'bg-neutral-900' : 'bg-white';
    const textColor = isDark ? 'text-white' : 'text-black';
    const mutedText = isDark ? 'text-neutral-500' : 'text-neutral-400';

    return (
        <View className={`flex-1 justify-center items-center px-4 ${bgModal}`}>
            <View className={`w-full max-w-sm rounded-3xl p-6 ${bgCard}`}>

                    <Text className={`text-lg font-pbold mb-6 ${textColor}`}>Set Time</Text>

                    <View className="flex-row justify-center items-center mb-8 gap-2">

                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => setActiveTab('hour')}
                            className="items-center justify-center rounded-2xl w-20 h-20"
                            style={{ backgroundColor: activeTab === 'hour' ? `${accentColor}20` : (isDark ? '#262626' : '#f5f5f5') }}
                        >
                            <Text
                                className="text-center font-pbold"
                                style={{
                                    color: activeTab === 'hour' ? accentColor : (isDark ? 'white' : 'black'),
                                    fontSize: 32
                                }}
                            >
                                {hourStr}
                            </Text>
                        </TouchableOpacity>

                        <Text
                            className={`font-pbold text-4xl ${mutedText}`}
                            style={{ includeFontPadding: false, textAlignVertical: 'center' }}
                        >
                            :
                        </Text>

                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => setActiveTab('minute')}
                            className="items-center justify-center rounded-2xl w-20 h-20"
                            style={{ backgroundColor: activeTab === 'minute' ? `${accentColor}20` : (isDark ? '#262626' : '#f5f5f5') }}
                        >
                            <Text
                                className="text-center font-pbold"
                                style={{
                                    color: activeTab === 'minute' ? accentColor : (isDark ? 'white' : 'black'),
                                    fontSize: 32
                                }}
                            >
                                {minuteStr}
                            </Text>
                        </TouchableOpacity>

                        <View className="ml-2 gap-2">
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => { setPeriod('AM'); Keyboard.dismiss(); }}
                                className="px-3.5 py-2 rounded-xl"
                                style={{ backgroundColor: period === 'AM' ? accentColor : (isDark ? '#262626' : '#f5f5f5') }}
                            >
                                <Text
                                    className="font-pbold text-sm"
                                    style={{ color: period === 'AM' ? contrastTextColor : (isDark ? '#737373' : '#a3a3a3') }}
                                >
                                    AM
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => { setPeriod('PM'); Keyboard.dismiss(); }}
                                className="px-3.5 py-2 rounded-xl"
                                style={{ backgroundColor: period === 'PM' ? accentColor : (isDark ? '#262626' : '#f5f5f5') }}
                            >
                                <Text
                                    className="font-pbold text-sm"
                                    style={{ color: period === 'PM' ? contrastTextColor : (isDark ? '#737373' : '#a3a3a3') }}
                                >
                                    PM
                                </Text>
                            </TouchableOpacity>
                        </View>

                    </View>

                    <View className="flex-row flex-wrap justify-between gap-y-4">
                        {(activeTab === 'hour' ? hoursGrid : minutesGrid).map((item) => {
                            const isSelected = activeTab === 'hour' ? hour === item : minute === item;
                            const displayValue = activeTab === 'hour' ? item : item.toString().padStart(2, '0');

                            return (
                                <TouchableOpacity
                                    key={item}
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        Keyboard.dismiss();

                                        if (activeTab === 'hour') {
                                            setHour(item);
                                            setActiveTab('minute');
                                        } else {
                                            setMinute(item);
                                        }
                                    }}
                                    className="w-[22%] aspect-square rounded-2xl items-center justify-center"
                                    style={{ backgroundColor: isSelected ? accentColor : 'transparent' }}
                                >
                                    <Text
                                        className={`text-lg m-auto ${isSelected ? 'font-pbold' : 'font-pmedium'}`}
                                        style={{ color: isSelected ? contrastTextColor : (isDark ? '#d4d4d4' : '#404040') }}
                                    >
                                        {displayValue}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <View className="flex-row justify-end items-center mt-8 gap-3">
                        <TouchableOpacity activeOpacity={0.7} onPress={onClose} className="px-4 py-2.5 rounded-xl">
                            <Text className={`font-psemibold ${mutedText}`}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleSave}
                            style={{ backgroundColor: accentColor }}
                            className="px-5 py-2.5 rounded-xl shadow-sm"
                        >
                            <Text className="font-pbold text-sm" style={{ color: contrastTextColor }}>
                                Save Time
                            </Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
    );
}

export function CustomTimePicker({ visible, onClose, initialTime, onSave, accentColor }: CustomTimePickerProps) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            {visible && (
                <TimePickerModalContent
                    onClose={onClose}
                    initialTime={initialTime}
                    onSave={onSave}
                    accentColor={accentColor}
                />
            )}
        </Modal>
    );
}