import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Q } from '@nozbe/watermelondb';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { DateTimePickerModal } from '@/components/DateTimePickerModal';

const ACCENT = '#4F6BF6';
import { SignaturePad } from '@/components/SignaturePad';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { database } from '@/db/database';
import { syncDatabase } from '@/db/sync';
import { useOffline } from '@/hooks/use-offline';
import { goBack } from '@/utils/navigation';
import JobSheetModel from '@/db/models/JobSheet';
import { jobSheetInstancesApi, jobSheetItemsApi } from '@/api/endpoints';
import type { ChecklistItemData } from '@/types/models';

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ChecklistScreen() {
  const insets = useSafeAreaInsets();
  const { id, instanceId, appointmentId } = useLocalSearchParams<{ id: string; instanceId?: string; appointmentId?: string }>();
  const { isConnected } = useOffline();
  const { colors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

  const [items, setItems] = useState<ChecklistItemData[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerItemId, setDatePickerItemId] = useState<string | null>(null);
  const [itemSignatureId, setItemSignatureId] = useState<string | null>(null);
  const sigPadRef = useRef<import('@/components/SignaturePad').SignaturePadHandle>(null);

  const jobSheetRef = useRef<JobSheetModel | null>(null);

  const completedCount = items.filter((i) => i.completed).length;
  const progress = items.length > 0 ? completedCount / items.length : 0;
  const allComplete = items.length > 0 && completedCount === items.length;

  // ── Load from API / WatermelonDB on mount ──────────────────────────────────

  useEffect(() => {
    void loadJobSheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadJobSheet = async () => {
    if (!instanceId) {
      try {
        const results = await database
          .get<JobSheetModel>('job_sheets')
          .query(Q.where('work_order_id', id ?? ''))
          .fetch();

        if (results.length > 0) {
          const record = results[0];
          jobSheetRef.current = record;
          if (record.checklistItems) {
            const parsed = JSON.parse(record.checklistItems) as ChecklistItemData[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              setItems(parsed);
              const firstIncomplete = parsed.find((item) => !item.completed);
              if (firstIncomplete) setExpandedId(firstIncomplete.id);
              setIsLoading(false);
              return;
            }
          }
        }
      } catch {
        // WatermelonDB not available
      }
      setHasError(true);
      setIsLoading(false);
      return;
    }

    try {
      let loadedFromApi = false;

      if (isConnected) {
        try {
          const [instanceRes, itemsRes] = await Promise.all([
            jobSheetInstancesApi.getById(instanceId),
            jobSheetItemsApi.getByInstance(instanceId),
          ]);

          const instanceData = instanceRes.data?.data;
          const itemsData = itemsRes.data?.data;

          if (instanceData && itemsData && Array.isArray(itemsData)) {
            const fetchedItems = itemsData
              .map((item: any) => ({
                id: item.id,
                instance_id: item.instance_id,
                label: item.label,
                type: item.type,
                value: item.value,
                is_required: item.is_required,
                completed:
                  item.type === 'checkbox'
                    ? item.value === 'true'
                    : item.value !== null && item.value !== '' && item.value !== undefined,
                notes: item.type === 'checkbox' ? item.value : null,
                photo_url: item.photo_url || null,
              }))
              .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));

            if (fetchedItems.length > 0) {
              setItems(fetchedItems);
              const firstIncomplete = fetchedItems.find((item: any) => !item.completed);
              if (firstIncomplete) setExpandedId(firstIncomplete.id);

              // Mark as already submitted if instance status is completed
              if (instanceData.status === 'completed') {
                setIsSubmitted(true);
              }

              loadedFromApi = true;
            }
          }
        } catch (apiError) {
          console.warn('[Diagnostic] Failed to fetch jobsheet from API, falling back to local:', apiError);
        }
      }

      if (!loadedFromApi) {
        try {
          const results = await database
            .get<JobSheetModel>('job_sheets')
            .query(Q.where('work_order_id', id ?? ''))
            .fetch();

          if (results.length > 0) {
            const record = results[0];
            jobSheetRef.current = record;
            if (record.checklistItems) {
              const parsed = JSON.parse(record.checklistItems) as ChecklistItemData[];
              if (Array.isArray(parsed) && parsed.length > 0) {
                setItems(parsed);
                const firstIncomplete = parsed.find((item) => !item.completed);
                if (firstIncomplete) setExpandedId(firstIncomplete.id);
              }
            }
          }
        } catch {
          // WatermelonDB not available
        }
      }
    } catch {
      // Continue with empty items
    } finally {
      setIsLoading(false);
    }
  };

  // ── Persist to WatermelonDB ────────────────────────────────────────────────

  const persistToDb = useCallback(
    async (updatedItems: ChecklistItemData[]) => {
      try {
        await database.write(async () => {
          if (jobSheetRef.current) {
            await jobSheetRef.current.update((record) => {
              record.checklistItems = JSON.stringify(updatedItems);
            });
          } else {
            const created = await database
              .get<JobSheetModel>('job_sheets')
              .create((record) => {
                record.workOrderId = id ?? '';
                record.appointmentId = appointmentId ?? '';
                record.technicianId = '';
                record.checklistItems = JSON.stringify(updatedItems);
              });
            jobSheetRef.current = created;
          }
        });
      } catch {
        // Silent fail – React state remains the source of truth
      }
    },
    [id, appointmentId],
  );

  // ── Helpers ────────────────────────────────────────────────────────────────

  const advanceToNext = useCallback((currentItemId: string) => {
    setItems((current) => {
      const currentIdx = current.findIndex((i) => i.id === currentItemId);
      const nextIncomplete = current.find((i, idx) => idx > currentIdx && !i.completed);
      if (nextIncomplete) {
        setExpandedId(nextIncomplete.id);
      } else {
        const anyIncomplete = current.find((i) => !i.completed);
        setExpandedId(anyIncomplete?.id ?? null);
      }
      return current;
    });
  }, []);

  // ── Item handlers ──────────────────────────────────────────────────────────

  const handleCheckboxToggle = useCallback(
    (itemId: string) => {
      setItems((prev) => {
        const item = prev.find((i) => i.id === itemId);
        if (!item) return prev;
        const newVal = !item.completed;
        const updated = prev.map((i) =>
          i.id === itemId ? { ...i, completed: newVal, value: newVal ? 'true' : 'false' } : i,
        );
        void persistToDb(updated);
        return updated;
      });
    },
    [persistToDb],
  );

  const handleValueChange = useCallback(
    (itemId: string, value: string) => {
      setItems((prev) => {
        const updated = prev.map((i) => {
          if (i.id === itemId) {
            const isNoteOnly = !i.type || i.type === 'checkbox';
            return {
              ...i,
              value: isNoteOnly ? i.value : value,
              notes: isNoteOnly ? value : i.notes,
            };
          }
          return i;
        });
        void persistToDb(updated);
        return updated;
      });
    },
    [persistToDb],
  );

  const handleMarkDone = useCallback(
    (itemId: string) => {
      setItems((prev) => {
        const item = prev.find((i) => i.id === itemId);
        if (!item || item.completed) return prev;

        if (item.is_required) {
          if ((item.type === 'text' || item.type === 'number' || item.type === 'date') && !item.value) {
            Alert.alert('Required', 'Please provide a value for this item.');
            return prev;
          }
          if (item.type === 'photo' && !item.photo_url) {
            Alert.alert('Required', 'Please attach a photo.');
            return prev;
          }
          if (item.type === 'signature' && !item.value) {
            Alert.alert('Required', 'Please capture a signature.');
            return prev;
          }
        }

        const updated = prev.map((i) =>
          i.id === itemId
            ? { ...i, completed: true, value: i.type === 'checkbox' ? 'true' : i.value }
            : i,
        );
        void persistToDb(updated);
        return updated;
      });
      setTimeout(() => advanceToNext(itemId), 300);
    },
    [persistToDb, advanceToNext],
  );

  const handleUndoItem = useCallback(
    (itemId: string) => {
      setItems((prev) => {
        const updated = prev.map((i) =>
          i.id === itemId
            ? { ...i, completed: false, value: i.type === 'checkbox' ? null : i.value }
            : i,
        );
        void persistToDb(updated);
        return updated;
      });
      setExpandedId(itemId);
    },
    [persistToDb],
  );

  const handlePhotoCapture = useCallback(
    (itemId: string) => {
      const pickImage = async (source: 'camera' | 'gallery') => {
        const launcher =
          source === 'camera'
            ? ImagePicker.launchCameraAsync
            : ImagePicker.launchImageLibraryAsync;

        const result = await launcher({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          const uri = result.assets[0].uri;
          setItems((prev) => {
            const updated = prev.map((i) =>
              i.id === itemId ? { ...i, photo_url: uri, completed: true, value: uri } : i,
            );
            void persistToDb(updated);
            return updated;
          });
          setTimeout(() => advanceToNext(itemId), 300);
        }
      };

      Alert.alert('Add Photo', 'Choose a source', [
        { text: 'Camera', onPress: () => void pickImage('camera') },
        { text: 'Gallery', onPress: () => void pickImage('gallery') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    },
    [persistToDb, advanceToNext],
  );

  const handleDateSelect = useCallback(
    (date: Date) => {
      if (!datePickerItemId) return;
      const dateStr = date.toISOString().split('T')[0];
      const targetId = datePickerItemId;
      setItems((prev) => {
        const updated = prev.map((i) =>
          i.id === targetId ? { ...i, value: dateStr, completed: true } : i,
        );
        void persistToDb(updated);
        return updated;
      });
      setDatePickerVisible(false);
      setDatePickerItemId(null);
      setTimeout(() => advanceToNext(targetId), 300);
    },
    [datePickerItemId, persistToDb, advanceToNext],
  );

  const handleItemSignatureSave = useCallback(
    (signature: string) => {
      if (!itemSignatureId) return;
      const targetId = itemSignatureId;
      setItems((prev) => {
        const updated = prev.map((i) =>
          i.id === targetId ? { ...i, value: signature, completed: true } : i,
        );
        void persistToDb(updated);
        return updated;
      });
      setItemSignatureId(null);
      setTimeout(() => advanceToNext(targetId), 300);
    },
    [itemSignatureId, persistToDb, advanceToNext],
  );

  // Auto-open signature pad for signature items
  useEffect(() => {
    if (!expandedId) return;
    const activeItem = items.find((i) => i.id === expandedId);
    if (activeItem?.type === 'signature' && !activeItem.value) {
      setItemSignatureId(activeItem.id);
    }
  }, [expandedId, items]);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!allComplete) {
      Alert.alert('Incomplete', 'Please complete all checklist items before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      await persistToDb(items);

      if (instanceId && isConnected) {
        try {
          const updatePromises = items.map((item) => {
            if (item.id.length > 10) {
              return jobSheetItemsApi.update(item.id, {
                value:
                  item.type === 'checkbox'
                    ? item.completed
                      ? 'true'
                      : 'false'
                    : item.value || item.notes,
                photo_url: item.photo_url,
              });
            }
            return Promise.resolve();
          });

          await Promise.all(updatePromises);

          await jobSheetInstancesApi.update(instanceId, {
            status: 'completed',
          });
        } catch (apiError) {
          console.warn('[Diagnostic] Sync to API failed:', apiError);
        }
      }

      if (isConnected) {
        try {
          await syncDatabase(database);
        } catch {
          // Sync failure is non-fatal
        }
      }

      setIsSubmitted(true);
    } catch {
      Alert.alert('Error', 'Failed to submit checklist. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render: type-specific controls for expanded item ───────────────────────

  const renderItemControls = (item: ChecklistItemData) => {
    switch (item.type) {
      case 'checkbox':
        return null; // Checkbox toggle is handled by the row itself

      case 'text':
        return (
          <View style={styles.controlBlock}>
            <TextInput
              style={[styles.input, { minHeight: 80, backgroundColor: inputBg, borderColor, color: colors.text }]}
              placeholder="Enter your response..."
              placeholderTextColor={colors.textLight}
              value={item.value ?? ''}
              onChangeText={(t) => handleValueChange(item.id, t)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            {!item.completed && (
              <TouchableOpacity
                style={[styles.markDoneBtn, !item.value && styles.markDoneBtnDisabled]}
                onPress={() => handleMarkDone(item.id)}
                disabled={item.is_required && !item.value}
              >
                <Ionicons name="checkmark-circle" size={18} color={colors.textInverse} />
                <Text style={styles.markDoneBtnText}>Mark as Done</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 'number':
        return (
          <View style={styles.controlBlock}>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor, color: colors.text }]}
              placeholder="Enter a number..."
              placeholderTextColor={colors.textLight}
              value={item.value ?? ''}
              onChangeText={(t) => handleValueChange(item.id, t)}
              keyboardType="numeric"
            />
            {!item.completed && (
              <TouchableOpacity
                style={[styles.markDoneBtn, !item.value && styles.markDoneBtnDisabled]}
                onPress={() => handleMarkDone(item.id)}
                disabled={item.is_required && !item.value}
              >
                <Ionicons name="checkmark-circle" size={18} color={colors.textInverse} />
                <Text style={styles.markDoneBtnText}>Mark as Done</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 'date':
        return (
          <View style={styles.controlBlock}>
            <TouchableOpacity
              style={[styles.dateRow, { backgroundColor: inputBg, borderColor }]}
              onPress={() => {
                setDatePickerItemId(item.id);
                setDatePickerVisible(true);
              }}
            >
              <Ionicons name="calendar-outline" size={20} color={ACCENT} />
              <Text style={item.value ? styles.dateValue : styles.datePlaceholder}>
                {item.value || 'Tap to select a date'}
              </Text>
            </TouchableOpacity>
            {!item.completed && item.value && (
              <TouchableOpacity style={styles.markDoneBtn} onPress={() => handleMarkDone(item.id)}>
                <Ionicons name="checkmark-circle" size={18} color={colors.textInverse} />
                <Text style={styles.markDoneBtnText}>Mark as Done</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 'photo':
        return (
          <View style={styles.controlBlock}>
            {item.photo_url && (
              <Image source={{ uri: item.photo_url }} style={styles.photoPreview} />
            )}
            <TouchableOpacity
              style={styles.photoBtn}
              onPress={() => handlePhotoCapture(item.id)}
            >
              <Ionicons
                name={item.photo_url ? 'image-outline' : 'camera-outline'}
                size={20}
                color={ACCENT}
              />
              <Text style={styles.photoBtnText}>
                {item.photo_url ? 'Replace Photo' : 'Take or Choose Photo'}
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'signature':
        return (
          <View style={styles.controlBlock}>
            {item.value ? (
              <View style={styles.sigPreview}>
                <Image
                  source={{ uri: item.value }}
                  style={styles.sigImage}
                  resizeMode="contain"
                />
                <TouchableOpacity
                  style={styles.sigClearBtn}
                  onPress={() => {
                    setItems((prev) => {
                      const updated = prev.map((i) =>
                        i.id === item.id ? { ...i, value: null, completed: false } : i,
                      );
                      void persistToDb(updated);
                      return updated;
                    });
                  }}
                >
                  <Ionicons name="refresh-outline" size={14} color={colors.error} />
                  <Text style={styles.sigClearText}>Re-sign</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.sigPad}>
                  <SignaturePad
                    ref={sigPadRef}
                    height={150}
                    onSave={(sig) => handleItemSignatureSave(sig)}
                    onClear={() => {}}
                  />
                </View>
                <View style={styles.sigActions}>
                  <TouchableOpacity
                    style={styles.sigClearBtn}
                    onPress={() => sigPadRef.current?.clear()}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                    <Text style={styles.sigClearText}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.markDoneBtn}
                    onPress={() => sigPadRef.current?.save()}
                  >
                    <Ionicons name="checkmark-circle" size={18} color={colors.textInverse} />
                    <Text style={styles.markDoneBtnText}>Save Signature</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        );

      default:
        return (
          <View style={styles.controlBlock}>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor, color: colors.text }]}
              placeholder="Add notes..."
              placeholderTextColor={colors.textLight}
              value={item.notes ?? ''}
              onChangeText={(t) => handleValueChange(item.id, t)}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
            {!item.completed && (
              <TouchableOpacity style={styles.markDoneBtn} onPress={() => handleMarkDone(item.id)}>
                <Ionicons name="checkmark-circle" size={18} color={colors.textInverse} />
                <Text style={styles.markDoneBtnText}>Mark as Done</Text>
              </TouchableOpacity>
            )}
          </View>
        );
    }
  };

  const getCompletedValue = (item: ChecklistItemData): string => {
    if (item.type === 'checkbox') return 'Done';
    if (item.type === 'photo') return item.photo_url ? 'Photo attached' : '';
    if (item.type === 'signature') return item.value ? 'Signature captured' : '';
    if (item.type === 'date') return item.value ?? '';
    return item.value ?? item.notes ?? '';
  };

  // ── Loading state ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: isDark ? colors.background : '#F8F9FB' }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (hasError || items.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: isDark ? colors.background : '#F8F9FB' }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textLight} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>No Job Sheet Found</Text>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          This job sheet could not be loaded. It may not have been assigned yet, or you may be offline.
        </Text>
        <TouchableOpacity style={styles.confirmButton} onPress={() => goBack()}>
          <Ionicons name="arrow-back" size={18} color={colors.textInverse} />
          <Text style={styles.confirmButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <>
      <OfflineIndicator />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={[styles.container, { backgroundColor: isDark ? colors.background : '#F8F9FB' }]}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + spacing.md,
              paddingBottom: insets.bottom + spacing['2xl'],
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back */}
          <TouchableOpacity style={styles.backButton} onPress={() => goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.headerIcon, isSubmitted && { backgroundColor: colors.success + '15' }]}>
              <Ionicons
                name={isSubmitted ? 'checkmark-circle' : 'clipboard'}
                size={28}
                color={isSubmitted ? colors.success : ACCENT}
              />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              {isSubmitted ? 'Checklist Completed' : 'Job Checklist'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {isSubmitted
                ? 'All checklist items have been completed and submitted.'
                : 'Complete all items below to finish this job sheet'}
            </Text>
          </View>

          {/* Completed banner */}
          {isSubmitted && (
            <View style={styles.completedBanner}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <Text style={styles.completedBannerText}>
                All {items.length} items completed successfully
              </Text>
            </View>
          )}

          {/* Progress */}
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%` as `${number}%` },
                allComplete && styles.progressFillComplete,
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {completedCount}/{items.length} items completed
          </Text>

          {/* Checklist */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.textSecondary : '#64748B' }]}>Checklist Items</Text>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              {items.map((item, index) => {
                const isExpanded = expandedId === item.id;
                const isCompleted = item.completed;
                const itemLabel = item.label || `Item ${index + 1}`;
                const isCheckbox = item.type === 'checkbox' || !item.type;

                return (
                  <View key={item.id}>
                    {/* Item row */}
                    <TouchableOpacity
                      style={styles.itemRow}
                      activeOpacity={0.6}
                      onPress={() => {
                        if (isCheckbox && !isExpanded) {
                          handleCheckboxToggle(item.id);
                        } else {
                          setExpandedId(isExpanded ? null : item.id);
                        }
                      }}
                    >
                      {/* Left: checkbox / status icon */}
                      {isCompleted ? (
                        <Ionicons name="checkbox" size={24} color={colors.success} />
                      ) : (
                        <Ionicons name="square-outline" size={24} color={colors.textLight} />
                      )}

                      {/* Middle: label + meta */}
                      <View style={styles.itemInfo}>
                        <Text
                          style={[
                            styles.itemLabel, { color: colors.text },
                            isCompleted && styles.itemLabelDone,
                          ]}
                          numberOfLines={isExpanded ? undefined : 2}
                        >
                          {itemLabel}
                        </Text>
                        {isCompleted && (
                          <Text style={styles.itemValue} numberOfLines={1}>
                            {getCompletedValue(item)}
                          </Text>
                        )}
                        {!isCompleted && !isCheckbox && (
                          <Text style={styles.itemHint}>
                            {item.type === 'text' ? 'Text input' :
                             item.type === 'number' ? 'Number input' :
                             item.type === 'date' ? 'Date selection' :
                             item.type === 'photo' ? 'Photo capture' :
                             item.type === 'signature' ? 'Signature' : 'Input'}
                            {item.is_required ? ' (required)' : ''}
                          </Text>
                        )}
                      </View>

                      {/* Right: expand arrow (non-checkbox) or required dot */}
                      {!isCheckbox ? (
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color={colors.textLight}
                        />
                      ) : (
                        item.is_required && !isCompleted && (
                          <View style={styles.requiredDot} />
                        )
                      )}
                    </TouchableOpacity>

                    {/* Expanded controls */}
                    {isExpanded && (
                      <View style={styles.expandedSection}>
                        {item.is_required && !isCompleted && (
                          <View style={styles.requiredTag}>
                            <Ionicons name="alert-circle" size={12} color={colors.error} />
                            <Text style={styles.requiredTagText}>Required</Text>
                          </View>
                        )}
                        {renderItemControls(item)}
                        {isCompleted && (
                          <TouchableOpacity
                            style={styles.undoBtn}
                            onPress={() => handleUndoItem(item.id)}
                          >
                            <Ionicons name="arrow-undo-outline" size={14} color={colors.textSecondary} />
                            <Text style={styles.undoBtnText}>Undo</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    {/* Divider */}
                    {index < items.length - 1 && <View style={styles.divider} />}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Submit / Back button */}
          {isSubmitted ? (
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => goBack()}
            >
              <Ionicons name="arrow-back" size={18} color={colors.textInverse} />
              <Text style={styles.confirmButtonText}>Go Back</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.confirmButton,
                (!allComplete || isSubmitting) && styles.confirmButtonDisabled,
              ]}
              disabled={!allComplete || isSubmitting}
              onPress={handleSubmit}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={allComplete ? colors.textInverse : colors.textLight}
                  />
                  <Text
                    style={[
                      styles.confirmButtonText,
                      !allComplete && { color: colors.textLight },
                    ]}
                  >
                    {allComplete
                      ? 'Submit Checklist'
                      : `Complete All ${items.length} Items First`}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date picker modal */}
      <DateTimePickerModal
        visible={datePickerVisible}
        value={
          datePickerItemId
            ? items.find((i) => i.id === datePickerItemId)?.value ?? undefined
            : undefined
        }
        mode="date"
        title="Select Date"
        onConfirm={handleDateSelect}
        onClose={() => {
          setDatePickerVisible(false);
          setDatePickerItemId(null);
        }}
      />
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FB',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  content: {
    padding: spacing.lg,
  },

  // ── Header (matches on-site.tsx) ──
  backButton: {
    marginBottom: spacing.lg,
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ACCENT + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  errorTitle: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // ── Completed banner ──
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.success + '15',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xl,
    borderWidth: 1,
    borderColor: colors.success + '40',
    marginBottom: spacing['2xl'],
  },
  completedBannerText: {
    ...typography.body,
    color: colors.success,
    fontWeight: '600',
  },

  // ── Progress (matches on-site.tsx) ──
  progressBar: {
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: ACCENT,
    borderRadius: borderRadius.full,
  },
  progressFillComplete: {
    backgroundColor: colors.success,
  },
  progressText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing['2xl'],
  },

  // ── Section (matches appointment/[id].tsx) ──
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },

  // ── Card (matches on-site.tsx card) ──
  card: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },

  // ── Item row (matches ChecklistItem.tsx) ──
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemLabel: {
    ...typography.body,
    color: colors.text,
  },
  itemLabelDone: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  itemValue: {
    ...typography.bodySmall,
    color: colors.success,
    marginTop: 2,
  },
  itemHint: {
    ...typography.caption,
    color: colors.textLight,
    marginTop: 2,
  },
  requiredDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.error,
  },

  // ── Expanded section ──
  expandedSection: {
    paddingBottom: spacing.md,
    paddingLeft: 36, // align with label (icon 24 + gap 12)
  },
  requiredTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.sm,
  },
  requiredTagText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
  },
  controlBlock: {
    gap: spacing.sm,
  },

  // ── Inputs ──
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: '#F8F9FB',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },

  // ── Mark done button ──
  markDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingVertical: spacing.sm,
  },
  markDoneBtnDisabled: {
    opacity: 0.4,
  },
  markDoneBtnText: {
    ...typography.label,
    color: colors.textInverse,
  },

  // ── Date ──
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#F8F9FB',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  dateValue: {
    ...typography.body,
    color: colors.text,
  },
  datePlaceholder: {
    ...typography.body,
    color: colors.textLight,
  },

  // ── Photo ──
  photoPreview: {
    width: '100%',
    height: 150,
    borderRadius: borderRadius.md,
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: ACCENT + '10',
    borderWidth: 1,
    borderColor: ACCENT + '30',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    borderStyle: 'dashed',
  },
  photoBtnText: {
    ...typography.label,
    color: ACCENT,
  },

  // ── Signature (item-level) ──
  sigPreview: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  sigImage: {
    width: '100%',
    height: 100,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sigPad: {
    height: 180,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  sigActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sigClearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sigClearText: {
    ...typography.bodySmall,
    color: colors.error,
  },

  // ── Undo ──
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  undoBtnText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },

  // ── Confirm button (matches on-site.tsx) ──
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: ACCENT,
    borderRadius: 10,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.borderLight,
  },
  confirmButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
});
