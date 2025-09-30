import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import Constants from 'expo-constants';

interface Props {
  latitude: number;
  longitude: number;
}

export default function AppointmentMap({ latitude, longitude }: Props) {
  const providers = useMemo(() => {
    const lat = latitude.toFixed(6);
    const lon = longitude.toFixed(6);
    const token = (Constants.expoConfig?.extra as any)?.MAPBOX_TOKEN || (Constants.manifest2?.extra as any)?.MAPBOX_TOKEN;
    const urls: string[] = [];
    if (token) {
      urls.push(`https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+285AEB(${lon},${lat})/${lon},${lat},13,0/640x360@2x?access_token=${token}`);
    }
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


