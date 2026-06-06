import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  workOrdersApi,
  workOrderNotesApi,
  workOrderAttachmentsApi,
  workOrderLineItemsApi,
  estimatesApi,
} from '@/api/endpoints';
import AuditLogger, { AUDIT_ACTIONS, AUDIT_MODULES } from '@/utils/AuditLogger';
import { StatusBadge } from '@/components/StatusBadge';
import { MapNavigation } from '@/components/MapNavigation';
import { WorkOrderToolsModal } from '@/components/WorkOrderToolsModal';
import { formatDateTime, formatCurrency, formatRelative } from '@/utils/format';
import { PRIORITY_COLORS, STATUS_TRANSITIONS, STATUS_LABELS, STATUS_COLORS } from '@/utils/constants';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { goBack } from '@/utils/navigation';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuthStore } from '@/store/auth.store';

const ACCENT = '#4F6BF6';
import type {
  WorkOrder,
  WorkOrderNote,
  WorkOrderAttachment,
  WorkOrderLineItem,
  Estimate,
} from '@/types/models';

// ─── Tab definition ───────────────────────────────────────────────────────────

type Tab = 'details' | 'notes' | 'attachments' | 'line_items' | 'estimates';

interface TabConfig {
  key: Tab;
  label: string;
  icon: string;
}

