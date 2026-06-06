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
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { timesheetApi } from '@/api/endpoints';
import { useAuthStore } from '@/store/auth.store';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

const ACCENT = '#4F6BF6';

dayjs.extend(customParseFormat);

// ── Helpers ───────────────────────────────────────────────────────────────────

const DATE_FORMAT = 'YYYY-MM-DD';
const TIME_FORMAT = 'HH:mm';
const DATETIME_FORMAT = `${DATE_FORMAT} ${TIME_FORMAT}`;

function parseDateTime(dateStr: string, timeStr: string): dayjs.Dayjs | null {
  const combined = `${dateStr.trim()} ${timeStr.trim()}`;
  const parsed = dayjs(combined, DATETIME_FORMAT, true);
  return parsed.isValid() ? parsed : null;
}

function todayStr(): string {
  return dayjs().format(DATE_FORMAT);
}

function nowTimeStr(): string {
  return dayjs().format(TIME_FORMAT);
}

// ── Field component ───────────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  hint?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  error?: string;
  maxLength?: number;
  keyboardType?: 'default' | 'numeric';
  multiline?: boolean;
}

function Field({
  label,
  hint,
  value,
  onChangeText,
  placeholder,
  error,
  maxLength,
  keyboardType = 'default',
  multiline,
}: FieldProps) {
  return (
    <View style={fieldStyles.wrapper}>
      <View style={fieldStyles.labelRow}>
        <Text style={fieldStyles.label}>{label}</Text>
        {hint ? <Text style={fieldStyles.hint}>{hint}</Text> : null}
      </View>
      <TextInput
        style={[
          fieldStyles.input,
          multiline && fieldStyles.multiline,
          error ? fieldStyles.inputError : null,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'auto'}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {error ? <Text style={fieldStyles.error}>{error}</Text> : null}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...typography.label,
    color: colors.text,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: '#F8F9FB',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.error,
  },
  multiline: {
    height: 100,
    paddingTop: spacing.md,
  },
  error: {
    ...typography.caption,
    color: colors.error,
  },
});

// ── Date/Time preset button ───────────────────────────────────────────────────
interface PresetBtnProps {
  label: string;
  onPress: () => void;
}

