import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import SearchScreen from '../screens/SearchScreen';
import SavedScreen from '../screens/SavedScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailCustomerScreen from '../screens/OrderDetailCustomerScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import EditStatusScreen from '../screens/profile/EditStatusScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import ScheduleAppointmentScreen from '../screens/ScheduleAppointmentScreen';
import ServiceDetailScreen from '../screens/ServiceDetailScreen';

const Tab = createBottomTabNavigator();
const SearchStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const SavedStack = createNativeStackNavigator();

function SearchStackNavigator() {
  return (
    <SearchStack.Navigator>
      <SearchStack.Screen name="SearchHome" component={SearchScreen} options={{ headerShown: false }} />
      <SearchStack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Mueble' }} />
      <SearchStack.Screen name="ServiceDetail" component={ServiceDetailScreen} options={{ title: 'Servicio' }} />
      <SearchStack.Screen name="Schedule" component={ScheduleAppointmentScreen} options={{ title: 'Agendar' }} />
    </SearchStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Cambiar contraseña' }} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Editar perfil' }} />
      <ProfileStack.Screen name="EditStatus" component={EditStatusScreen} options={{ title: 'Editar estado' }} />
    </ProfileStack.Navigator>
  );
}

export default function CustomerNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let icon: keyof typeof Ionicons.glyphMap = 'home-outline';
          if (route.name === 'Buscar') icon = 'search-outline';
          if (route.name === 'Guardado') icon = 'bookmark-outline';
          if (route.name === 'Mis pedidos') icon = 'pricetags-outline';
          if (route.name === 'Perfil') icon = 'person-circle-outline';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Buscar" component={SearchStackNavigator} />
      <Tab.Screen name="Guardado">
        {() => (
          <SavedStack.Navigator>
            <SavedStack.Screen name="SavedHome" component={SavedScreen} options={{ headerShown: false }} />
            <SavedStack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Mueble' }} />
            <SavedStack.Screen name="Schedule" component={ScheduleAppointmentScreen} options={{ title: 'Agendar' }} />
          </SavedStack.Navigator>
        )}
      </Tab.Screen>
      <Tab.Screen name="Mis pedidos" options={{ headerShown: false }}>
        {() => (
          <SearchStack.Navigator>
            <SearchStack.Screen name="OrdersHome" component={OrdersScreen} options={{ headerShown: false }} />
            <SearchStack.Screen name="OrderDetail" component={OrderDetailCustomerScreen} options={{ title: 'Pedido' }} />
            <SearchStack.Screen name="OrderPayment" component={require('../screens/OrderPaymentScreen').default} options={{ title: 'Pago' }} />
          </SearchStack.Navigator>
        )}
      </Tab.Screen>
      <Tab.Screen name="Perfil" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}
