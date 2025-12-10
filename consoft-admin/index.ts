import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';

import App from './App';
import { useAppStore } from './src/store/appStore';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// Nota: Datos semilla de visitas eliminados. Cargar desde backend.
