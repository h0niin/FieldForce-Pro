import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore, type ThemeMode } from '@/store/theme.store';
import { useAppTheme } from '@/hooks/useAppTheme';
import { colors, spacing, typography, borderRadius } from '@/theme';

const ACCENT = '#4F6BF6';

const THEME_OPTIONS = [
  { key: 'light' as ThemeMode, label: 'Light', icon: 'sunny-outline' as const },
  { key: 'dark' as ThemeMode, label: 'Dark', icon: 'moon-outline' as const },
  { key: 'system' as ThemeMode, label: 'System', icon: 'phone-portrait-outline' as const },
];

interface SettingsRow {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (val: boolean) => void;
}

interface SettingsSection {
  title: string;
  items: SettingsRow[];
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled);
  const setBiometricEnabled = useAuthStore((s) => s.setBiometricEnabled);
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const { colors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

  const sections: SettingsSection[] = [
    {
      title: 'Account',
      items: [
        {
          icon: 'person-outline',
          label: 'Name',
          value: `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || '-',
        },
        {
          icon: 'mail-outline',
          label: 'Email',
          value: user?.email ?? '-',
        },
        {
          icon: 'lock-closed-outline',
          label: 'Change Password',
          onPress: () => Alert.alert('Change Password', 'This feature is coming soon.'),
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          icon: 'finger-print-outline',
          label: 'Biometric Login',
          toggle: true,
          toggleValue: biometricEnabled,
          onToggle: (val) => setBiometricEnabled(val),
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: 'notifications-outline', label: 'Notifications', value: 'Enabled' },
        { icon: 'location-outline', label: 'Location Tracking', value: 'While Using' },
        { icon: 'color-palette-outline', label: 'Color Theme', value: '__theme_picker__' },
      ],
    },
    {
      title: 'About',
      items: [
        {
          icon: 'information-circle-outline',
          label: 'Version',
          value: Constants.expoConfig?.version ?? '1.0.0',
        },
        { icon: 'document-text-outline', label: 'Terms of Service' },
        { icon: 'shield-checkmark-outline', label: 'Privacy Policy' },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F8F9FB' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, backgroundColor: headerBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
            <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}>
              {section.items.map((item, index) => (
                <View key={item.label}>
                  <TouchableOpacity
                    style={[
                      styles.row,
                      index < section.items.length - 1 && item.value !== '__theme_picker__' && [styles.rowBorder, { borderBottomColor: borderColor }],
                    ]}
                    onPress={item.onPress}
                    disabled={!item.onPress && !item.toggle}
                    activeOpacity={item.onPress ? 0.7 : 1}
                  >
                    <View style={[styles.rowIcon, { backgroundColor: item.destructive ? colors.error + '12' : ACCENT + '12' }]}>
                      <Ionicons
                        name={item.icon as any}
                        size={18}
                        color={item.destructive ? colors.error : ACCENT}
                      />
                    </View>
                    <Text style={[styles.rowLabel, { color: item.destructive ? colors.error : colors.text }]}>
                      {item.label}
                    </Text>
                    {item.toggle ? (
                      <Switch
                        value={item.toggleValue}
                        onValueChange={item.onToggle}
                        trackColor={{ false: borderColor, true: ACCENT + '60' }}
                        thumbColor={item.toggleValue ? ACCENT : '#FFF'}
                      />
                    ) : item.value === '__theme_picker__' ? null : (
                      <>
                        {item.value && (
                          <Text style={[styles.rowValue, { color: colors.textSecondary }]} numberOfLines={1}>
                            {item.value}
                          </Text>
                        )}
                        {item.onPress && (
                          <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
                        )}
                      </>
                    )}
                  </TouchableOpacity>
                  {item.value === '__theme_picker__' && (
                    <View style={[styles.themePicker, index < section.items.length - 1 && [styles.rowBorder, { borderBottomColor: borderColor }]]}>
                      {THEME_OPTIONS.map((opt) => {
                        const isActive = themeMode === opt.key;
                        return (
                          <TouchableOpacity
                            key={opt.key}
                            style={[
                              styles.themeOption,
                              { backgroundColor: inputBg, borderColor },
                              isActive && styles.themeOptionActive,
                            ]}
                            onPress={() => setThemeMode(opt.key)}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name={opt.icon}
                              size={18}
                              color={isActive ? '#FFF' : colors.textSecondary}
                            />
                            <Text style={[styles.themeOptionText, { color: colors.textSecondary }, isActive && styles.themeOptionTextActive]}>
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 40, alignItems: 'flex-start' },
  headerCenter: { flex: 1 },
  headerTitle: { ...typography.h4 },
  scroll: { flex: 1 },
  content: { padding: spacing.lg },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    ...typography.label,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowLabel: {
    ...typography.body,
    flex: 1,
  },
  rowValue: {
    ...typography.bodySmall,
    maxWidth: 160,
  },
  themePicker: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  themeOptionActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  themeOptionText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  themeOptionTextActive: {
    color: '#FFF',
  },
});
