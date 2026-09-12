import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { StyleProp, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { FONTS } from '@/constants/fonts';
import { getContrastTextColor } from '@/constants/habit-colors';
import { TickIcon } from '@/constants/icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CompletionIndicatorProps {
  isCompleted: boolean;
  completedCount?: number;
  totalCount?: number;
  accentColor: string;
  size?: number;
  onTrack: () => void;
  onUntrack?: () => void;
  style?: StyleProp<ViewStyle>;
}

const CELEBRATION_MESSAGES = [
  'Done!',
  'Nice!',
  'Nailed it!',
  'Streak +1!',
  'Keep going!',
  'Great work!',
  'Awesome!',
];

export function CompletionIndicator({
  isCompleted,
  completedCount = 0,
  totalCount = 1,
  accentColor,
  size = 38,
  onTrack,
  onUntrack,
  style,
}: CompletionIndicatorProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const tickScale = useSharedValue(isCompleted ? 1 : 0);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0);
  const pressScale = useSharedValue(1);

  const microCopyOpacity = useSharedValue(0);
  const [microCopyText, setMicroCopyText] = useState('');
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (isCompleted) {
      setMicroCopyText(
        CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)]
      );

      tickScale.value = withSequence(
        withTiming(1.18, { duration: 140, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) })
      );

      ringScale.value = 0.5;
      ringOpacity.value = 0.6;
      ringScale.value = withTiming(1.7, { duration: 450, easing: Easing.out(Easing.ease) });
      ringOpacity.value = withTiming(0, { duration: 450, easing: Easing.out(Easing.ease) });

      microCopyOpacity.value = withSequence(
        withTiming(1, { duration: 160 }),
        withDelay(800, withTiming(0, { duration: 220 }))
      );
    } else {
      tickScale.value = withTiming(0, { duration: 120, easing: Easing.in(Easing.quad) });
      ringScale.value = 0;
      ringOpacity.value = 0;
      microCopyOpacity.value = 0;
    }
  }, [isCompleted]);

  const tickAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tickScale.value }],
  }));

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const pressAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const microCopyAnimatedStyle = useAnimatedStyle(() => ({
    opacity: microCopyOpacity.value,
    transform: [{ translateY: (1 - microCopyOpacity.value) * 6 }],
  }));

  const handlePress = () => {
    if (isCompleted) {
      if (onUntrack) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onUntrack();
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onTrack();
    }
  };

  const strokeWidth = 2.5;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalCount > 0 ? Math.min(completedCount / totalCount, 1) : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const isLightAccent = accentColor === '#FFFFFF' || accentColor === '#ffffff';
  const isDarkAccent = accentColor === '#1C1C1E' || accentColor === '#11181C' || accentColor === '#000000';

  const ringStroke = isCompleted
    ? accentColor
    : isLightAccent
    ? 'rgba(255,255,255,0.45)'
    : isDarkAccent
    ? 'rgba(0,0,0,0.25)'
    : isDark
    ? 'rgba(255,255,255,0.14)'
    : 'rgba(0,0,0,0.1)';

  const centerDotBg = isLightAccent
    ? 'rgba(255,255,255,0.35)'
    : isDarkAccent
    ? 'rgba(0,0,0,0.2)'
    : isDark
    ? 'rgba(255,255,255,0.08)'
    : 'rgba(0,0,0,0.05)';

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center', overflow: 'visible', zIndex: 9999 }, style]}>
      {/* Burst ring */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: accentColor,
          },
          ringAnimatedStyle,
        ]}
      />

      {/* Main interactive button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPressIn={() => {
          pressScale.value = withTiming(0.92, { duration: 90, easing: Easing.out(Easing.quad) });
        }}
        onPressOut={() => {
          pressScale.value = withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) });
        }}
        onPress={handlePress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Animated.View
          style={[
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              alignItems: 'center',
              justifyContent: 'center',
            },
            pressAnimatedStyle,
          ]}
        >
          {/* Circular progress SVG */}
          <Svg width={size} height={size} style={{ position: 'absolute' }}>
            {/* Background ring */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={ringStroke}
              strokeWidth={strokeWidth}
              fill={isCompleted ? accentColor : 'transparent'}
            />
            {/* Progress arc for multiple reminders */}
            {totalCount > 1 && !isCompleted && completedCount > 0 && (
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={accentColor}
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                fill="none"
              />
            )}
          </Svg>

          {/* Inner content */}
          {isCompleted ? (
            <Animated.View style={tickAnimatedStyle}>
              <TickIcon size={size * 0.52} color={getContrastTextColor(accentColor)} />
            </Animated.View>
          ) : totalCount > 1 && completedCount > 0 ? (
            <Text
              style={{
                fontFamily: FONTS.bold,
                fontSize: 10,
                color: accentColor,
              }}
            >
              {completedCount}/{totalCount}
            </Text>
          ) : (
            <View
              style={{
                width: size * 0.35,
                height: size * 0.35,
                borderRadius: (size * 0.35) / 2,
                backgroundColor: centerDotBg,
              }}
            />
          )}
        </Animated.View>
      </TouchableOpacity>

      {/* Floating micro-copy celebration toast */}
      {microCopyText ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              bottom: size + 6,
              width: 140,
              left: (size - 140) / 2,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            },
            microCopyAnimatedStyle,
          ]}
        >
          <View
            style={{
              backgroundColor: accentColor,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 14,
              shadowColor: '#000',
              shadowOpacity: 0.18,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 5,
              elevation: 6,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                fontFamily: FONTS.bold,
                color: getContrastTextColor(accentColor),
                fontSize: 11,
                textAlign: 'center',
                includeFontPadding: false,
              }}
            >
              {microCopyText}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}
