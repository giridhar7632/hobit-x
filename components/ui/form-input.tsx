import { Colors } from "@/constants/theme";
import React, { useState } from "react";
import {
  Text,
  TextInput,
  // Pressable,
  TextInputProps,
  useColorScheme,
  // Image,
  View,
} from "react-native";
// import icons from "@/constants/icons";

export type FormInputProps = TextInputProps & {
  label: string;
  value: string;
  handleChangeText?: (text: string) => void;
  handleBlur?: () => void;
  containerStyles?: any;
  otherStyles?: any;
  error?: any;
  disabled?: boolean;
  keyboardType?: string;
  accentColor?: string;
};

export default function FormInput({
  label,
  value,
  handleChangeText,
  handleBlur,
  keyboardType,
  containerStyles,
  otherStyles,
  error,
  disabled,
  accentColor,
  ...rest
}: FormInputProps) {
  const rawColorScheme = useColorScheme();
  const colorScheme: 'light' | 'dark' = rawColorScheme === 'dark' ? 'dark' : 'light';
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const accent = accentColor || '#84cc16';

  return (
    <View key={label} className="w-full space-y-2 px-4 mt-2">
      <Text
        style={{ color: Colors[colorScheme].tabIconDefault }}
        className="text-base"
      >
        {label}
      </Text>
      <View
        style={isFocused ? { borderColor: accent } : undefined}
        className={`w-full h-16 px-4 border rounded-xl flex-row items-center ${
          colorScheme === "light"
            ? "bg-neutral-100 border-neutral-200"
            : "bg-neutral-800 border-neutral-700"
        } ${containerStyles}`}
      >
        <TextInput
          className={`flex-1 font-pmedium text-base ${
            colorScheme === "light" ? "text-black" : "text-white"
          } ${disabled ? "opacity-50" : ""} ${otherStyles}`}
          selectionColor={accent}
          cursorColor={accent}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            handleBlur?.();
          }}
          onChangeText={handleChangeText}
          value={value}
          editable={!disabled}
          secureTextEntry={label === "Password" && !showPassword}
          {...rest}
        />
        {/* {label === "Password" && (
          <Pressable onPress={() => setShowPassword((prev) => !prev)}>
            <Image
              source={!showPassword ? icons.eye : icons.eyeHide}
              className="h-6 w-6"
              resizeMode="contain"
            />
          </Pressable>
        )} */}
      </View>
      {error && <Text className="text-red-500 text-sm">{error}</Text>}
    </View>
  );
}

