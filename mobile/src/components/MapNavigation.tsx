import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '@/theme';

interface MapNavigationProps {
  latitude: number;
  longitude: number;
  title?: string;
  address?: string;
}

export function MapNavigation({ latitude, longitude, title, address }: MapNavigationProps) {
  const router = useRouter();

  const handleGetDirections = () => {
    // Navigate to the in-app Map tab with destination coordinates
    router.push({
      pathname: '/(tabs)/map',
      params: {
        destLat: String(latitude),
        destLng: String(longitude),
        destTitle: title ?? 'Destination',
      },
    });
  };

  const region = {
    latitude: Number(latitude),
    longitude: Number(longitude),
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
      >
        <Marker
          coordinate={{ latitude: Number(latitude), longitude: Number(longitude) }}
          title={title}
          description={address}
          pinColor="pink"
        />
      </MapView>
      <TouchableOpacity style={styles.button} onPress={handleGetDirections}>
        <Ionicons name="navigate" size={18} color={colors.textInverse} />
        <Text style={styles.buttonText}>Get Directions</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  map: {
    height: 200,
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
  },
  buttonText: {
    ...typography.button,
    color: colors.textInverse,
  },
});
