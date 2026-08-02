import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";

type ButtonProps = {
  title: string;
  handlePress: () => void;
  containerStyles?: any;
  textStyles?: any;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  loading?: boolean;
  children?: React.ReactNode;
};

export default function Button({
  title,
  handlePress,
  containerStyles,
  textStyles,
  style,
  textStyle,
  loading,
  children,
}: ButtonProps) {
  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      style={style}
      className={`rounded-xl h-16 py-3 px-6 flex flex-row items-center justify-center bg-lime-500 ${containerStyles} ${loading ? "opacity-80" : ""
        }`}
    >
      {children}
      <Text
        className={`text-white font-semibold font-psemibold text-lg ${textStyles}`}
        style={textStyle}
      >
        {title}
      </Text>

      {loading && (
        <ActivityIndicator
          animating={loading}
          color="#fff"
          size="small"
          className="ml-2"
        />
      )}
    </Pressable>
  );
}