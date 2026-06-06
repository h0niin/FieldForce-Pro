import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { userDocumentsApi } from '@/api/endpoints';
import { DocumentType } from '@/types/models';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

const ACCENT = '#4F6BF6';

const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: DocumentType.CERTIFICATION, label: 'Certification', icon: 'ribbon-outline' },
  { value: DocumentType.LICENSE, label: 'License', icon: 'card-outline' },
  { value: DocumentType.ID_PROOF, label: 'ID Proof', icon: 'finger-print-outline' },
  { value: DocumentType.INSURANCE, label: 'Insurance', icon: 'shield-checkmark-outline' },
  { value: DocumentType.CONTRACT, label: 'Contract', icon: 'document-text-outline' },
  { value: DocumentType.OTHER, label: 'Other', icon: 'folder-outline' },
];

interface SelectedFile {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadDocumentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: themeColors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.CERTIFICATION);
  const [documentName, setDocumentName] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? 'application/octet-stream',
        size: asset.size ?? undefined,
      });
    }
  };

  const handleUpload = async () => {
    if (!documentName.trim()) {
      Alert.alert('Validation', 'Document name is required.');
      return;
    }
    if (!selectedFile) {
      Alert.alert('Validation', 'Please select a file to upload.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType,
      } as unknown as Blob);
      formData.append('document_type', documentType);
      formData.append('document_name', documentName.trim());
      if (issueDate.trim()) formData.append('issue_date', issueDate.trim());
      if (expiryDate.trim()) formData.append('expiry_date', expiryDate.trim());
      if (issuingAuthority.trim()) formData.append('issuing_authority', issuingAuthority.trim());
      if (documentNumber.trim()) formData.append('document_number', documentNumber.trim());
      if (notes.trim()) formData.append('notes', notes.trim());

      await userDocumentsApi.upload(formData);
      router.back();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Upload failed. Please try again.';
      Alert.alert('Upload Failed', message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, backgroundColor: headerBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Upload Document</Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Document Type */}
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.cardLabel, { color: themeColors.text }]}>Document Type</Text>
            <View style={styles.typeGrid}>
              {DOCUMENT_TYPE_OPTIONS.map((opt) => {
                const isActive = documentType === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.typeOption, { borderColor, backgroundColor: isDark ? themeColors.background : '#F8F9FB' }, isActive && styles.typeOptionActive]}
                    onPress={() => setDocumentType(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={20}
                      color={isActive ? colors.textInverse : themeColors.textSecondary}
                    />
                    <Text style={[styles.typeOptionText, { color: themeColors.textSecondary }, isActive && styles.typeOptionTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Document Details */}
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.cardLabel, { color: themeColors.text }]}>Details</Text>

            <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>
              Document Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor, color: themeColors.text }]}
              value={documentName}
              onChangeText={setDocumentName}
              placeholder="e.g. Electrician License 2025"
              placeholderTextColor={themeColors.textSecondary}
              returnKeyType="next"
            />

            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>Issue Date</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, borderColor, color: themeColors.text }]}
                  value={issueDate}
                  onChangeText={setIssueDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={themeColors.textSecondary}
                  keyboardType="numbers-and-punctuation"
                  returnKeyType="next"
                />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>Expiry Date</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, borderColor, color: themeColors.text }]}
                  value={expiryDate}
                  onChangeText={setExpiryDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={themeColors.textSecondary}
                  keyboardType="numbers-and-punctuation"
                  returnKeyType="next"
                />
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>Issuing Authority</Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor, color: themeColors.text }]}
              value={issuingAuthority}
              onChangeText={setIssuingAuthority}
              placeholder="e.g. State Licensing Board"
              placeholderTextColor={themeColors.textSecondary}
              returnKeyType="next"
            />

            <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>Document Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor, color: themeColors.text }]}
              value={documentNumber}
              onChangeText={setDocumentNumber}
              placeholder="e.g. LIC-12345"
              placeholderTextColor={themeColors.textSecondary}
              returnKeyType="next"
            />

            <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: inputBg, borderColor, color: themeColors.text }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional notes..."
              placeholderTextColor={themeColors.textSecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* File Picker */}
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.cardLabel, { color: themeColors.text }]}>
              Attachment <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity style={[styles.filePicker, { borderColor }]} onPress={handlePickDocument} activeOpacity={0.7}>
              {selectedFile ? (
                <View style={styles.fileSelected}>
                  <View style={styles.fileIconWrap}>
                    <Ionicons name="document" size={24} color={ACCENT} />
                  </View>
                  <View style={styles.fileInfo}>
                    <Text style={[styles.fileName, { color: themeColors.text }]} numberOfLines={1}>{selectedFile.name}</Text>
                    {selectedFile.size ? (
                      <Text style={[styles.fileSize, { color: themeColors.textSecondary }]}>{formatFileSize(selectedFile.size)}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedFile(null)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={22} color={themeColors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.fileEmpty}>
                  <View style={styles.fileEmptyIcon}>
                    <Ionicons name="cloud-upload-outline" size={28} color={ACCENT} />
                  </View>
                  <Text style={[styles.fileEmptyTitle, { color: themeColors.text }]}>Tap to select a file</Text>
                  <Text style={[styles.fileEmptySubtitle, { color: themeColors.textSecondary }]}>PDF, images, or any document</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Sticky footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg, backgroundColor: isDark ? themeColors.background : '#F8F9FB', borderTopColor: borderColor }]}>
          <TouchableOpacity
            style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
            onPress={handleUpload}
            disabled={uploading}
            activeOpacity={0.8}
          >
            {uploading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={20} color={colors.textInverse} />
                <Text style={styles.uploadBtnText}>Upload Document</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: '#FFF',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBtn: { width: 40, alignItems: 'flex-start' },
  headerCenter: { flex: 1 },
  headerTitle: { ...typography.h4, color: colors.text },

  content: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },

  // Section cards
  card: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.sm,
  },
  cardLabel: {
    ...typography.label,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },

  // Type grid
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8F9FB',
  },
  typeOptionActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  typeOptionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  typeOptionTextActive: {
    color: colors.textInverse,
  },

  // Form fields
  fieldLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  required: { color: colors.error },
  input: {
    backgroundColor: '#F8F9FB',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  fieldRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fieldHalf: {
    flex: 1,
    gap: spacing.sm,
  },

  // File picker
  filePicker: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  fileEmpty: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.xs,
  },
  fileEmptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ACCENT + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  fileEmptyTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  fileEmptySubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  fileSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: ACCENT + '08',
  },
  fileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: ACCENT + '15',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  fileInfo: { flex: 1, gap: 2 },
  fileName: { ...typography.body, fontWeight: '600', color: colors.text },
  fileSize: { ...typography.caption, color: colors.textSecondary },

  // Footer
  footer: {
    backgroundColor: '#F8F9FB',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: ACCENT,
    borderRadius: borderRadius.lg,
    height: 52,
    paddingHorizontal: spacing.lg,
  },
  uploadBtnDisabled: { opacity: 0.6 },
  uploadBtnText: { ...typography.button, color: colors.textInverse },
});
