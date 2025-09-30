import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';

import App from './App';
import { useAppStore } from './src/store/appStore';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// Dev helpers in Expo console
// Access in console as: global.seedAppointments()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).seedAppointments = () => {
  const seed = useAppStore.getState().seedAppointments;
  seed(8);
  // return current state for quick inspection
  return useAppStore.getState().appointments;
};

// Auto-seed in development on first load if empty
if (__DEV__) {
  const state = useAppStore.getState();
  if ((state.appointments?.length ?? 0) === 0) {
    state.seedAppointments(8);
  }
}