function PresetBtn({ label, onPress }: PresetBtnProps) {
  return (
    <TouchableOpacity style={presetStyles.btn} onPress={onPress}>
      <Text style={presetStyles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

const presetStyles = StyleSheet.create({
  btn: {
    backgroundColor: ACCENT + '15',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: {
    ...typography.caption,
    color: ACCENT,
    fontWeight: '600',
  },
});

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function ManualTimesheetEntryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { colors: c, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

  const [date, setDate] = useState(todayStr());
  const [clockInTime, setClockInTime] = useState('08:00');
  const [clockOutTime, setClockOutTime] = useState(nowTimeStr());
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [errors, setErrors] = useState<{
    date?: string;
    clockIn?: string;
    clockOut?: string;
  }>({});

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate(): boolean {
    const errs: typeof errors = {};

    // Date
    if (!dayjs(date.trim(), DATE_FORMAT, true).isValid()) {
      errs.date = 'Enter a valid date (YYYY-MM-DD)';
    }

    // Clock in
    const clockIn = parseDateTime(date, clockInTime);
    if (!clockIn) {
      errs.clockIn = 'Enter a valid time (HH:MM)';
    }

    // Clock out
    const clockOut = parseDateTime(date, clockOutTime);
    if (!clockOut) {
      errs.clockOut = 'Enter a valid time (HH:MM)';
    }

    if (clockIn && clockOut && !clockOut.isAfter(clockIn)) {
      errs.clockOut = 'Clock-out must be after clock-in';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;

    const clockIn = parseDateTime(date, clockInTime)!;
    const clockOut = parseDateTime(date, clockOutTime)!;

    if (!user?.id) {
      Alert.alert('Error', 'No user session. Please log in again.');
      return;
    }

    setSubmitting(true);
    try {
      await timesheetApi.createManual(user.id, {
        clock_in: clockIn.toISOString(),
        clock_out: clockOut.toISOString(),
        notes: notes.trim() || undefined,
      });

      Alert.alert('Entry Added', 'Your manual timesheet entry has been saved.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? 'Failed to save the entry. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing['3xl'] },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={18} color={colors.info} />
          <Text style={styles.infoText}>
            Manual entries may require manager approval before they appear in payroll.
          </Text>
        </View>

        {/* Form card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          {/* Date */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldHeader}>
              <Field
                label="Date"
                hint="YYYY-MM-DD"
                value={date}
                onChangeText={setDate}
                placeholder="2025-02-23"
                error={errors.date}
                maxLength={10}
              />
              <View style={styles.presets}>
                <PresetBtn label="Today" onPress={() => setDate(todayStr())} />
                <PresetBtn
                  label="Yesterday"
                  onPress={() => setDate(dayjs().subtract(1, 'day').format(DATE_FORMAT))}
                />
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Clock In Time */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldWithIcon}>
              <View style={[styles.timeIcon, { backgroundColor: colors.success + '20' }]}>
                <Ionicons name="log-in-outline" size={18} color={colors.success} />
              </View>
              <View style={styles.fieldFlex}>
                <Field
                  label="Clock In"
                  hint="24h format · HH:MM"
                  value={clockInTime}
                  onChangeText={setClockInTime}
                  placeholder="08:00"
                  error={errors.clockIn}
                  maxLength={5}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.presets}>
              <PresetBtn label="Now" onPress={() => setClockInTime(nowTimeStr())} />
              <PresetBtn label="07:00" onPress={() => setClockInTime('07:00')} />
              <PresetBtn label="08:00" onPress={() => setClockInTime('08:00')} />
              <PresetBtn label="09:00" onPress={() => setClockInTime('09:00')} />
            </View>
          </View>

          <View style={styles.divider} />

          {/* Clock Out Time */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldWithIcon}>
              <View style={[styles.timeIcon, { backgroundColor: colors.error + '20' }]}>
                <Ionicons name="log-out-outline" size={18} color={colors.error} />
              </View>
              <View style={styles.fieldFlex}>
                <Field
                  label="Clock Out"
                  hint="24h format · HH:MM"
                  value={clockOutTime}
                  onChangeText={setClockOutTime}
                  placeholder="17:00"
                  error={errors.clockOut}
                  maxLength={5}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.presets}>
              <PresetBtn label="Now" onPress={() => setClockOutTime(nowTimeStr())} />
              <PresetBtn label="16:00" onPress={() => setClockOutTime('16:00')} />
              <PresetBtn label="17:00" onPress={() => setClockOutTime('17:00')} />
              <PresetBtn label="18:00" onPress={() => setClockOutTime('18:00')} />
            </View>
          </View>

          {/* Duration preview */}
          {(() => {
            const cin = parseDateTime(date, clockInTime);
            const cout = parseDateTime(date, clockOutTime);
            if (!cin || !cout || !cout.isAfter(cin)) return null;
            const minutes = cout.diff(cin, 'minute');
            const h = Math.floor(minutes / 60);
            const m = minutes % 60;
            const label = [h > 0 ? `${h}h` : null, m > 0 ? `${m}m` : null]
              .filter(Boolean)
              .join(' ');
            return (
              <View style={styles.durationPreview}>
                <Ionicons name="time-outline" size={16} color={ACCENT} />
                <Text style={styles.durationText}>Duration: {label}</Text>
              </View>
            );
          })()}

          <View style={styles.divider} />

          {/* Notes */}
          <Field
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Reason for manual entry, project code, etc."
            multiline
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={c.textInverse} />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color={c.textInverse} />
              <Text style={styles.submitText}>Save Entry</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  // ── Info banner ───────────────────────────────────────────────────────────────
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: colors.info + '15',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
    lineHeight: 18,
  },
  // ── Form card ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fieldGroup: {
    gap: spacing.md,
  },
  fieldHeader: {
    gap: spacing.sm,
  },
  fieldFlex: {
    flex: 1,
  },
  fieldWithIcon: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  timeIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingLeft: 40 + spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  durationPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: ACCENT + '10',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  durationText: {
    ...typography.label,
    color: ACCENT,
  },
  // ── Buttons ───────────────────────────────────────────────────────────────────
  submitButton: {
    flexDirection: 'row',
    backgroundColor: ACCENT,
    borderRadius: 10,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    ...typography.button,
    color: colors.textInverse,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  cancelText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
