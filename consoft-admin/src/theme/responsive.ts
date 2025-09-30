import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Basado en iPhone 12/13/14 Pro (390x844) como guía
const GUIDELINE_BASE_WIDTH = 390;
const GUIDELINE_BASE_HEIGHT = 844;

export function scale(size: number): number {
  return (SCREEN_WIDTH / GUIDELINE_BASE_WIDTH) * size;
}

export function verticalScale(size: number): number {
  return (SCREEN_HEIGHT / GUIDELINE_BASE_HEIGHT) * size;
}

export function moderateScale(size: number, factor: number = 0.5): number {
  return size + (scale(size) - size) * factor;
}

export function responsiveFontSize(size: number, factor: number = 0.4): number {
  // Ajusta ligeramente las fuentes, evitando crecimientos agresivos
  const newSize = moderateScale(size, factor);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

export function useDeviceBreakpoints(): {
  isTinyPhone: boolean;
  isSmallPhone: boolean;
  isLargePhone: boolean;
  isTabletLike: boolean;
} {
  const minDim = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT);
  return {
    isTinyPhone: minDim < 360,
    isSmallPhone: minDim >= 360 && minDim < 400,
    isLargePhone: minDim >= 430,
    isTabletLike: minDim >= 600,
  };
}


