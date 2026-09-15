import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

export interface CustomSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  activeColor?: string;
  disabled?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

// Standard iOS Switch reference dimensions
const TRACK_WIDTH = 51;
const TRACK_HEIGHT = 31;
const TRACK_RADIUS = 15.5;
const THUMB_SIZE = 27;
const THUMB_OFFSET = 2;
const THUMB_TRANSLATE_X = TRACK_WIDTH - THUMB_SIZE - THUMB_OFFSET; // 22

export function CustomSwitch({
  value,
  onValueChange,
  activeColor = '#4655E0',
  disabled = false,
  testID,
  accessibilityLabel,
  accessibilityHint,
  style,
}: CustomSwitchProps) {
  const isDark = useColorScheme() === 'dark';
  const inactiveTrack = isDark ? '#39393D' : '#E9E9EB';

  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [value, animatedValue]);

  const handleToggle = () => {
    if (disabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore haptics error if not supported in test environment
    }
    onValueChange(!value);
  };

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [THUMB_OFFSET, THUMB_TRANSLATE_X],
  });

  return (
    <Pressable
      testID={testID}
      role="switch"
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel || 'Toggle switch'}
      accessibilityHint={accessibilityHint}
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'activate') {
          handleToggle();
        }
      }}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      disabled={disabled}
      onPress={handleToggle}
      style={[
        styles.container,
        disabled && styles.disabled,
        style,
      ]}
    >
      {/* Inactive Track with subtle boundary */}
      <View
        style={[
          styles.track,
          {
            backgroundColor: inactiveTrack,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        {/* Active Track Overlay */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.activeOverlay,
            {
              backgroundColor: activeColor,
              opacity: animatedValue,
            },
          ]}
        />
      </View>

      {/* Thumb with iOS Shadow & Android Elevation */}
      <Animated.View
        style={[
          styles.thumb,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_RADIUS,
    borderWidth: 1,
    overflow: 'hidden',
  },
  activeOverlay: {
    borderRadius: TRACK_RADIUS,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    top: THUMB_OFFSET,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    // iOS shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 2.5,
    // Android elevation
    elevation: 3,
  },
});