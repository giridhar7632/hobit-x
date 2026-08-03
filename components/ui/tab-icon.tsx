import { IconProps } from "@/constants/icons";
import React from "react";
import { Text, View } from "react-native";

type TabBarIconProps = {
  icon: React.FC<IconProps>;
  color: string;
  name: string;
  focused: boolean;
};

export function TabBarIcon({ icon: Icon, color, name, focused }: TabBarIconProps) {
  return (
    <View
      className="flex items-center justify-center gap-2 cursor-pointer"
      style={{ width: 120 }}
    >
      <Icon color={color} size={24} />

      <Text
        key={name}
        className={`${focused ? "font-psemibold" : "font-pregular"} text-xs`}
        style={{ color: color }}
      >
        {name}
      </Text>
    </View>
  );
}