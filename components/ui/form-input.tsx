import React, { useState } from "react";
import {
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  useColorScheme,
  View,
  ViewStyle,
} from "react-native";

export type FormInputSize = "sm" | "md" | "lg" | "default";

export type FormInputProps = Omit<TextInputProps, "onChangeText"> & {
  label?: string;
  required?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  handleChangeText?: (text: string) => void;
  handleBlur?: () => void;
  error?: string | null;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: FormInputSize;
  accentColor?: string;
  disabled?: boolean;
  containerClassName?: string;
  containerStyles?: any;
  inputClassName?: string;
  otherStyles?: any;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

export default function FormInput({
  label,
  required = false,
  value,
  onChangeText,
  handleChangeText,
  handleBlur,
  error,
  helperText,
  leftIcon,
  rightIcon,
  size = "default",
  accentColor = "#4655E0",
  disabled = false,
  containerClassName = "",
  containerStyles,
  inputClassName = "",
  otherStyles,
  style,
  inputStyle,
  multiline = false,
  numberOfLines,
  placeholderTextColor,
  ...rest
}: FormInputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [isFocused, setIsFocused] = useState(false);

  const handleTextChange = (text: string) => {
    if (onChangeText) onChangeText(text);
    if (handleChangeText) handleChangeText(text);
  };

  const getSizeClasses = () => {
    if (multiline) {
      return "min-h-[110px] p-4 rounded-[18px]";
    }
    switch (size) {
      case "sm":
        return "h-10 px-3 rounded-xl";
      case "md":
        return "h-12 px-4 rounded-2xl";
      case "lg":
      case "default":
      default:
        return "h-16 px-4 rounded-[18px]";
    }
  };

  const defaultPlaceholderColor = isDark
    ? "rgba(255,255,255,0.3)"
    : "rgba(0,0,0,0.3)";

  return (
    <View className={`w-full ${containerClassName}`}>
      {label ? (
        <View className="flex-row items-center justify-between mb-1.5 px-0.5">
          <Text className="text-sm font-pbold text-neutral-900 dark:text-neutral-100">
            {label}
          </Text>
          {required && (
            <Text className="text-[#F43F5E] font-pbold text-sm">*</Text>
          )}
        </View>
      ) : null}

      <View
        style={[
          {
            borderColor: error
              ? "#EF4444"
              : isFocused
                ? accentColor
                : isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.08)",
          },
          style,
        ]}
        className={`w-full border-[1.5px] flex-row items-center ${getSizeClasses()} ${isDark ? "bg-[#1F2023]" : "bg-neutral-50"
          } ${disabled ? "opacity-50" : ""} ${containerStyles}`}
      >
        {leftIcon && <View className="mr-2.5">{leftIcon}</View>}

        <TextInput
          className={`flex-1 font-pmedium text-base text-neutral-900 dark:text-neutral-100 ${inputClassName} ${otherStyles}`}
          selectionColor={accentColor}
          cursorColor={accentColor}
          placeholderTextColor={placeholderTextColor || defaultPlaceholderColor}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            handleBlur?.();
          }}
          onChangeText={handleTextChange}
          value={value}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? "top" : "center"}
          style={inputStyle}
          {...rest}
        />

        {rightIcon && <View className="ml-2.5">{rightIcon}</View>}
      </View>

      {error ? (
        <Text className="text-red-500 text-xs font-pmedium mt-1 px-1">
          {error}
        </Text>
      ) : helperText ? (
        <Text className="text-neutral-500 dark:text-neutral-400 text-xs font-pregular mt-1 px-1">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}
