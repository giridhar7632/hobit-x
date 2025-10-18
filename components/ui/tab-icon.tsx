import { Image, StyleSheet, Text, View } from 'react-native';

interface TabBarIconProps {
  icon: any;
  color: string;
  name: string;
  focused: boolean;
}

export function TabBarIcon({ icon, color, name, focused }: TabBarIconProps) {
  return (
    <View style={styles.container}>
      <Image
        source={icon}
        resizeMode="contain"
        style={[styles.icon, { tintColor: color }]}
      />
      <Text style={[styles.text, { color: color }, focused && styles.focusedText]}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  icon: {
    width: 24,
    height: 24,
  },
  text: {
    fontSize: 12,
    fontWeight: '400',
  },
  focusedText: {
    fontWeight: '600',
  },
});
