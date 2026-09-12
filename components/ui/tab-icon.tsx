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
    <View className="items-center justify-center py-0.5 min-w-[56px]">
      <Icon color={color} size={22} />
      <Text
        style={{ color }}
        className={`text-[11px] mt-0.5 ${focused ? 'font-psemibold' : 'font-pregular'}`}
      >
        {name}
      </Text>
    </View>
  );
}