const TABS: TabConfig[] = [
  { key: 'details', label: 'Details', icon: 'information-circle-outline' },
  { key: 'notes', label: 'Notes', icon: 'chatbox-outline' },
  { key: 'attachments', label: 'Files', icon: 'attach-outline' },
  { key: 'line_items', label: 'Items', icon: 'list-outline' },
  { key: 'estimates', label: 'Estimates', icon: 'document-text-outline' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function lineItemTypeIcon(type: string): string {
  if (type === 'part') return 'cube-outline';
  if (type === 'travel') return 'car-outline';
  return 'construct-outline'; // service
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function WorkOrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id, fromAsset } = useLocalSearchParams<{ id: string; fromAsset?: string }>();
  const router = useRouter();
  const { colors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('details');

  // Tab data
  const [notes, setNotes] = useState<WorkOrderNote[]>([]);
  const [attachments, setAttachments] = useState<WorkOrderAttachment[]>([]);
  const [lineItems, setLineItems] = useState<WorkOrderLineItem[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [estimatesLoading, setEstimatesLoading] = useState(false);
  const [estimateActionLoading, setEstimateActionLoading] = useState<string | null>(null);

  // Note compose
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Status update
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [acceptDeclineLoading, setAcceptDeclineLoading] = useState<'accept' | 'decline' | null>(null);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  const currentUserId = useAuthStore((s) => s.user?.id);

  // Tools Modal
  const [showToolsModal, setShowToolsModal] = useState(false);

  // Attachment upload
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // ─── Fetch work order ───────────────────────────────────────────────────────
  const fetchWorkOrder = useCallback(async () => {
    if (!id) return;
    try {
      const res = await workOrdersApi.getById(id);
      setWorkOrder(res.data.data ?? null);
    } catch { /* offline-tolerant */ }
    finally { setLoading(false); }
  }, [id]);

  // ─── Fetch tab data ─────────────────────────────────────────────────────────
  const fetchNotes = useCallback(async () => {
    if (!id) return;
    try {
      const res = await workOrderNotesApi.getByWorkOrder(id);
      setNotes(res.data.data ?? []);
    } catch { /* silently fail */ }
  }, [id]);

  const fetchAttachments = useCallback(async () => {
    if (!id) return;
    try {
      const res = await workOrderAttachmentsApi.getByWorkOrder(id);
      setAttachments(res.data.data ?? []);
    } catch { /* silently fail */ }
  }, [id]);

  const fetchLineItems = useCallback(async () => {
    if (!id) return;
    try {
      const res = await workOrderLineItemsApi.getByWorkOrder(id);
      setLineItems(res.data.data ?? []);
    } catch { /* silently fail */ }
  }, [id]);

  const fetchEstimates = useCallback(async () => {
    if (!id) return;
    setEstimatesLoading(true);
    try {
      const res = await estimatesApi.getByWorkOrder(id);
      setEstimates(res.data.data ?? []);
    } catch { /* silently fail */ }
    finally { setEstimatesLoading(false); }
  }, [id]);

  useEffect(() => { fetchWorkOrder(); }, [fetchWorkOrder]);

  // Lazy-load tab data when switching tabs
  useEffect(() => {
    if (activeTab === 'notes') fetchNotes();
    if (activeTab === 'attachments') fetchAttachments();
    if (activeTab === 'line_items') fetchLineItems();
    if (activeTab === 'estimates') fetchEstimates();
  }, [activeTab, fetchNotes, fetchAttachments, fetchLineItems, fetchEstimates]);

  // Android hardware back button
  useEffect(() => {
    if (!fromAsset) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      router.back();
      return true;
    });
    return () => sub.remove();
  }, [fromAsset, router]);

  // ─── Note submission ────────────────────────────────────────────────────────
  const handleAddNote = async () => {
    if (!newNote.trim() || !id) return;
    setSavingNote(true);
    try {
      const res = await workOrderNotesApi.create({
        work_order_id: id,
        content: newNote.trim(),
        is_internal: true,
      });
      const created = res.data.data;
      if (created) setNotes((prev) => [created, ...prev]);
      setNewNote('');
      AuditLogger.log({
        action: AUDIT_ACTIONS.WO_NOTE_ADDED,
        module: AUDIT_MODULES.WORK_ORDERS,
        record_id: id,
        new_values: { work_order_id: id, note_id: created?.id },
      });
    } catch {
      Alert.alert('Error', 'Failed to save note. Please try again.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await workOrderNotesApi.delete(noteId);
            setNotes((prev) => prev.filter((n) => n.id !== noteId));
          } catch {
            Alert.alert('Error', 'Failed to delete note.');
          }
        },
      },
    ]);
  };

  const handleDeleteLineItem = (itemId: string) => {
    Alert.alert('Remove Item', 'Remove this line item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await workOrderLineItemsApi.delete(itemId);
            setLineItems((prev) => prev.filter((i) => i.id !== itemId));
          } catch {
            Alert.alert('Error', 'Failed to remove line item.');
          }
        },
      },
    ]);
  };

  // ─── Attachment upload ───────────────────────────────────────────────────────
  const uploadAttachment = async (uri: string, fileName: string, mimeType: string, fileSize?: number) => {
    if (!id) return;
    setUploadingAttachment(true);
    try {
      const res = await workOrderAttachmentsApi.create({
        work_order_id: id,
        file_url: uri,
        file_name: fileName,
        file_type: mimeType,
        file_size: fileSize,
      });
      const created = res.data.data;
      if (created) setAttachments((prev) => [created, ...prev]);
      AuditLogger.log({
        action: AUDIT_ACTIONS.WO_PHOTO_UPLOADED,
        module: AUDIT_MODULES.WORK_ORDERS,
        record_id: id,
        new_values: { work_order_id: id, file_name: fileName, file_type: mimeType },
      });
    } catch {
      Alert.alert('Upload Failed', 'Could not save the attachment. Please try again.');
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handlePickCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera access is needed to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const fileName = asset.fileName ?? `photo_${Date.now()}.jpg`;
      await uploadAttachment(asset.uri, fileName, asset.mimeType ?? 'image/jpeg', asset.fileSize);
    }
  };

  const handlePickGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Photo library access is needed to attach photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: false,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const fileName = asset.fileName ?? `image_${Date.now()}.jpg`;
      await uploadAttachment(asset.uri, fileName, asset.mimeType ?? 'image/jpeg', asset.fileSize);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        await uploadAttachment(asset.uri, asset.name, asset.mimeType ?? 'application/octet-stream', asset.size);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick document.');
    }
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    Alert.alert('Remove Attachment', 'Remove this file from the work order?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await workOrderAttachmentsApi.delete(attachmentId);
            setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
          } catch {
            Alert.alert('Error', 'Failed to remove attachment.');
          }
        },
      },
    ]);
  };

  // ─── Status update ───────────────────────────────────────────────────────────
  const handleUpdateStatus = async (nextStatus: string) => {
    if (!workOrder || updatingStatus) return;
    setShowStatusSheet(false);
    setUpdatingStatus(true);
    const prevStatus = workOrder.status;
    try {
      await workOrdersApi.updateStatus(workOrder.id, nextStatus);
      // Re-fetch to get the latest server state
      await fetchWorkOrder();
      AuditLogger.log({
        action: AUDIT_ACTIONS.WO_STATUS_CHANGED,
        module: AUDIT_MODULES.WORK_ORDERS,
        record_id: workOrder.id,
        old_values: { status: prevStatus },
        new_values: { status: nextStatus, wo_number: workOrder.wo_number },
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to update status. Please try again.';
      Alert.alert('Status Update Failed', msg);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ─── Accept / decline an assigned job (Step 3) ───────────────────────────────
  const handleAccept = async () => {
    if (!workOrder || acceptDeclineLoading) return;
    setAcceptDeclineLoading('accept');
    try {
      await workOrdersApi.accept(workOrder.id);
      await fetchWorkOrder();
      AuditLogger.log({
        action: AUDIT_ACTIONS.WO_STATUS_CHANGED,
        module: AUDIT_MODULES.WORK_ORDERS,
        record_id: workOrder.id,
        new_values: { accepted: true, wo_number: workOrder.wo_number },
      });
    } catch (err: any) {
      Alert.alert('Could not accept', err?.response?.data?.message ?? 'Please try again.');
    } finally {
      setAcceptDeclineLoading(null);
    }
  };

  const submitDecline = async () => {
    if (!workOrder) return;
    if (!declineReason.trim()) {
      Alert.alert('Reason required', 'Please enter a reason to decline this job.');
      return;
    }
    setAcceptDeclineLoading('decline');
    try {
      await workOrdersApi.decline(workOrder.id, declineReason.trim());
      setShowDeclineModal(false);
      setDeclineReason('');
      await fetchWorkOrder();
    } catch (err: any) {
      Alert.alert('Could not decline', err?.response?.data?.message ?? 'Please try again.');
    } finally {
      setAcceptDeclineLoading(null);
    }
  };

  const nextStatuses = workOrder ? (STATUS_TRANSITIONS[workOrder.status] ?? []) : [];
  // The technician may accept/decline a job that is assigned to them and not yet started.
  const canAcceptDecline =
    !!workOrder &&
    workOrder.assigned_to === currentUserId &&
    ['new', 'approved', 'estimated'].includes(workOrder.status);

  // ─── Delete work order ───────────────────────────────────────────────────────
  const handleDeleteWorkOrder = () => {
    Alert.alert(
      'Delete Work Order',
      `Permanently delete "${workOrder?.wo_number ?? 'this work order'}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!workOrder) return;
            try {
              await workOrdersApi.delete(workOrder.id);
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to delete the work order. Please try again.');
            }
          },
        },
      ],
    );
  };

  // ─── Loading / error states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: isDark ? colors.background : '#F8F9FB' }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (!workOrder) {
    return (
      <View style={[styles.centered, { backgroundColor: isDark ? colors.background : '#F8F9FB' }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textLight} />
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Work order not found</Text>
      </View>
    );
  }

  const priorityColor = PRIORITY_COLORS[workOrder.priority] ?? colors.textSecondary;
  const lineItemsTotal = lineItems.reduce((sum, i) => sum + Number(i.total), 0);

  // ─── Tab content renderers ──────────────────────────────────────────────────

  const renderDetails = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.tabContent}>
      {/* Summary card */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <InfoRow icon="document-text-outline" label="Summary" value={workOrder.summary} />
        {workOrder.description && (
          <InfoRow icon="reader-outline" label="Description" value={workOrder.description} />
        )}
        {workOrder.category && (
          <InfoRow icon="grid-outline" label="Category" value={workOrder.category} />
        )}
      </View>

      {/* Schedule */}
      <Text style={[styles.sectionLabel, { color: isDark ? colors.textSecondary : '#64748B' }]}>SCHEDULE</Text>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <ScheduleRow label="Scheduled Start" value={formatDateTime(workOrder.scheduled_start)} />
        <ScheduleRow label="Scheduled End" value={formatDateTime(workOrder.scheduled_end)} />
        {workOrder.actual_start && (
          <ScheduleRow label="Actual Start" value={formatDateTime(workOrder.actual_start)} />
        )}
        {workOrder.actual_end && (
          <ScheduleRow label="Actual End" value={formatDateTime(workOrder.actual_end)} />
        )}
      </View>

      {/* Appointments / Map nav */}
      {workOrder.appointments && workOrder.appointments.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: isDark ? colors.textSecondary : '#64748B' }]}>APPOINTMENTS</Text>
          {workOrder.appointments.map((appt) => (
            <View key={appt.id} style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              <InfoRow icon="location-outline" label="Address" value={appt.address} />
              <InfoRow icon="person-outline" label="Customer" value={appt.customer_name} />
              {appt.customer_phone && (
                <InfoRow icon="call-outline" label="Phone" value={appt.customer_phone} />
              )}
              {appt.notes && (
                <InfoRow icon="chatbox-outline" label="Notes" value={appt.notes} />
              )}
              {appt.latitude != null && appt.longitude != null && (
                <MapNavigation
                  address={appt.customer_name}
                  latitude={appt.latitude}
                  longitude={appt.longitude}
                  title={appt.address}
                />
              )}
            </View>
          ))}
        </>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {/* Accept / decline an assigned, not-yet-started job (Step 3) */}
        {canAcceptDecline && (
          <>
            <TouchableOpacity
              style={[styles.successButton, acceptDeclineLoading === 'accept' && { opacity: 0.6 }]}
              onPress={handleAccept}
              disabled={!!acceptDeclineLoading}
            >
              {acceptDeclineLoading === 'accept'
                ? <ActivityIndicator size="small" color={colors.textInverse} />
                : <Ionicons name="checkmark-circle-outline" size={20} color={colors.textInverse} />}
              <Text style={styles.primaryButtonText}>Accept Job</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dangerButton, acceptDeclineLoading === 'decline' && { opacity: 0.6 }]}
              onPress={() => setShowDeclineModal(true)}
              disabled={!!acceptDeclineLoading}
            >
              <Ionicons name="close-circle-outline" size={20} color={colors.textInverse} />
              <Text style={styles.primaryButtonText}>Decline Job</Text>
            </TouchableOpacity>
          </>
        )}
        {/* Primary status action shortcuts */}
        {workOrder.status === 'scheduled' && (
          <TouchableOpacity
            style={[styles.primaryButton, updatingStatus && { opacity: 0.6 }]}
            onPress={() => handleUpdateStatus('in_progress')}
            disabled={updatingStatus}
          >
            {updatingStatus
              ? <ActivityIndicator size="small" color={colors.textInverse} />
              : <Ionicons name="play-circle-outline" size={20} color={colors.textInverse} />}
            <Text style={styles.primaryButtonText}>Start Work</Text>
          </TouchableOpacity>
        )}
        {workOrder.status === 'in_progress' && (
          <TouchableOpacity
            style={[styles.successButton, updatingStatus && { opacity: 0.6 }]}
            onPress={() => handleUpdateStatus('completed')}
            disabled={updatingStatus}
          >
            {updatingStatus
              ? <ActivityIndicator size="small" color={colors.textInverse} />
              : <Ionicons name="checkmark-circle-outline" size={20} color={colors.textInverse} />}
            <Text style={styles.primaryButtonText}>Mark Complete</Text>
          </TouchableOpacity>
        )}
        {workOrder.status === 'in_progress' && (
          <TouchableOpacity
            style={styles.warningButton}
            onPress={() => handleUpdateStatus('on_hold')}
            disabled={updatingStatus}
          >
            <Ionicons name="pause-circle-outline" size={20} color={colors.textInverse} />
            <Text style={styles.primaryButtonText}>Put On Hold</Text>
          </TouchableOpacity>
        )}
        {/* Full status sheet — shown for any non-terminal state with multiple options */}
        {nextStatuses.length > 0 && (
          <TouchableOpacity
            style={styles.statusSheetButton}
            onPress={() => setShowStatusSheet(true)}
            disabled={updatingStatus}
          >
            {updatingStatus
              ? <ActivityIndicator size="small" color={ACCENT} />
              : <Text style={styles.statusSheetButtonText}>Update Status</Text>}
          </TouchableOpacity>
        )}
        {/* Utility shortcuts */}
        {workOrder.appointments?.[0] && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push(`/work-order/checklist/${workOrder.id}`)}
          >
            <Ionicons name="checkbox-outline" size={18} color={ACCENT} />
            <Text style={styles.secondaryButtonText}>Checklist</Text>
          </TouchableOpacity>
        )}
        {workOrder.appointments?.[0] && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push(`/work-order/parts-check/${workOrder.id}`)}
          >
            <Ionicons name="cube-outline" size={18} color={ACCENT} />
            <Text style={styles.secondaryButtonText}>Parts Check</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setShowToolsModal(true)}
        >
          <Ionicons name="build-outline" size={18} color={ACCENT} />
          <Text style={styles.secondaryButtonText}>Verification & Tools</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderNotes = () => (
    <View style={{ flex: 1 }}>
      {/* Compose bar */}
      <View style={[styles.composeRow, { backgroundColor: headerBg, borderBottomColor: borderColor }]}>
        <TextInput
          style={[styles.composeInput, { backgroundColor: inputBg, borderColor, color: colors.text }]}
          placeholder="Write a note…"
          placeholderTextColor={colors.textLight}
          value={newNote}
          onChangeText={setNewNote}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !newNote.trim() && { opacity: 0.4 }]}
          onPress={handleAddNote}
          disabled={!newNote.trim() || savingNote}
        >
          {savingNote
            ? <ActivityIndicator size="small" color={colors.white} />
            : <Ionicons name="send" size={18} color={colors.white} />}
        </TouchableOpacity>
      </View>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.tabContent, notes.length === 0 && styles.emptyContent]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbox-outline" size={40} color={colors.textLight} />
            <Text style={styles.emptyText}>No notes yet</Text>
            <Text style={styles.emptySubtext}>Add the first note above</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.noteCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.noteHeader}>
              <View style={[styles.internalBadge, !item.is_internal && { backgroundColor: colors.info + '20' }]}>
                <Text style={[styles.internalBadgeText, !item.is_internal && { color: colors.info }]}>
                  {item.is_internal ? 'Internal' : 'Customer'}
                </Text>
              </View>
              <Text style={styles.noteTime}>{formatRelative(item.created_at)}</Text>
              <TouchableOpacity onPress={() => handleDeleteNote(item.id)} style={styles.deleteNoteBtn}>
                <Ionicons name="trash-outline" size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.noteContent, { color: colors.text }]}>{item.content}</Text>
          </View>
        )}
      />
    </View>
  );

  const renderAttachments = () => (
    <View style={{ flex: 1 }}>
      {/* Upload toolbar */}
      <View style={[styles.uploadToolbar, { backgroundColor: headerBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={handlePickCamera}
          disabled={uploadingAttachment}
        >
          <Ionicons name="camera-outline" size={20} color={ACCENT} />
          <Text style={styles.uploadBtnText}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={handlePickGallery}
          disabled={uploadingAttachment}
        >
          <Ionicons name="images-outline" size={20} color={ACCENT} />
          <Text style={styles.uploadBtnText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={handlePickDocument}
          disabled={uploadingAttachment}
        >
          <Ionicons name="document-attach-outline" size={20} color={ACCENT} />
          <Text style={styles.uploadBtnText}>File</Text>
        </TouchableOpacity>
        {uploadingAttachment && (
          <ActivityIndicator size="small" color={ACCENT} style={{ marginLeft: 4 }} />
        )}
      </View>

      <FlatList
        data={attachments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.tabContent, attachments.length === 0 && styles.emptyContent]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="attach-outline" size={40} color={colors.textLight} />
            <Text style={styles.emptyText}>No attachments yet</Text>
            <Text style={styles.emptySubtext}>Use the buttons above to add photos or files</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.attachmentCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.attachmentIcon}>
              <Ionicons
                name={item.file_type?.startsWith('image') ? 'image-outline' : 'document-outline'}
                size={26}
                color={ACCENT}
              />
            </View>
            <View style={styles.attachmentInfo}>
              <Text style={styles.attachmentName} numberOfLines={1}>{item.file_name}</Text>
              <Text style={styles.attachmentMeta}>
                {item.file_type ?? 'File'} · {formatFileSize(item.file_size)} · {formatRelative(item.created_at)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.attachmentDeleteBtn}
              onPress={() => handleDeleteAttachment(item.id)}
            >
              <Ionicons name="trash-outline" size={17} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );

  const renderLineItems = () => (
    <View style={{ flex: 1 }}>
      <FlatList
        data={lineItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.tabContent, lineItems.length === 0 && styles.emptyContent]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={40} color={colors.textLight} />
            <Text style={styles.emptyText}>No line items</Text>
            <Text style={styles.emptySubtext}>Services, parts, and travel charges will appear here</Text>
          </View>
        }
        ListFooterComponent={
          lineItems.length > 0 ? (
            <View style={styles.lineItemsTotalRow}>
              <Text style={styles.lineItemsTotalLabel}>Total</Text>
              <Text style={styles.lineItemsTotalValue}>{formatCurrency(lineItemsTotal)}</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={[styles.lineItemCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={[styles.lineItemIconWrap, { backgroundColor: ACCENT + '15' }]}>
              <Ionicons name={lineItemTypeIcon(item.type) as any} size={18} color={ACCENT} />
            </View>
            <View style={styles.lineItemBody}>
              <View style={styles.lineItemTop}>
                <Text style={styles.lineItemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.lineItemTotal}>{formatCurrency(item.total)}</Text>
              </View>
              {item.description ? (
                <Text style={styles.lineItemDesc} numberOfLines={1}>{item.description}</Text>
              ) : null}
              <Text style={styles.lineItemCalc}>
                {item.quantity} × {formatCurrency(item.unit_price)}
                {item.tax_rate > 0 ? ` · ${item.tax_rate}% tax` : ''}
                {item.discount > 0 ? ` · −${formatCurrency(item.discount)} disc` : ''}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDeleteLineItem(item.id)}
              style={styles.deleteLineItemBtn}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );

  const renderEstimates = () => (
    <View style={{ flex: 1 }}>
      {/* Create Estimate button */}
      <TouchableOpacity
        style={[styles.addEstimateBtn, { backgroundColor: ACCENT }]}
        onPress={() => router.push(`/estimates/new?work_order_id=${id}` as `/${string}`)}
      >
        <Ionicons name="add-circle-outline" size={18} color="#fff" />
        <Text style={styles.addEstimateBtnText}>Create Estimate</Text>
      </TouchableOpacity>

      {estimatesLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={ACCENT} />
        </View>
      ) : (
        <FlatList
          data={estimates}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.tabContent, estimates.length === 0 && styles.emptyContent]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={40} color={colors.textLight} />
              <Text style={styles.emptyText}>No estimates yet</Text>
              <Text style={styles.emptySubtext}>Create an estimate for this work order</Text>
            </View>
          }
          renderItem={({ item }) => {
            const estStatusColors: Record<string, string> = {
              draft: colors.textSecondary, pending_approval: '#f59e0b', sent: '#0ea5e9',
              viewed: '#6366f1', approved: '#22c55e', rejected: '#ef4444',
              expired: '#f59e0b', converted_to_wo: '#10b981', converted_to_invoice: '#6366f1',
            };
            const sCol = estStatusColors[item.status] ?? colors.textSecondary;
            return (
              <TouchableOpacity
                style={[styles.estimateCard, { backgroundColor: cardBg, borderColor }]}
                onPress={() => router.push(`/estimates/${item.id}` as `/${string}`)}
                activeOpacity={0.75}
              >
                <View style={styles.estimateCardTop}>
                  <Text style={styles.estimateNumber}>{item.estimate_number ?? 'Draft'}</Text>
                  <View style={[styles.estimateStatusBadge, { backgroundColor: sCol + '18', borderColor: sCol + '40' }]}>
                    <Text style={[styles.estimateStatusText, { color: sCol }]}>
                      {item.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Text>
                  </View>
                </View>
                <Text style={styles.estimateTotal}>{formatCurrency(Number(item.total))}</Text>
                {/* Inline Approve / Reject for pending_approval */}
                {item.status === 'pending_approval' && (
                  <View style={styles.estimateActions}>
                    <TouchableOpacity
                      style={[styles.estimateActionBtn, { backgroundColor: '#22c55e' }]}
                      disabled={estimateActionLoading === item.id + '-approve'}
                      onPress={() => {
                        Alert.alert('Approve', `Approve estimate ${item.estimate_number ?? item.id.slice(0, 8)}?`, [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Approve',
                            onPress: async () => {
                              setEstimateActionLoading(item.id + '-approve');
                              try {
                                await estimatesApi.adminApprove(item.id);
                                await fetchEstimates();
                              } catch {
                                Alert.alert('Error', 'Could not approve estimate.');
                              } finally {
                                setEstimateActionLoading(null);
                              }
                            },
                          },
                        ]);
                      }}
                    >
                      {estimateActionLoading === item.id + '-approve'
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={styles.estimateActionBtnText}>Approve</Text>
                      }
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.estimateActionBtn, { backgroundColor: '#ef4444' }]}
                      disabled={estimateActionLoading === item.id + '-reject'}
                      onPress={() => {
                        Alert.alert('Reject', `Reject estimate ${item.estimate_number ?? item.id.slice(0, 8)}?`, [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Reject', style: 'destructive',
                            onPress: async () => {
                              setEstimateActionLoading(item.id + '-reject');
                              try {
                                await estimatesApi.adminReject(item.id);
                                await fetchEstimates();
                              } catch {
                                Alert.alert('Error', 'Could not reject estimate.');
                              } finally {
                                setEstimateActionLoading(null);
                              }
                            },
                          },
                        ]);
                      }}
                    >
                      {estimateActionLoading === item.id + '-reject'
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={styles.estimateActionBtnText}>Reject</Text>
                      }
                    </TouchableOpacity>
                  </View>
                )}
                {/* Generate Invoice for approved */}
                {item.status === 'approved' && (
                  <TouchableOpacity
                    style={[styles.estimateActionBtn, { backgroundColor: ACCENT, marginTop: spacing.sm, width: '100%' }]}
                    disabled={estimateActionLoading === item.id + '-invoice'}
                    onPress={() => {
                      Alert.alert('Generate Invoice', 'Create a draft invoice from this estimate?', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Generate',
                          onPress: async () => {
                            setEstimateActionLoading(item.id + '-invoice');
                            try {
                              const res = await estimatesApi.generateInvoice(item.id);
                              await fetchEstimates();
                              const inv = res.data.data;
                              if (inv?.id) router.push(`/invoices/${inv.id}` as `/${string}`);
                            } catch {
                              Alert.alert('Error', 'Could not generate invoice.');
                            } finally {
                              setEstimateActionLoading(null);
                            }
                          },
                        },
                      ]);
                    }}
                  >
                    {estimateActionLoading === item.id + '-invoice'
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.estimateActionBtnText}>Generate Invoice</Text>
                    }
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F8F9FB' }]}>
      {/* ── Fixed header ───────────────────────────────────── */}
      <View style={[styles.headerBar, { paddingTop: insets.top + spacing.sm, backgroundColor: headerBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => goBack('/(tabs)/home')}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerMeta}>
          <Text style={[styles.woNumber, { color: colors.textSecondary }]}>{workOrder.wo_number}</Text>
          <StatusBadge status={workOrder.status} />
        </View>

        <TouchableOpacity
          style={styles.editPill}
          onPress={() => router.push(`/work-order/edit/${workOrder.id}`)}
          activeOpacity={0.75}
        >
          <Ionicons name="pencil-outline" size={13} color={ACCENT} />
          <Text style={styles.editPillText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteWorkOrder}>
          <Ionicons name="trash-outline" size={22} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* ── Work order summary strip ─────────────────────── */}
      <View style={[styles.summaryStrip, { backgroundColor: headerBg, borderBottomColor: borderColor }]}>
        <Text style={[styles.summaryTitle, { color: colors.text }]} numberOfLines={2}>{workOrder.summary}</Text>
        <View style={styles.priorityRow}>
          <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
          <Text style={[styles.priorityLabel, { color: priorityColor }]}>
            {workOrder.priority} priority
          </Text>
          {workOrder.category ? (
            <>
              <View style={styles.dot} />
              <Text style={styles.categoryLabel}>{workOrder.category}</Text>
            </>
          ) : null}
        </View>
      </View>

      {/* ── Tab bar ──────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabBar, { backgroundColor: headerBg, borderBottomColor: borderColor }]}
        contentContainerStyle={styles.tabBarContent}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.75}
          >
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? ACCENT : colors.textSecondary}
            />
            <Text style={[styles.tabLabel, { color: colors.textSecondary }, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {tab.key === 'notes' && notes.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{notes.length}</Text>
              </View>
            )}
            {tab.key === 'line_items' && lineItems.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{lineItems.length}</Text>
              </View>
            )}
            {tab.key === 'attachments' && attachments.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{attachments.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Tab content ─────────────────────────────────── */}
      <View style={[styles.tabContentContainer, { paddingBottom: insets.bottom }]}>
        {activeTab === 'details' && renderDetails()}
        {activeTab === 'notes' && renderNotes()}
        {activeTab === 'attachments' && renderAttachments()}
        {activeTab === 'line_items' && renderLineItems()}
        {activeTab === 'estimates' && renderEstimates()}
      </View>

      <WorkOrderToolsModal
        visible={showToolsModal}
        onClose={() => setShowToolsModal(false)}
        workOrderId={workOrder.id}
      />

      {/* ── Status Action Sheet ───────────────────────────── */}
      <Modal
        visible={showStatusSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusSheet(false)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setShowStatusSheet(false)}>
          <Pressable style={[styles.sheetContainer, { paddingBottom: insets.bottom + 8, backgroundColor: cardBg }]}>
            {/* Sheet handle */}
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Update Status</Text>
            <Text style={styles.sheetSubtitle}>
              Current: <Text style={{ fontWeight: '700' }}>{STATUS_LABELS[workOrder.status] ?? workOrder.status}</Text>
            </Text>
            <View style={styles.sheetDivider} />
            {nextStatuses.map((status, idx) => {
              const color = STATUS_COLORS[status] ?? colors.primary;
              const isCancel = status === 'cancelled';
              return (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.sheetOption,
                    idx < nextStatuses.length - 1 && styles.sheetOptionBorder,
                    isCancel && styles.sheetOptionCancel,
                  ]}
                  onPress={() => handleUpdateStatus(status)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.sheetOptionDot, { backgroundColor: color }]} />
                  <Text style={[styles.sheetOptionText, isCancel && { color: colors.error }]}>
                    {STATUS_LABELS[status] ?? status}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={isCancel ? colors.error : color}
                  />
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.sheetCancelBtn}
              onPress={() => setShowStatusSheet(false)}
            >
              <Text style={styles.sheetCancelText}>Dismiss</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Decline reason modal (Step 3) */}
      <Modal
        visible={showDeclineModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeclineModal(false)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setShowDeclineModal(false)}>
          <Pressable style={[styles.sheetContainer, { paddingBottom: insets.bottom + 8, backgroundColor: cardBg }]}>
            <Text style={[styles.sheetTitle, { color: c.text }]}>Decline Job</Text>
            <Text style={{ ...typography.bodySmall, color: c.textSecondary, marginBottom: spacing.md }}>
              Let the dispatcher know why you can't take this job.
            </Text>
            <TextInput
              style={[styles.declineInput, { color: c.text, borderColor, backgroundColor: inputBg }]}
              value={declineReason}
              onChangeText={setDeclineReason}
              placeholder="Reason (e.g. double-booked, out of area)…"
              placeholderTextColor={c.textLight}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.dangerButton, { marginTop: spacing.md }, acceptDeclineLoading === 'decline' && { opacity: 0.6 }]}
              onPress={submitDecline}
              disabled={acceptDeclineLoading === 'decline'}
            >
              {acceptDeclineLoading === 'decline'
                ? <ActivityIndicator size="small" color={colors.textInverse} />
                : <Text style={styles.primaryButtonText}>Submit Decline</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetCancelBtn} onPress={() => setShowDeclineModal(false)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={16} color={colors.textSecondary} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

function ScheduleRow({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.scheduleRow}>
      <Text style={[styles.scheduleLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.scheduleValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FB', gap: spacing.md },
  errorText: { ...typography.body, color: colors.textSecondary },

  // ── Header ────────────────────────────────────────────────────────────────
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: spacing.md,
  },
  backButton: { padding: spacing.xs },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ACCENT + '18',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editPillText: { ...typography.bodySmall, color: ACCENT, fontWeight: '700' },
  deleteBtn: { padding: spacing.xs },
  headerMeta: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  woNumber: { ...typography.label, color: colors.textSecondary },

  // ── Summary strip ─────────────────────────────────────────────────────────
  summaryStrip: {
    backgroundColor: '#FFF',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  summaryTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
  priorityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  priorityLabel: { ...typography.bodySmall, fontWeight: '600', textTransform: 'capitalize' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textLight },
  categoryLabel: { ...typography.bodySmall, color: colors.textSecondary },

  // ── Tab bar ───────────────────────────────────────────────────────────────
  tabBar: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    maxHeight: 48,
  },
  tabBarContent: { paddingHorizontal: spacing.md, gap: spacing.sm },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: ACCENT },
  tabLabel: { ...typography.label, color: colors.textSecondary },
  tabLabelActive: { color: ACCENT },
  tabBadge: {
    backgroundColor: ACCENT,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: { ...typography.caption, color: colors.white, fontWeight: '700' },

  // ── Tab content ───────────────────────────────────────────────────────────
  tabContentContainer: { flex: 1 },
  tabContent: { padding: spacing.lg, gap: spacing.lg },
  emptyContent: { flexGrow: 1, justifyContent: 'center' },

  // ── Cards ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.8,
  },

  // ── Info rows ─────────────────────────────────────────────────────────────
  infoRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  infoLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: 2 },
  infoValue: { ...typography.body, color: colors.text },

  // ── Schedule rows ─────────────────────────────────────────────────────────
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  scheduleLabel: { ...typography.body, color: colors.textSecondary },
  scheduleValue: { ...typography.body, color: colors.text, fontWeight: '500' },

  // ── Actions ───────────────────────────────────────────────────────────────
  actions: { gap: spacing.md },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: ACCENT,
    borderRadius: 10,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  successButton: {
    flexDirection: 'row',
    backgroundColor: colors.success,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryButtonText: { ...typography.button, color: colors.textInverse },
  secondaryButton: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  secondaryButtonText: { ...typography.button, color: ACCENT },
  warningButton: {
    flexDirection: 'row',
    backgroundColor: '#E9A100',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dangerButton: {
    flexDirection: 'row',
    backgroundColor: '#DC3545',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  declineInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 80,
    ...typography.body,
  },
  statusSheetButton: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: ACCENT,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: ACCENT + '0A',
  },
  statusSheetButtonText: { ...typography.button, color: ACCENT, flex: 1, textAlign: 'center' },

  // ── Status Action Sheet ────────────────────────────────────────────────────
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 4,
  },
  sheetSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  sheetDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md + 2,
    gap: spacing.md,
  },
  sheetOptionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  sheetOptionCancel: {
    marginTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  sheetOptionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sheetOptionText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    fontWeight: '600',
  },
  sheetCancelBtn: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
    borderRadius: borderRadius.md,
  },
  sheetCancelText: {
    ...typography.button,
    color: colors.textSecondary,
  },


  // ── Notes ─────────────────────────────────────────────────────────────────
  composeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  composeInput: {
    flex: 1,
    backgroundColor: '#F8F9FB',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.text,
    maxHeight: 80,
  },
  sendBtn: {
    backgroundColor: ACCENT,
    borderRadius: borderRadius.md,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteCard: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noteHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  internalBadge: {
    backgroundColor: ACCENT + '18',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  internalBadgeText: { ...typography.caption, color: ACCENT, fontWeight: '700' },
  noteTime: { ...typography.caption, color: colors.textLight, flex: 1 },
  deleteNoteBtn: { padding: spacing.xs },
  noteContent: { ...typography.body, color: colors.text, lineHeight: 22 },

  // ── Attachments ───────────────────────────────────────────────────────────
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  attachmentIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: ACCENT + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentInfo: { flex: 1 },
  attachmentName: { ...typography.body, color: colors.text, fontWeight: '600' },
  attachmentMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  attachmentDeleteBtn: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },

  // ── Upload toolbar ─────────────────────────────────────────────────────────
  uploadToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: spacing.sm,
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: borderRadius.md,
    backgroundColor: ACCENT + '0A',
  },
  uploadBtnText: {
    ...typography.label,
    color: ACCENT,
    fontWeight: '600',
  },

  // ── Line items ────────────────────────────────────────────────────────────
  lineItemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  lineItemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  lineItemBody: { flex: 1 },
  lineItemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineItemName: { ...typography.body, color: colors.text, fontWeight: '600', flex: 1 },
  lineItemTotal: { ...typography.body, color: colors.text, fontWeight: '700' },
  lineItemDesc: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  lineItemCalc: { ...typography.caption, color: colors.textLight, marginTop: 4 },
  deleteLineItemBtn: { padding: spacing.xs, marginTop: 2 },
  lineItemsTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: ACCENT + '10',
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  lineItemsTotalLabel: { ...typography.body, color: colors.text, fontWeight: '600' },
  lineItemsTotalValue: { ...typography.h4, color: ACCENT },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyState: { alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  emptyText: { ...typography.h4, color: colors.textSecondary, textAlign: 'center' },
  emptySubtext: { ...typography.body, color: colors.textLight, textAlign: 'center' },

  // ── Estimates tab ─────────────────────────────────────────────────────────
  addEstimateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  addEstimateBtnText: {
    ...typography.button,
    color: '#fff',
  },
  estimateCard: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  estimateCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  estimateNumber: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  estimateStatusBadge: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  estimateStatusText: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  estimateTotal: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  estimateActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  estimateActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
  },
  estimateActionBtnText: {
    ...typography.label,
    color: '#fff',
    fontWeight: '700',
  },
});
