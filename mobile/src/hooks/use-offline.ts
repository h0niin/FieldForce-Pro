import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

interface OfflineState {
  isOffline: boolean;
  isConnected: boolean;
}

export function useOffline(): OfflineState {
  const [state, setState] = useState<OfflineState>({
    isOffline: false,
    isConnected: true,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((netState) => {
      const connected = netState.isConnected ?? false;
      setState({
        isOffline: !connected,
        isConnected: connected,
      });
    });

    return () => unsubscribe();
  }, []);

  return state;
}
