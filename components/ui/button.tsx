import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  Text,
  TextStyle,
  useColorScheme,
  ViewStyle,
} from "react-native";

import { getContrastTextColor } from "@/constants/habit-colors";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "outline"
  | "text"
  | "ghost"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg" | "default";

export interface ButtonProps {
  title?: string;
  onPress?: () => void;
  handlePress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  accentColor?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  containerStyles?: string;
  textClassName?: string;
  textStyles?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
  enableHaptics?: boolean;
}

export default function Button({
  title,
  onPress,
  handlePress,
  variant = "primary",
  size = "default",
  accentColor,
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  className = "",
  containerStyles = "",
  textClassName = "",
  textStyles = "",
  style,
  textStyle,
  children,
  enableHaptics = true,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const triggerPress = () => {
    if (disabled || loading) return;
    if (enableHaptics) {
      Haptics.selectionAsync().catch(() => { });
    }
    if (onPress) {
      onPress();
    } else if (handlePress) {
      handlePress();
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return {
          container: "h-9 px-3.5 rounded-xl gap-1.5",
          text: "text-xs font-pbold",
          spinnerSize: "small" as const,
        };
      case "md":
        return {
          container: "h-12 px-5 rounded-2xl gap-2",
          text: "text-sm font-pbold",
          spinnerSize: "small" as const,
        };
      case "lg":
      case "default":
      default:
        return {
          container: "h-16 px-6 rounded-[18px] gap-2.5",
          text: "text-base font-pbold",
          spinnerSize: "small" as const,
        };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "accent": {
        const bg = accentColor || "#4655E0";
        const fg = getContrastTextColor(bg);
        return {
          container: "",
          text: "",
          inlineStyle: { backgroundColor: bg },
          inlineTextStyle: { color: fg },
          spinnerColor: fg,
        };
      }
      case "secondary":
        return {
          container: isDark
            ? "bg-neutral-800 border border-neutral-700"
            : "bg-neutral-200 border border-neutral-300",
          text: isDark ? "text-neutral-100" : "text-neutral-900",
          inlineStyle: {
            backgroundColor: isDark ? "#262626" : "#E5E5E5",
            borderColor: isDark ? "#404040" : "#D4D4D4",
          },
          inlineTextStyle: {
            color: isDark ? "#F5F5F5" : "#171717",
          },
          spinnerColor: isDark ? "#FFFFFF" : "#11181C",
        };
      case "outline":
        return {
          container: isDark
            ? "bg-transparent border border-neutral-700"
            : "bg-transparent border border-neutral-300",
          text: isDark ? "text-neutral-100" : "text-neutral-900",
          inlineStyle: {
            backgroundColor: "transparent",
            borderColor: isDark ? "#404040" : "#D4D4D4",
          },
          inlineTextStyle: {
            color: isDark ? "#F5F5F5" : "#171717",
          },
          spinnerColor: isDark ? "#FFFFFF" : "#11181C",
        };
      case "ghost":
      case "text":
        return {
          container: "bg-transparent",
          text: isDark ? "text-neutral-300" : "text-neutral-600",
          inlineStyle: {
            backgroundColor: "transparent",
          },
          inlineTextStyle: {
            color: isDark ? "#D4D4D4" : "#525252",
          },
          spinnerColor: isDark ? "#FFFFFF" : "#11181C",
        };
      case "danger":
        return {
          container: "bg-red-500/10 border border-red-500/30",
          text: "text-red-500",
          inlineStyle: {
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            borderColor: "rgba(239, 68, 68, 0.3)",
          },
          inlineTextStyle: {
            color: "#EF4444",
          },
          spinnerColor: "#EF4444",
        };
      case "primary":
      default:
        return {
          container: isDark ? "bg-white" : "bg-neutral-900",
          text: isDark ? "text-neutral-900" : "text-white",
          inlineStyle: {
            backgroundColor: isDark ? "#FFFFFF" : "#171717",
          },
          inlineTextStyle: {
            color: isDark ? "#171717" : "#FFFFFF",
          },
          spinnerColor: isDark ? "#11181C" : "#FFFFFF",
        };
    }
  };

  const sizeStyle = getSizeStyles();
  const variantStyle = getVariantStyles();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={triggerPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        variantStyle.inlineStyle,
        style,
        {
          opacity: isDisabled ? 0.5 : pressed ? 0.82 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.985 : 1 }],
        },
      ]}
      className={`flex-row items-center justify-center ${sizeStyle.container} ${variantStyle.container} ${className} ${containerStyles}`}
    >
      {loading ? (
        <ActivityIndicator
          animating={loading}
          color={variantStyle.spinnerColor}
          size={sizeStyle.spinnerSize}
        />
      ) : (
        <>
          {leftIcon}
          {children}
          {title ? (
            <Text
              className={`${sizeStyle.text} ${variantStyle.text} ${textClassName} ${textStyles}`}
              style={[variantStyle.inlineTextStyle, textStyle]}
            >
              {title}
            </Text>
          ) : null}
          {rightIcon}
        </>
      )}
    </Pressable>
  );
}