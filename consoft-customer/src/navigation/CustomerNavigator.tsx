import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/theme';
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
import ServiceReviewScreen from '../screens/ServiceReviewScreen';
import CustomProductScreen from '../screens/CustomProductScreen';
import ContactInfoScreen from '../screens/ContactInfoScreen';
import CartScreen from '../screens/CartScreen';
import CustomerChatRoot from '../features/chat/screens/CustomerChatRoot';
import ChatRoomScreen from '../features/chat/screens/ChatRoomScreen';

const Tab = createBottomTabNavigator();
const SearchStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const SavedStack = createNativeStackNavigator();
const OrdersStack = createNativeStackNavigator();

function SearchStackNavigator() {
  const { theme } = useTheme();
  return (
    <SearchStack.Navigator
      screenOptions={({ navigation }) => ({
        headerTitle: '',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: theme.colors.card },
        headerTintColor: theme.colors.text,
        contentStyle: { backgroundColor: theme.colors.background },
        headerLeft: () => (
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
            <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
          </TouchableOpacity>
        ),
      })}
    >
      <SearchStack.Screen name="SearchHome" component={SearchScreen} options={{ headerShown: false }} />
      <SearchStack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Mueble' }} />
      <SearchStack.Screen name="ServiceDetail" component={ServiceDetailScreen} options={{ title: 'Servicio' }} />
      <SearchStack.Screen name="ServiceReview" component={ServiceReviewScreen} options={{ title: 'Dejar reseña' }} />
      <SearchStack.Screen name="CustomProduct" component={CustomProductScreen} options={{ title: 'Diseño Personalizado' }} />
      <SearchStack.Screen name="Schedule" component={ScheduleAppointmentScreen} options={{ title: 'Agendar' }} />
      <SearchStack.Screen name="ContactInfo" component={ContactInfoScreen} options={{ title: 'Contacto' }} />
      <SearchStack.Screen name="CartHome" component={CartScreen} options={{ title: 'Carrito' }} />
    </SearchStack.Navigator>
  );
}

function ProfileStackNavigator() {
  const { theme } = useTheme();
  return (
    <ProfileStack.Navigator
      screenOptions={({ navigation }) => ({
        headerTitle: '',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: theme.colors.card },
        headerTintColor: theme.colors.text,
        contentStyle: { backgroundColor: theme.colors.background },
        headerLeft: () => (
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
            <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
          </TouchableOpacity>
        ),
      })}
    >
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="CartHome" component={CartScreen} options={{ title: 'Carrito' }} />
      <ProfileStack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Cambiar contraseña' }} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Editar perfil' }} />
      <ProfileStack.Screen name="EditStatus" component={EditStatusScreen} options={{ title: 'Editar estado' }} />
      <ProfileStack.Screen name="ChatRoot" component={CustomerChatRoot} options={{ title: 'Chat' }} />
      <ProfileStack.Screen name="ChatRoom" component={ChatRoomScreen} options={{ title: 'Chat con soporte' }} />
    </ProfileStack.Navigator>
  );
}

export default function CustomerNavigator() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      initialRouteName="Inicio"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarIcon: ({ color, size }) => {
          let icon: keyof typeof Ionicons.glyphMap = 'home-outline';
          if (route.name === 'Inicio') icon = 'home-outline';
          if (route.name === 'Guardado') icon = 'bookmark-outline';
          if (route.name === 'Mis pedidos') icon = 'pricetags-outline';
          if (route.name === 'Perfil') icon = 'person-circle-outline';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={SearchStackNavigator} />
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
        {() => {
          const { theme } = useTheme();
          return (
            <OrdersStack.Navigator
              screenOptions={({ navigation }) => ({
                headerTitle: '',
                headerShadowVisible: false,
                headerStyle: { backgroundColor: theme.colors.card },
                headerTintColor: theme.colors.text,
                contentStyle: { backgroundColor: theme.colors.background },
                headerLeft: () => (
                  <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
                    <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
                  </TouchableOpacity>
                ),
              })}
            >
              <OrdersStack.Screen name="OrdersHome" component={OrdersScreen} options={{ headerShown: false }} />
              <OrdersStack.Screen name="OrderDetail" component={OrderDetailCustomerScreen} options={{ title: 'Pedido' }} />
              <OrdersStack.Screen name="OrderPayment" component={require('../screens/OrderPaymentScreen').default} options={{ title: 'Pago' }} />
            </OrdersStack.Navigator>
          );
        }}
      </Tab.Screen>
      <Tab.Screen name="Perfil" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}
