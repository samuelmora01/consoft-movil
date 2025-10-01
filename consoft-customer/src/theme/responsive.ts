import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_WIDTH = 393; // iPhone 17 Pro width reference
const BASE_HEIGHT = 852; // iPhone 17 Pro height reference

export const scale = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
export const verticalScale = (size: number) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

export const responsiveFontSize = (size: number) => {
  const newSize = moderateScale(size);
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
};

export const useDeviceBreakpoints = () => {
  const isLargePhone = SCREEN_WIDTH > 400;
  const isTabletLike = SCREEN_WIDTH > 600;
  return { isLargePhone, isTabletLike };
};
