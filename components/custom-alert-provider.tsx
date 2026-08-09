import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AlertButton, setGlobalAlert } from '@/utils/custom-alert';
import React, { ReactNode, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

type AlertState = {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
};

export const CustomAlertProvider = ({ children, overrideTheme }: { children: ReactNode, overrideTheme?: any }) => {
  const colorScheme = useColorScheme();
  const currentTheme = colorScheme === 'dark' ? 'dark' : 'light';
  const { activeColor } = useAppTheme();
  const theme = overrideTheme || activeColor;

  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: '',
  });

  useEffect(() => {
    const previous = setGlobalAlert((title, message, buttons) => {
      setAlertState({
        visible: true,
        title,
        message,
        buttons: buttons || [{ text: 'OK' }],
      });
    });

    return () => {
      if (previous) setGlobalAlert(previous);
    };
  }, []);

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, visible: false }));
  };

  const handleButtonPress = (btn: AlertButton) => {
    closeAlert();
    if (btn.onPress) {
      // Execute the action with a small delay to allow modal out-animation to start smoothly
      setTimeout(btn.onPress, 50);
    }
  };

  const buttons = alertState.buttons || [];

  return (
    <>
      {children}
      {alertState.visible && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}
        >
          <View className="flex-1 justify-center items-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <View
              className="w-full max-w-sm rounded-3xl p-6 shadow-xl"
              style={{ backgroundColor: Colors[currentTheme].surface }}
            >
              <Text
                className="text-xl font-pbold text-center mb-2"
                style={{ color: Colors[currentTheme].text }}
              >
                {alertState.title}
              </Text>

              {alertState.message ? (
                <Text
                  className="text-base font-pregular text-center opacity-80 mb-6"
                  style={{ color: Colors[currentTheme].text }}
                >
                  {alertState.message}
                </Text>
              ) : <View className="mb-4" />}

              <View className={`flex-row justify-center gap-3 ${buttons.length > 2 ? 'flex-col' : ''}`}>
                {buttons.map((btn, index) => {
                  const isDestructive = btn.style === 'destructive';
                  const isCancel = btn.style === 'cancel';
                  const isDefault = !isDestructive && !isCancel;

                  let bgColor = isDestructive
                    ? 'rgba(239, 68, 68, 0.15)'
                    : (isCancel ? (currentTheme === 'dark' ? '#333333' : '#e5e5e5') : theme.accent);

                  let textColor = isDestructive
                    ? '#ef4444'
                    : (isCancel ? Colors[currentTheme].text : '#ffffff');

                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleButtonPress(btn)}
                      activeOpacity={0.7}
                      className={`px-4 py-3 rounded-xl items-center justify-center ${buttons.length > 2 ? 'w-full mb-2' : 'flex-1'}`}
                      style={{ backgroundColor: bgColor }}
                    >
                      <Text
                        className="font-psemibold text-base"
                        style={{ color: textColor }}
                      >
                        {btn.text || 'OK'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Animated.View>
      )}
    </>
  );
};
