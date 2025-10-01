import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import LoginScreen from '../features/auth/screens/LoginScreen';
import RegisterScreen from '../features/auth/screens/RegisterScreen';
import AppointmentsScreen from '../features/appointments/screens/AppointmentsScreen';
import HomeScreen from '../features/appointments/screens/HomeScreen';
import AppointmentDetailScreen from '../features/appointments/screens/AppointmentDetailScreen';
import AppointmentCreateScreen from '../features/appointments/screens/AppointmentCreateScreen';
import QuotationScreen from '../features/quotation/screens/QuotationScreen';
import OrdersListScreen from '../features/quotation/screens/OrdersListScreen';
import OrderDetailScreen from '../features/quotation/screens/OrderDetailScreen';
import BookingScreen from '../features/booking/screens/BookingScreen';
import ProfileScreen from '../features/profile/screens/ProfileScreen';
import ChangePasswordScreen from '../features/profile/screens/ChangePasswordScreen';
import EditProfileScreen from '../features/profile/screens/EditProfileScreen';
import EditStatusScreen from '../features/profile/screens/EditStatusScreen';
import { useTheme } from '../theme/theme';
import CustomerNavigator from './CustomerNavigator';
import { useAppStore } from '../store/appStore';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Customer: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const AppointmentsStack = createNativeStackNavigator();
const OrdersStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: 'Registro' }} />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
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
          if (route.name === 'Inicio') icon = 'home-outline';
          if (route.name === 'Pedidos') icon = 'pricetags-outline';
          if (route.name === 'Perfil') icon = 'person-circle-outline';
          // Reseñas removido para MVP2
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" options={{ headerShown: false }}>
        {() => (
          <AppointmentsStack.Navigator>
            <AppointmentsStack.Screen name="AppointmentsHome" component={HomeScreen} options={{ title: 'Inicio' }} />
            <AppointmentsStack.Screen name="AppointmentCreate" component={AppointmentCreateScreen} options={{ title: 'Crear visita' }} />
            <AppointmentsStack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} options={{ title: 'Cita' }} />
          </AppointmentsStack.Navigator>
        )}
      </Tab.Screen>
      <Tab.Screen name="Pedidos" options={{ headerShown: false }}>
        {() => (
          <OrdersStack.Navigator>
            <OrdersStack.Screen name="OrdersHome" component={OrdersListScreen} options={{ title: 'Pedidos' }} />
            <OrdersStack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Pedido' }} />
            <OrdersStack.Screen name="OrderEdit" component={QuotationScreen} options={{ title: 'Editar pedido' }} />
          </OrdersStack.Navigator>
        )}
      </Tab.Screen>
      {/** Reseñas removido para MVP2 **/}
      <Tab.Screen name="Perfil" options={{ headerShown: false }}>
        {() => (
          <ProfileStack.Navigator>
            <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} options={{ title: 'Perfil' }} />
            <ProfileStack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Perfil' }} />
            <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Perfil' }} />
            <ProfileStack.Screen name="EditStatus" component={EditStatusScreen} options={{ title: 'Perfil' }} />
          </ProfileStack.Navigator>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const isSignedIn = useAppStore((s) => s.isSignedIn);
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isSignedIn ? (
        <RootStack.Screen name="Main" component={MainTabs} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
}


