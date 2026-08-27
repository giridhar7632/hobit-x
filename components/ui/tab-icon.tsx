import { IconProps } from "@/constants/icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type TabBarIconProps = {
  icon: React.FC<IconProps>;
  color: string;
  name: string;
  focused: boolean;
};

export function TabBarIcon({ icon: Icon, color, name, focused }: TabBarIconProps) {
  return (
    <View style={styles.container}>
      <Icon color={color} size={22} />
      <Text
        style={[
          styles.label,
          { color },
          focused ? styles.labelFocused : styles.labelRegular,
        ]}
      >
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minWidth: 56,
  },
  label: {
    fontSize: 11,
    marginTop: 3,
  },
  labelRegular: {
    fontFamily: 'Poppins-Regular',
  },
  labelFocused: {
    fontFamily: 'Poppins-SemiBold',
  },
});