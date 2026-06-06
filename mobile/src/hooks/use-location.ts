import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

interface LocationState {
  location: Location.LocationObject | null;
  error: string | null;
  isLoading: boolean;
}

export function useLocation(watch = false): LocationState {
  const [state, setState] = useState<LocationState>({
    location: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    async function startLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState({ location: null, error: 'Location permission denied', isLoading: false });
        return;
      }

      if (watch) {
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (loc) => {
            setState({ location: loc, error: null, isLoading: false });
          },
        );
      } else {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setState({ location: loc, error: null, isLoading: false });
      }
    }

    startLocation().catch((err) => {
      setState({ location: null, error: err.message, isLoading: false });
    });

    return () => {
      subscription?.remove();
    };
  }, [watch]);

  return state;
}
