import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra as any) || (Constants.manifest2?.extra as any) || {};

export const API: string = extra.API || '';


