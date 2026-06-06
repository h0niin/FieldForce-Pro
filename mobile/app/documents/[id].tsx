import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { userDocumentsApi } from '@/api/endpoints';
import { API_URL } from '@/utils/constants';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { DocumentType } from '@/types/models';

const ACCENT = '#4F6BF6';
import type { UserDocument } from '@/types/models';

/**
 * Rewrite any file URL that points to localhost/127.0.0.1 to use the
 * same host/port as the API so physical devices can reach the server.
 * e.g. http://localhost:3000/uploads/… → http://192.168.1.52:3000/uploads/…
 */
function resolveFileUrl(fileUrl: string): string {
  try {
    const apiOrigin = new URL(API_URL).origin; // e.g. http://192.168.1.52:3000
    const parsed = new URL(fileUrl);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return fileUrl.replace(parsed.origin, apiOrigin);
    }
    return fileUrl;
  } catch {
    return fileUrl;
  }
}

function formatDocumentType(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    [DocumentType.CERTIFICATION]: 'Certification',
    [DocumentType.LICENSE]: 'License',
    [DocumentType.ID_PROOF]: 'ID Proof',
    [DocumentType.INSURANCE]: 'Insurance',
    [DocumentType.CONTRACT]: 'Contract',
    [DocumentType.OTHER]: 'Other',
  };
  return labels[type] ?? type;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isExpired(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface InfoRowProps {
  label: string;
  value: string;
  valueStyle?: object;
  labelColor?: string;
  valueColor?: string;
  dividerColor?: string;
}

function InfoRow({ label, value, valueStyle, labelColor, valueColor, dividerColor }: InfoRowProps) {
  return (
    <View style={[infoStyles.row, dividerColor ? { borderBottomColor: dividerColor } : undefined]}>
      <Text style={[infoStyles.label, labelColor ? { color: labelColor } : undefined]}>{label}</Text>
      <Text style={[infoStyles.value, valueColor ? { color: valueColor } : undefined, valueStyle]}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
    gap: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  value: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
});

export default function DocumentDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors: themeColors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();
  const [document, setDocument] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingFile, setViewingFile] = useState(false);

  useEffect(() => {
    if (!id) return;
    userDocumentsApi
      .getById(id)
      .then((res) => setDocument(res.data.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = () => {
    if (!document) return;
    Alert.alert('Delete Document', `Remove "${document.document_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await userDocumentsApi.delete(document.id);
            router.back();
          } catch {
            Alert.alert('Error', 'Failed to delete document.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top, backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (!document) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top, backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}>
        <Ionicons name="alert-circle-outline" size={48} color={themeColors.textSecondary} />
        <Text style={[styles.notFound, { color: themeColors.textSecondary }]}>Document not found.</Text>
      </View>
    );
  }

  const expired = isExpired(document.expiry_date);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}>
      {/* Manual navigation header */}
      <View style={[styles.screenHeader, { paddingTop: insets.top + spacing.md, backgroundColor: headerBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: themeColors.text }]}>Document Details</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Scrollable metadata */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header card */}
        <View style={[styles.headerCard, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.iconWrap}>
            <Ionicons name="document-text" size={32} color={ACCENT} />
          </View>
          <Text style={[styles.docName, { color: themeColors.text }]}>{document.document_name}</Text>
          <Text style={[styles.docType, { color: themeColors.textSecondary }]}>{formatDocumentType(document.document_type)}</Text>

          {document.is_verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.verifiedText}>
                Verified {document.verified_at ? `on ${formatDate(document.verified_at)}` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Details card */}
        <View style={[styles.detailCard, { backgroundColor: cardBg, borderColor }]}>
          <InfoRow label="Document Type" value={formatDocumentType(document.document_type)} labelColor={themeColors.textSecondary} valueColor={themeColors.text} dividerColor={borderColor} />
          <InfoRow label="Issue Date" value={formatDate(document.issue_date)} labelColor={themeColors.textSecondary} valueColor={themeColors.text} dividerColor={borderColor} />
          <InfoRow
            label="Expiry Date"
            value={
              document.expiry_date
                ? `${formatDate(document.expiry_date)}${expired ? ' (Expired)' : ''}`
                : '—'
            }
            valueStyle={expired ? { color: colors.error } : undefined}
            labelColor={themeColors.textSecondary}
            valueColor={themeColors.text}
            dividerColor={borderColor}
          />
          <InfoRow label="Issuing Authority" value={document.issuing_authority ?? '—'} labelColor={themeColors.textSecondary} valueColor={themeColors.text} dividerColor={borderColor} />
          <InfoRow label="Document Number" value={document.document_number ?? '—'} labelColor={themeColors.textSecondary} valueColor={themeColors.text} dividerColor={borderColor} />
          <InfoRow label="File Type" value={document.file_type ?? '—'} labelColor={themeColors.textSecondary} valueColor={themeColors.text} dividerColor={borderColor} />
          <InfoRow label="File Size" value={formatFileSize(document.file_size)} labelColor={themeColors.textSecondary} valueColor={themeColors.text} dividerColor={borderColor} />
          {document.notes && <InfoRow label="Notes" value={document.notes} labelColor={themeColors.textSecondary} valueColor={themeColors.text} dividerColor={borderColor} />}
          <InfoRow label="Uploaded" value={formatDate(document.created_at)} labelColor={themeColors.textSecondary} valueColor={themeColors.text} dividerColor={borderColor} />
        </View>
      </ScrollView>

      {/* Sticky footer — always above the home indicator */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg, backgroundColor: isDark ? themeColors.background : '#F8F9FB', borderTopColor: borderColor }]}>
        {document.file_url ? (
          <TouchableOpacity style={styles.viewBtn} onPress={() => setViewingFile(true)}>
            <Ionicons name="open-outline" size={20} color={colors.textInverse} />
            <Text style={styles.viewBtnText}>View File</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: cardBg, borderColor: colors.error + '40' }]} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color={colors.error} />
          <Text style={styles.deleteBtnText}>Delete Document</Text>
        </TouchableOpacity>
      </View>

      {/* Full-screen file viewer overlay — absolutely covers everything when active */}
      {viewingFile && document.file_url && (
        <View style={[styles.viewerContainer, StyleSheet.absoluteFillObject, { backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}>
          <View style={[styles.viewerHeader, { paddingTop: insets.top, backgroundColor: headerBg, borderBottomColor: borderColor }]}>
            <TouchableOpacity style={styles.viewerClose} onPress={() => setViewingFile(false)}>
              <Ionicons name="arrow-back" size={22} color={themeColors.text} />
              <Text style={[styles.viewerCloseText, { color: themeColors.text }]}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.viewerTitle, { color: themeColors.textSecondary }]} numberOfLines={1}>
              {document.document_name}
            </Text>
          </View>
          <WebView
            source={{ uri: resolveFileUrl(document.file_url) }}
            style={styles.webview}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webviewLoading}>
                <ActivityIndicator size="large" color={ACCENT} />
              </View>
            )}
            onError={() =>
              Alert.alert(
                'Cannot Load File',
                'Make sure the server is running and your device is on the same network.',
                [{ text: 'OK', onPress: () => setViewingFile(false) }],
              )
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FB',
    gap: spacing.md,
  },
  notFound: {
    ...typography.body,
    color: colors.textSecondary,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    alignItems: 'flex-start',
  },
  screenTitle: {
    ...typography.h4,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.lg,
  },
  footer: {
    backgroundColor: '#F8F9FB',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  headerCard: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: ACCENT + '1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  docName: {
    ...typography.h4,
    color: colors.text,
    textAlign: 'center',
  },
  docType: {
    ...typography.body,
    color: colors.textSecondary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.success + '1A',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  verifiedText: {
    ...typography.bodySmall,
    color: colors.success,
    fontWeight: '600',
  },
  detailCard: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: ACCENT,
    borderRadius: 10,
    height: 52,
    paddingHorizontal: spacing.lg,
  },
  viewBtnText: {
    ...typography.button,
    color: colors.textInverse,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#FFF',
    borderRadius: 10,
    height: 52,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  deleteBtnText: {
    ...typography.button,
    color: colors.error,
  },
  // Viewer styles — rendered as absoluteFillObject over the detail view
  viewerContainer: {
    backgroundColor: '#F8F9FB',
  },
  webviewLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FB',
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
    backgroundColor: '#FFF',
    gap: spacing.sm,
  },
  viewerClose: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
  },
  viewerCloseText: {
    ...typography.body,
    color: colors.text,
  },
  viewerTitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});
