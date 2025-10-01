import React from 'react';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';

interface Props {
  latitude: number;
  longitude: number;
  draggable?: boolean;
  onChangeLocation?: (longitude: number, latitude: number) => void;
}

export default function AppointmentMap({ latitude, longitude, draggable = false, onChangeLocation }: Props) {
  const onMapPress = (e: MapPressEvent) => {
    if (!draggable || !onChangeLocation) return;
    const { latitude: lat, longitude: lon } = e.nativeEvent.coordinate;
    onChangeLocation(lon, lat);
  };

  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      onPress={onMapPress}
    >
      <Marker
        coordinate={{ latitude, longitude }}
        draggable={draggable}
        onDragEnd={(e) => {
          if (!onChangeLocation) return;
          const { latitude: lat, longitude: lon } = e.nativeEvent.coordinate;
          onChangeLocation(lon, lat);
        }}
      />
    </MapView>
  );
}


