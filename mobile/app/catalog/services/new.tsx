import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { servicesCatalogApi } from '@/api/endpoints';
import { CategoryPickerModal } from '@/components/CategoryPickerModal';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

const ACCENT = '#4F6BF6';

// ─── Field components ─────────────────────────────────────────────────────────

function FieldLabel({ text, required, labelColor }: { text: string; required?: boolean; labelColor?: string }) {
  return (
    <Text style={[styles.label, labelColor ? { color: labelColor } : undefined]}>
      {text}{required && <Text style={styles.labelRequired}> *</Text>}
    </Text>
  );
}

function TextField({
  label, value, onChangeText, placeholder, required, multiline, keyboardType, error,
  labelColor, inputBgColor, inputBorderColor, textColor, placeholderColor,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; required?: boolean; multiline?: boolean;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad'; error?: string;
  labelColor?: string; inputBgColor?: string; inputBorderColor?: string; textColor?: string; placeholderColor?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <FieldLabel text={label} required={required} labelColor={labelColor} />
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMulti,
          !!error && styles.inputError,
          inputBgColor ? { backgroundColor: inputBgColor } : undefined,
          inputBorderColor ? { borderColor: inputBorderColor } : undefined,
          textColor ? { color: textColor } : undefined,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor ?? colors.textLight}
        autoCapitalize="sentences"
        autoCorrect={false}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={keyboardType ?? 'default'}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NewServiceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: c, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultPrice, setDefaultPrice] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [category, setCategory] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [nameError, setNameError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  useEffect(() => {
    servicesCatalogApi.getAll({ take: 100 }).then((res) => {
      const cats = Array.from(
        new Set((res.data.data ?? []).map((s) => s.category).filter(Boolean) as string[]),
      ).sort();
      setCategories(cats);
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError('Service name is required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await servicesCatalogApi.create({
        name: name.trim(),
        ...(description.trim() && { description: description.trim() }),
        ...(defaultPrice && { default_price: parseFloat(defaultPrice) }),
        ...(taxRate && { tax_rate: parseFloat(taxRate) }),
        ...(durationMinutes && { duration_minutes: parseInt(durationMinutes, 10) }),
        ...(category.trim() && { category: category.trim() }),
        is_active: isActive,
      });
      const newId = res.data.data?.id;
      if (newId) {
        router.replace(`/catalog/services/${newId}`);
      } else {
        router.back();
      }
    } catch {
      Alert.alert('Error', 'Could not create service. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, backgroundColor: headerBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="close" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>New Service</Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerBtn} disabled={submitting}>
          {submitting
            ? <ActivityIndicator size="small" color={ACCENT} />
            : <Text style={[styles.saveText, !name.trim() && styles.saveTextDisabled]}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing['3xl'] }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Basic Info */}
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Basic Info</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <TextField
            label="Service Name"
            required
            value={name}
            onChangeText={(v) => { setName(v); if (nameError) setNameError(''); }}
            placeholder="e.g. HVAC Installation"
            error={nameError}
            labelColor={c.textSecondary}
            inputBgColor={inputBg}
            inputBorderColor={borderColor}
            textColor={c.text}
            placeholderColor={c.textLight}
          />
          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: c.textSecondary }]}>Category</Text>
            <TouchableOpacity
              style={[styles.pickerBtn, { backgroundColor: inputBg, borderColor }]}
              onPress={() => setCategoryPickerOpen(true)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.pickerBtnText, { color: c.text }, !category && { color: c.textLight }]}
                numberOfLines={1}
              >
                {category || 'Select or type a category…'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={c.textLight} />
            </TouchableOpacity>
          </View>
          <TextField
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Optional description…"
            multiline
            labelColor={c.textSecondary}
            inputBgColor={inputBg}
            inputBorderColor={borderColor}
            textColor={c.text}
            placeholderColor={c.textLight}
          />
        </View>

        {/* Pricing */}
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Pricing</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.row}>
            <View style={styles.colLarge}>
              <TextField
                label="Base Price ($)"
                value={defaultPrice}
                onChangeText={setDefaultPrice}
                placeholder="0.00"
                keyboardType="decimal-pad"
                labelColor={c.textSecondary}
                inputBgColor={inputBg}
                inputBorderColor={borderColor}
                textColor={c.text}
                placeholderColor={c.textLight}
              />
            </View>
            <View style={styles.colSmall}>
              <TextField
                label="Tax Rate (%)"
                value={taxRate}
                onChangeText={setTaxRate}
                placeholder="0"
                keyboardType="decimal-pad"
                labelColor={c.textSecondary}
                inputBgColor={inputBg}
                inputBorderColor={borderColor}
                textColor={c.text}
                placeholderColor={c.textLight}
              />
            </View>
          </View>
        </View>

        {/* Duration */}
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Duration</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.fieldWrap}>
            <FieldLabel text="Est. Duration (minutes)" labelColor={c.textSecondary} />
            <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor }]}>
              <Ionicons name="time-outline" size={16} color={c.textLight} />
              <TextInput
                style={[styles.inputInner, { color: c.text }]}
                value={durationMinutes}
                onChangeText={setDurationMinutes}
                placeholder="e.g. 60"
                placeholderTextColor={c.textLight}
                keyboardType="number-pad"
              />
              {durationMinutes ? (
                <Text style={[styles.inputSuffix, { color: c.textSecondary }]}>min</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Status */}
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Status</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={[styles.switchLabel, { color: c.text }]}>Active</Text>
              <Text style={[styles.switchDesc, { color: c.textSecondary }]}>
                {isActive ? 'Service is available for use in estimates and work orders.' : 'Service is hidden from pickers.'}
              </Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ true: ACCENT, false: borderColor }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </ScrollView>

      <CategoryPickerModal
        visible={categoryPickerOpen}
        categories={categories}
        value={category}
        onSelect={setCategory}
        onClose={() => setCategoryPickerOpen(false)}
        title="Service Category"
      />
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FB' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBtn: { width: 56, alignItems: 'flex-start' },
  headerTitle: { ...typography.h4, color: colors.text, flex: 1, textAlign: 'center' },
  saveText: { ...typography.body, color: ACCENT, fontWeight: '700', textAlign: 'right' },
  saveTextDisabled: { color: colors.textLight },

  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.xs },

  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.sm,
  },
  fieldWrap: { marginBottom: spacing.md },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontSize: 11,
  },
  labelRequired: { color: '#ef4444' },
  input: {
    backgroundColor: '#F8F9FB',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...typography.body,
    color: colors.text,
  },
  inputMulti: { minHeight: 80, paddingTop: spacing.sm + 2 },
  inputError: { borderColor: '#ef4444' },
  errorText: { ...typography.bodySmall, color: '#ef4444', marginTop: 3 },

  row: { flexDirection: 'row', gap: spacing.md },
  colLarge: { flex: 2 },
  colSmall: { flex: 1 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F8F9FB',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  inputInner: { flex: 1, ...typography.body, color: colors.text, padding: 0 },
  inputSuffix: { ...typography.bodySmall, color: colors.textSecondary },

  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FB',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.xs,
  },
  pickerBtnText: { ...typography.body, color: colors.text, flex: 1 },
  pickerBtnPlaceholder: { color: colors.textLight },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  switchInfo: { flex: 1, gap: 2 },
  switchLabel: { ...typography.body, color: colors.text, fontWeight: '600' },
  switchDesc: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 17 },
});
