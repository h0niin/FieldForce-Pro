import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { companiesApi, contactsApi } from '@/api/endpoints';
import { formatDate } from '@/utils/format';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Company, Contact } from '@/types/models';

const ACCENT = '#4F6BF6';

function getInitials(contact: Contact): string {
  return `${contact.first_name[0] ?? ''}${contact.last_name[0] ?? ''}`.toUpperCase();
}

export default function CompanyDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors: c, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    Promise.allSettled([
      companiesApi.getById(id),
      contactsApi.getAllNonPaginated(),
    ])
      .then(([companyResult, contactsResult]) => {
        if (companyResult.status === 'fulfilled') {
          setCompany(companyResult.value.data.data ?? null);
        }
        if (contactsResult.status === 'fulfilled') {
          const all = contactsResult.value.data.data ?? [];
          setContacts(all.filter((c) => c.company_id === id));
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (!company) {
    return (
      <View style={[styles.centered, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
        <Ionicons name="business-outline" size={48} color={c.textLight} />
        <Text style={styles.errorText}>Company not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.errorBack}>
          <Text style={styles.errorBackText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleWebsite = () => {
    if (!company.website) return;
    const url = company.website.startsWith('http')
      ? company.website
      : `https://${company.website}`;
    Linking.openURL(url);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing['2xl'] },
      ]}
    >
      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={c.text} />
      </TouchableOpacity>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Ionicons name="business" size={36} color={c.textInverse} />
        </View>
        <Text style={[styles.name, { color: c.text }]}>{company.name}</Text>
        {company.industry && (
          <Text style={[styles.industry, { color: c.textSecondary }]}>{company.industry}</Text>
        )}
      </View>

      {/* Company details */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Details</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          {company.website ? (
            <TouchableOpacity style={styles.infoRow} onPress={handleWebsite} activeOpacity={0.6}>
              <Ionicons name="globe-outline" size={18} color={c.textSecondary} />
              <Text style={[styles.infoText, styles.infoLink]} numberOfLines={1}>
                {company.website}
              </Text>
              <Ionicons name="open-outline" size={14} color={c.textLight} />
            </TouchableOpacity>
          ) : (
            <View style={styles.infoRow}>
              <Ionicons name="globe-outline" size={18} color={c.textLight} />
              <Text style={styles.infoTextMuted}>No website</Text>
            </View>
          )}

          {company.billing_address && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={18} color={c.textSecondary} />
                <Text style={styles.infoText}>{company.billing_address}</Text>
              </View>
            </>
          )}

          {company.tax_id && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Ionicons name="document-text-outline" size={18} color={c.textSecondary} />
                <Text style={styles.infoText}>Tax ID: {company.tax_id}</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Notes */}
      {company.notes && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Notes</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <Text style={styles.notesText}>{company.notes}</Text>
          </View>
        </View>
      )}

      {/* Linked contacts */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>
          Contacts {contacts.length > 0 ? `(${contacts.length})` : ''}
        </Text>
        {contacts.length === 0 ? (
          <View style={[styles.emptyContacts, { backgroundColor: cardBg, borderColor }]}>
            <Ionicons name="people-outline" size={32} color={c.textLight} />
            <Text style={styles.emptyText}>No linked contacts</Text>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            {contacts.map((contact, index) => (
              <View key={contact.id}>
                {index > 0 && <View style={styles.divider} />}
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => router.push(`/contacts/${contact.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactAvatarText}>{getInitials(contact)}</Text>
                  </View>
                  <View style={styles.contactBody}>
                    <Text style={styles.contactName} numberOfLines={1}>
                      {contact.first_name} {contact.last_name}
                    </Text>
                    {contact.phone && (
                      <Text style={styles.contactDetail} numberOfLines={1}>
                        {contact.phone}
                      </Text>
                    )}
                    {!contact.phone && contact.email && (
                      <Text style={styles.contactDetail} numberOfLines={1}>
                        {contact.email}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={c.textLight} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Metadata */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Record Info</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Added</Text>
            <Text style={styles.metaValue}>{formatDate(company.created_at)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Last updated</Text>
            <Text style={styles.metaValue}>{formatDate(company.updated_at)}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  content: {
    padding: spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FB',
    gap: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  errorBack: {
    marginTop: spacing.sm,
  },
  errorBackText: {
    ...typography.body,
    color: ACCENT,
    fontWeight: '600',
  },
  backButton: {
    marginBottom: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    gap: spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  name: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
  },
  industry: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  infoText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  infoLink: {
    color: ACCENT,
  },
  infoTextMuted: {
    ...typography.body,
    color: colors.textLight,
    flex: 1,
    fontStyle: 'italic',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginLeft: spacing.lg + 18 + spacing.md,
  },
  notesText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
    paddingVertical: spacing.md,
  },
  emptyContacts: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.sm,
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  contactAvatarText: {
    ...typography.label,
    color: colors.textInverse,
    fontSize: 14,
  },
  contactBody: {
    flex: 1,
    gap: 2,
  },
  contactName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  contactDetail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  metaLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  metaValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
});
