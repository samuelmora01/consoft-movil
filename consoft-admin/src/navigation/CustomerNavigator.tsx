import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import CustomerHomeScreen from '../customer/screens/HomeScreen';
import CustomerOrdersListScreen from '../customer/screens/OrdersListScreen';
import CustomerReviewsScreen from '../customer/screens/ReviewsScreen';
import CustomerProfileScreen from '../customer/screens/ProfileScreen';
import { useTheme } from '../theme/theme';

const Tab = createBottomTabNavigator();

export default function CustomerNavigator() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border },
        tabBarIcon: ({ color, size }) => {
          let icon: keyof typeof Ionicons.glyphMap = 'home-outline';
          if (route.name === 'Inicio') icon = 'search-outline';
          if (route.name === 'Pedidos') icon = 'pricetags-outline';
          if (route.name === 'Reseñas') icon = 'chatbubble-ellipses-outline';
          if (route.name === 'Perfil') icon = 'person-circle-outline';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={CustomerHomeScreen} />
      <Tab.Screen name="Pedidos" component={CustomerOrdersListScreen} />
      <Tab.Screen name="Reseñas" component={CustomerReviewsScreen} />
      <Tab.Screen name="Perfil" component={CustomerProfileScreen} />
    </Tab.Navigator>
  );
}


