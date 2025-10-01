import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';

interface Props {
  latitude: number;
  longitude: number;
  // draggable ignored in static fallback to avoid crashes without Maps SDK
  draggable?: boolean;
  onChangeLocation?: (longitude: number, latitude: number) => void;
}

// Native fallback to static map image to avoid crashes on devices without Google Maps Services/API key
export default function AppointmentMap({ latitude, longitude }: Props) {
  const providers = useMemo(() => {
    const lat = latitude.toFixed(6);
    const lon = longitude.toFixed(6);
    const urls: string[] = [];
    urls.push(
      `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=13&size=640x360&markers=${lat},${lon},lightblue1`,
      `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&z=13&size=640,360&l=map&pt=${lon},${lat},pm2rdm`
    );
    return urls;
  }, [latitude, longitude]);

  const [idx, setIdx] = useState(0);

  return (
    <View style={{ flex: 1 }}>
      <Image
        source={{ uri: providers[idx] }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        onError={() => setIdx((i) => (i + 1 < providers.length ? i + 1 : i))}
      />
    </View>
  );
}


