import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOffline } from '@/hooks/use-offline';
import { colors, spacing, typography } from '@/theme';

export function OfflineIndicator() {
  const { isOffline } = useOffline();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-60);

  useEffect(() => {
    translateY.value = withTiming(isOffline ? 0 : -60, { duration: 300 });
  }, [isOffline, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, { paddingTop: insets.top }, animatedStyle]}>
      <Text style={styles.text}>You are offline. Changes will sync when reconnected.</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    zIndex: 1000,
  },
  text: {
    ...typography.bodySmall,
    color: colors.white,
    textAlign: 'center',
    fontWeight: '600',
  },
});
