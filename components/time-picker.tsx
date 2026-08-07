import { useColorScheme } from '@/hooks/use-color-scheme.web'; // Adjust import as needed
import React, { useEffect, useState } from 'react';
import { Keyboard, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface CustomTimePickerProps {
    visible: boolean;
    onClose: () => void;
    initialTime: Date;
    onSave: (date: Date) => void;
    accentColor: string;
}

export function CustomTimePicker({ visible, onClose, initialTime, onSave, accentColor }: CustomTimePickerProps) {
    const isDark = useColorScheme() === 'dark';

    const [activeTab, setActiveTab] = useState<'hour' | 'minute'>('hour');

    const [hour, setHour] = useState(initialTime.getHours() % 12 || 12);
    const [minute, setMinute] = useState(initialTime.getMinutes());
    const [period, setPeriod] = useState<'AM' | 'PM'>(initialTime.getHours() >= 12 ? 'PM' : 'AM');

    const [hourStr, setHourStr] = useState(hour.toString());
    const [minuteStr, setMinuteStr] = useState(minute.toString().padStart(2, '0'));

    useEffect(() => { setHourStr(hour.toString()); }, [hour]);
    useEffect(() => { setMinuteStr(minute.toString().padStart(2, '0')); }, [minute]);

    useEffect(() => {
        if (visible) {
            setHour(initialTime.getHours() % 12 || 12);
            setMinute(initialTime.getMinutes());
            setPeriod(initialTime.getHours() >= 12 ? 'PM' : 'AM');
            setActiveTab('hour');
        }
    }, [visible, initialTime]);

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
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View className={`flex-1 justify-center items-center px-4 ${bgModal}`}>
                <View className={`w-full max-w-sm rounded-3xl p-6 ${bgCard}`}>

                    <Text className={`text-lg font-psemibold mb-6 ${textColor}`}>Set Time</Text>

                    {/* ─── HUGE TIME DISPLAY ─────────────────────────────────── */}
                    <View className="flex-row justify-center items-center mb-8 gap-2">

                        {/* Hour Input Box */}
                        <View
                            className="items-center justify-center rounded-2xl w-20 h-20 overflow-hidden"
                            style={{ backgroundColor: activeTab === 'hour' ? `${accentColor}20` : (isDark ? '#262626' : '#f5f5f5') }}
                        >
                            <TextInput
                                value={hourStr}
                                onChangeText={(text) => {
                                    setHourStr(text);
                                    const val = parseInt(text, 10);
                                    if (!isNaN(val) && val >= 1 && val <= 12) setHour(val);
                                }}
                                onFocus={() => setActiveTab('hour')}
                                onBlur={() => setHourStr(hour.toString())}
                                keyboardType="number-pad"
                                maxLength={2}
                                selectTextOnFocus
                                className="w-full h-full text-center font-pbold"
                                style={{
                                    color: activeTab === 'hour' ? accentColor : (isDark ? 'white' : 'black'),
                                    fontSize: 32
                                }}
                            />
                        </View>

                        <Text
                            className={`font-pbold text-4xl ${mutedText}`}
                            style={{ includeFontPadding: false, textAlignVertical: 'center' }}
                        >
                            :
                        </Text>

                        {/* Minute Input Box */}
                        <View
                            className="items-center justify-center rounded-2xl w-20 h-20 overflow-hidden"
                            style={{ backgroundColor: activeTab === 'minute' ? `${accentColor}20` : (isDark ? '#262626' : '#f5f5f5') }}
                        >
                            <TextInput
                                value={minuteStr}
                                onChangeText={(text) => {
                                    setMinuteStr(text);
                                    const val = parseInt(text, 10);
                                    if (!isNaN(val) && val >= 0 && val <= 59) setMinute(val);
                                }}
                                onFocus={() => setActiveTab('minute')}
                                onBlur={() => setMinuteStr(minute.toString().padStart(2, '0'))}
                                keyboardType="number-pad"
                                maxLength={2}
                                selectTextOnFocus
                                className="w-full h-full text-center font-pbold"
                                style={{
                                    color: activeTab === 'minute' ? accentColor : (isDark ? 'white' : 'black'),
                                    fontSize: 32
                                }}
                            />
                        </View>

                        {/* AM / PM Toggles */}
                        <View className="ml-2 gap-2">
                            <TouchableOpacity
                                onPress={() => { setPeriod('AM'); Keyboard.dismiss(); }}
                                className="px-3 py-2 rounded-lg"
                                style={{ backgroundColor: period === 'AM' ? `${accentColor}20` : 'transparent' }}
                            >
                                <Text className="font-pbold text-sm" style={{ color: period === 'AM' ? accentColor : (isDark ? '#737373' : '#a3a3a3') }}>AM</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => { setPeriod('PM'); Keyboard.dismiss(); }}
                                className="px-3 py-2 rounded-lg"
                                style={{ backgroundColor: period === 'PM' ? `${accentColor}20` : 'transparent' }}
                            >
                                <Text className="font-pbold text-sm" style={{ color: period === 'PM' ? accentColor : (isDark ? '#737373' : '#a3a3a3') }}>PM</Text>
                            </TouchableOpacity>
                        </View>

                    </View>

                    {/* ─── SELECTION GRID ────────────────────────────────────── */}
                    <View className="flex-row flex-wrap justify-between gap-y-4">
                        {(activeTab === 'hour' ? hoursGrid : minutesGrid).map((item) => {
                            const isSelected = activeTab === 'hour' ? hour === item : minute === item;
                            const displayValue = activeTab === 'hour' ? item : item.toString().padStart(2, '0');

                            return (
                                <TouchableOpacity
                                    key={item}
                                    onPress={() => {
                                        // 1. Force the keyboard and text input to lose focus
                                        Keyboard.dismiss();

                                        if (activeTab === 'hour') {
                                            setHour(item);
                                            setActiveTab('minute');
                                        } else {
                                            setMinute(item);
                                        }
                                    }}
                                    className="w-[22%] aspect-square rounded-full items-center justify-center"
                                    style={{ backgroundColor: isSelected ? accentColor : 'transparent' }}
                                >
                                    <Text
                                        className={`text-lg m-auto ${isSelected ? 'font-pbold' : 'font-pmedium'}`}
                                        style={{ color: isSelected ? 'white' : (isDark ? '#d4d4d4' : '#404040') }}
                                    >
                                        {displayValue}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* ─── ACTIONS ───────────────────────────────────────────── */}
                    <View className="flex-row justify-end mt-8 gap-4">
                        <TouchableOpacity onPress={onClose} className="px-4 py-2">
                            <Text className={`font-psemibold ${mutedText}`}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleSave} className="px-4 py-2">
                            <Text className="font-psemibold" style={{ color: accentColor }}>Save Time</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
}