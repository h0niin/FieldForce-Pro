import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/api/endpoints';
import AuditLogger, { AUDIT_ACTIONS, AUDIT_MODULES } from '@/utils/AuditLogger';
import { useAppTheme } from '@/hooks/useAppTheme';
import { colors, spacing, typography, borderRadius } from '@/theme';

const ACCENT = '#4F6BF6';

interface MenuItem {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled);
  const { colors, isDark, cardBg, borderColor } = useAppTheme();

  const doLogout = () => {
    AuditLogger.log({
      action: AUDIT_ACTIONS.LOGOUT,
      module: AUDIT_MODULES.AUTH,
      new_values: { user_id: user?.id },
    });
    logout();
    if (!biometricEnabled) {
      authApi.logout().catch(() => {});
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // Alert.alert uses window.confirm on web which is unreliable for custom buttons
      if (window.confirm('Are you sure you want to logout?')) {
        doLogout();
      }
      return;
    }
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: doLogout },
    ]);
  };

  const menuItems: MenuItem[] = [
    {
      icon: 'document-text-outline',
      label: 'My Documents',
      onPress: () => router.push('/documents'),
    },
    {
      icon: 'location-outline',
      label: 'Service Locations',
      onPress: () => router.push('/service-location'),
    },
    {
      icon: 'receipt-outline',
      label: 'Invoices',
      onPress: () => router.push('/invoice'),
    },
    {
      icon: 'build-outline',
      label: 'Parts',
      onPress: () => router.push('/catalog/parts'),
    },
    {
      icon: 'settings-outline',
      label: 'Settings',
      onPress: () => router.push('/settings'),
    },
    {
      icon: 'log-out-outline',
      label: 'Logout',
      onPress: handleLogout,
      color: colors.error,
    },
  ];

  const initials = user
    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    : '??';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? colors.background : '#F8F9FB' }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl }]}
    >
      <View style={[styles.profileCard, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={[styles.name, { color: colors.text }]}>
          {user?.first_name} {user?.last_name}
        </Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
      </View>

      <View style={[styles.menu, { backgroundColor: cardBg, borderColor }]}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuItem, { borderBottomColor: borderColor }]}
            onPress={item.onPress}
          >
            <Ionicons name={item.icon as any} size={22} color={item.color ?? colors.text} />
            <Text style={[styles.menuLabel, { color: item.color ?? colors.text }]}>
              {item.label}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  profileCard: {
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing['2xl'],
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { ...typography.h2, color: '#FFF' },
  name: { ...typography.h3 },
  email: { ...typography.body },
  menu: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuLabel: {
    ...typography.body,
    flex: 1,
  },
});
