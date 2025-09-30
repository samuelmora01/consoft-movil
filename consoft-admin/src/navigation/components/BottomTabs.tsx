import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/theme';

export type BottomTabItem = {
  name: string;
  component: React.ComponentType<any>;
  icon: keyof typeof Ionicons.glyphMap;
  options?: any;
};

const Tab = createBottomTabNavigator();

export default function BottomTabs({ items }: { items: BottomTabItem[] }) {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border },
        tabBarIcon: ({ color, size }) => {
          const item = items.find((i) => i.name === route.name);
          const icon = item?.icon ?? ('ellipse-outline' as keyof typeof Ionicons.glyphMap);
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      {items.map((it) => (
        <Tab.Screen key={it.name} name={it.name} component={it.component} options={it.options} />
      ))}
    </Tab.Navigator>
  );
}


