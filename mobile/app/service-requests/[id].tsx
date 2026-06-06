import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { serviceRequestsApi } from '@/api/endpoints';
import AuditLogger, { AUDIT_ACTIONS, AUDIT_MODULES } from '@/utils/AuditLogger';
import { formatDate, formatDateTime } from '@/utils/format';
import { API_URL } from '@/utils/constants';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { ServiceRequest, RequestAttachment, CustomerInfo } from '@/types/models';

const ACCENT = '#4F6BF6';

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  new: '#0ea5e9',
  triaged: '#6366f1',
  estimated: '#f59e0b',
  approved: '#22c55e',
  converted_to_wo: '#10b981',
  closed: '#6c757d',
  spam: '#ef4444',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#6c757d',
  medium: '#0ea5e9',
  high: '#f59e0b',
  urgent: '#ef4444',
};

const CHANNEL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  email: 'mail-outline',
  phone: 'call-outline',
  portal: 'globe-outline',
  webform: 'document-text-outline',
  api: 'code-slash-outline',
  whatsapp: 'chatbubble-ellipses-outline',
};

const CHANNEL_LABELS: Record<string, string> = {
  email: 'Email',
  phone: 'Phone',
  portal: 'Customer Portal',
  webform: 'Web Form',
  api: 'API',
  whatsapp: 'WhatsApp',
};

function statusColor(s: string) { return STATUS_COLORS[s] ?? colors.textLight; }
function statusLabel(s: string) {
  if (s === 'converted_to_wo') return 'Converted to WO';
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function priorityColor(p: string) { return PRIORITY_COLORS[p] ?? colors.textLight; }
function priorityLabel(p: string) { return p.charAt(0).toUpperCase() + p.slice(1); }

// ─── Attachments / customer helpers ─────────────────────────────────────────

// Build a device-reachable absolute URL for a stored file. Files are served by
// the backend under /uploads; stored URLs may be relative or point at
// localhost/127.0.0.1 (not reachable from a physical device), so rewrite the
// host to the API origin.
function absoluteFileUrl(raw: string): string {
  if (!raw) return raw;
  const origin = API_URL.replace(/\/api\/?$/, ''); // e.g. http://192.168.1.125:3213
  let url = raw.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, origin);
  if (/^https?:\/\//i.test(url)) return url;
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

function fileIcon(fileType?: string | null, fileName?: string): keyof typeof Ionicons.glyphMap {
  const t = `${fileType ?? ''} ${fileName ?? ''}`.toLowerCase();
  if (/(png|jpe?g|gif|webp|heic|image)/.test(t)) return 'image-outline';
  if (/pdf/.test(t)) return 'document-text-outline';
  if (/(doc|word)/.test(t)) return 'document-outline';
  if (/(xls|sheet|csv)/.test(t)) return 'grid-outline';
  return 'attach-outline';
}

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// Client-side fallback if the API hasn't supplied the normalized `customer`
// object (mirrors the backend normalization: Contact relation → custom_fields).
function deriveCustomer(req: ServiceRequest): CustomerInfo {
  if (req.customer) return req.customer;
  const cf = (req.custom_fields ?? {}) as Record<string, unknown>;
  const c = req.contact;
  const name = c ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() : '';
  return {
    name: name || (cf.customer_name as string) || null,
    email: c?.email || (cf.customer_email as string) || null,
    phone: c?.phone || (cf.customer_phone as string) || null,
    address: req.location?.address || (cf.service_address as string) || null,
    source: c ? 'contact' : 'website',
  };
}

// ─── Status timeline ──────────────────────────────────────────────────────────

const STATUS_FLOW = ['new', 'triaged', 'estimated', 'approved', 'converted_to_wo', 'closed'];

function StatusTimeline({ current }: { current: string }) {
  if (current === 'spam') return null;
  const currentIdx = STATUS_FLOW.indexOf(current);

  return (
    <View style={styles.timeline}>
      {STATUS_FLOW.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        const col = active ? statusColor(step) : done ? '#22c55e' : colors.border;

        return (
          <View key={step} style={styles.timelineStep}>
            <View style={[styles.timelineDot, { backgroundColor: col, borderColor: col }]}>
              {done && <Ionicons name="checkmark" size={10} color="#fff" />}
            </View>
            {idx < STATUS_FLOW.length - 1 && (
              <View style={[styles.timelineLine, { backgroundColor: done ? '#22c55e' : colors.border }]} />
            )}
            <Text
              style={[
                styles.timelineLabel,
                active && { color: col, fontWeight: '700' },
                done && { color: '#22c55e' },
              ]}
              numberOfLines={1}
            >
              {statusLabel(step)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({
  icon, label, value, valueColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={colors.textSecondary} style={styles.infoIcon} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : undefined]}>
        {value}
      </Text>
    </View>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────

function ActionButton({
  label, icon, onPress, variant = 'primary', loading,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}) {
  const bg =
    variant === 'primary' ? ACCENT
    : 'transparent';
  const border =
    variant === 'secondary' ? ACCENT
    : variant === 'danger' ? '#ef4444'
    : 'transparent';
  const textCol =
    variant === 'secondary' ? ACCENT
    : variant === 'danger' ? '#ef4444'
    : '#fff';

  return (
    <TouchableOpacity
      style={[
        styles.actionBtn,
        { backgroundColor: bg, borderColor: border, borderWidth: variant === 'secondary' || variant === 'danger' ? 1.5 : 0 },
      ]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.75}
    >
      {loading
        ? <ActivityIndicator size="small" color={textCol} />
        : <Ionicons name={icon} size={18} color={textCol} />}
      <Text style={[styles.actionBtnText, { color: textCol }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ServiceRequestDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors: c, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<RequestAttachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    serviceRequestsApi
      .getById(id)
      .then((res) => setRequest(res.data.data ?? null))
      .catch(() => setRequest(null))
      .finally(() => setLoading(false));

    serviceRequestsApi
      .getAttachments(id)
      .then((res) => setAttachments(res.data.data ?? []))
      .catch(() => setAttachments([]))
      .finally(() => setAttachmentsLoading(false));
  }, [id]);

  const openExternal = useCallback(async (url: string, failMsg: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unavailable', failMsg);
    }
  }, []);

  const openAttachment = useCallback(
    (a: RequestAttachment) =>
      openExternal(
        absoluteFileUrl(a.file_url),
        'No app is available to open or download this file.',
      ),
    [openExternal],
  );

  const transition = async (newStatus: string, label: string) => {
    if (!request) return;
    Alert.alert(
      label,
      `Move this request to "${statusLabel(newStatus)}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setActionLoading(newStatus);
            const prevStatus = request.status;
            try {
              const res = await serviceRequestsApi.updateStatus(request.id, newStatus);
              setRequest(res.data.data ?? { ...request, status: newStatus });
              const action =
                newStatus === 'approved' ? AUDIT_ACTIONS.SR_ACCEPTED
                : newStatus === 'spam'   ? AUDIT_ACTIONS.SR_REJECTED
                : AUDIT_ACTIONS.SR_STATUS_CHANGED;
              AuditLogger.log({
                action,
                module: AUDIT_MODULES.SERVICE_REQUESTS,
                record_id: request.id,
                old_values: { status: prevStatus },
                new_values: { status: newStatus },
              });
            } catch {
              Alert.alert('Error', 'Could not update status. Please try again.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top, backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top, backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
        <Ionicons name="clipboard-outline" size={48} color={c.textLight} />
        <Text style={[styles.errorTitle, { color: c.text }]}>Request not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.errorBack}>
          <Text style={styles.errorBackText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sColor = statusColor(request.status);
  const pColor = priorityColor(request.priority);
  const isFinal = ['closed', 'spam', 'converted_to_wo'].includes(request.status);

  const customer = deriveCustomer(request);
  const hasCustomer = !!(customer.name || customer.phone || customer.email || customer.address);
  const hasSchedule = !!(request.scheduled_start || request.scheduled_end);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, backgroundColor: headerBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]} numberOfLines={1}>Service Request</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing['2xl'] },
        ]}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            {/* Status badge */}
            <View style={[styles.statusBadge, { backgroundColor: sColor + '18', borderColor: sColor + '40' }]}>
              <View style={[styles.statusDot, { backgroundColor: sColor }]} />
              <Text style={[styles.statusBadgeText, { color: sColor }]}>
                {statusLabel(request.status)}
              </Text>
            </View>

            {/* Priority badge */}
            <View style={[styles.priorityBadge, { backgroundColor: pColor + '18' }]}>
              {request.priority === 'urgent' && (
                <Ionicons name="flash" size={12} color={pColor} />
              )}
              <Text style={[styles.priorityBadgeText, { color: pColor }]}>
                {priorityLabel(request.priority)}
              </Text>
            </View>
          </View>

          <Text style={[styles.subject, { color: c.text }]}>{request.subject}</Text>
          <Text style={styles.createdAt}>
            {request.request_number ? `${request.request_number} · ` : ''}Received {formatDate(request.created_at)}
          </Text>
        </View>

        {/* Status timeline */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Progress</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <StatusTimeline current={request.status} />
            {request.status === 'spam' && (
              <View style={styles.spamNotice}>
                <Ionicons name="ban-outline" size={16} color="#ef4444" />
                <Text style={styles.spamNoticeText}>Marked as spam</Text>
              </View>
            )}
          </View>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Details</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <InfoRow
              icon={CHANNEL_ICONS[request.channel] ?? 'help-circle-outline'}
              label="Channel"
              value={CHANNEL_LABELS[request.channel] ?? request.channel}
            />
            {request.category ? (
              <>
                <View style={styles.rowDivider} />
                <InfoRow icon="grid-outline" label="Category" value={request.category} />
              </>
            ) : null}
            <View style={styles.rowDivider} />
            <InfoRow
              icon="flag-outline"
              label="Priority"
              value={priorityLabel(request.priority)}
              valueColor={pColor}
            />
            {request.assigned_to ? (
              <>
                <View style={styles.rowDivider} />
                <InfoRow icon="person-outline" label="Assigned to" value={request.assigned_to} />
              </>
            ) : null}
          </View>
        </View>

        {/* Schedule */}
        {hasSchedule && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Schedule</Text>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              {request.scheduled_start ? (
                <InfoRow icon="calendar-outline" label="Starts" value={formatDateTime(request.scheduled_start)} />
              ) : null}
              {request.scheduled_start && request.scheduled_end ? <View style={styles.rowDivider} /> : null}
              {request.scheduled_end ? (
                <InfoRow icon="time-outline" label="Ends" value={formatDateTime(request.scheduled_end)} />
              ) : null}
            </View>
          </View>
        )}

        {/* Customer */}
        {hasCustomer && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Customer</Text>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              {customer.name ? (
                <InfoRow icon="person-circle-outline" label="Name" value={customer.name} />
              ) : null}

              {customer.phone ? (
                <>
                  {customer.name ? <View style={styles.rowDivider} /> : null}
                  <TouchableOpacity
                    style={styles.contactRow}
                    onPress={() => openExternal(`tel:${customer.phone}`, 'Cannot start a phone call on this device.')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="call-outline" size={16} color={colors.textSecondary} style={styles.infoIcon} />
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={[styles.infoValue, { color: ACCENT }]} numberOfLines={1}>{customer.phone}</Text>
                  </TouchableOpacity>
                </>
              ) : null}

              {customer.email ? (
                <>
                  {(customer.name || customer.phone) ? <View style={styles.rowDivider} /> : null}
                  <TouchableOpacity
                    style={styles.contactRow}
                    onPress={() => openExternal(`mailto:${customer.email}`, 'No email app is configured on this device.')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="mail-outline" size={16} color={colors.textSecondary} style={styles.infoIcon} />
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={[styles.infoValue, { color: ACCENT }]} numberOfLines={1}>{customer.email}</Text>
                  </TouchableOpacity>
                </>
              ) : null}

              {customer.address ? (
                <>
                  {(customer.name || customer.phone || customer.email) ? <View style={styles.rowDivider} /> : null}
                  <TouchableOpacity
                    style={styles.contactRow}
                    onPress={() => openExternal(`https://maps.google.com/?q=${encodeURIComponent(customer.address!)}`, 'Cannot open maps on this device.')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="location-outline" size={16} color={colors.textSecondary} style={styles.infoIcon} />
                    <Text style={styles.infoLabel}>Address</Text>
                    <Text style={[styles.infoValue, { color: ACCENT }]} numberOfLines={2}>{customer.address}</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          </View>
        )}

        {/* Description */}
        {request.description ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Description</Text>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              <Text style={styles.descText}>{request.description}</Text>
            </View>
          </View>
        ) : null}

        {/* Attachments */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>
            Attachments{attachments.length ? ` (${attachments.length})` : ''}
          </Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            {attachmentsLoading ? (
              <View style={styles.attachLoading}>
                <ActivityIndicator size="small" color={ACCENT} />
              </View>
            ) : attachments.length === 0 ? (
              <View style={styles.attachEmpty}>
                <Ionicons name="document-outline" size={18} color={c.textLight} />
                <Text style={[styles.attachEmptyText, { color: c.textLight }]}>No attachments</Text>
              </View>
            ) : (
              attachments.map((a, idx) => (
                <View key={a.id}>
                  {idx > 0 ? <View style={styles.rowDivider} /> : null}
                  <TouchableOpacity style={styles.attachRow} onPress={() => openAttachment(a)} activeOpacity={0.7}>
                    <View style={[styles.attachIcon, { backgroundColor: ACCENT + '14' }]}>
                      <Ionicons name={fileIcon(a.file_type, a.file_name)} size={18} color={ACCENT} />
                    </View>
                    <View style={styles.attachMeta}>
                      <Text style={[styles.attachName, { color: c.text }]} numberOfLines={1}>{a.file_name}</Text>
                      {formatBytes(a.file_size) ? (
                        <Text style={styles.attachSize}>{formatBytes(a.file_size)}</Text>
                      ) : null}
                    </View>
                    <Ionicons name="download-outline" size={20} color={ACCENT} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Billing */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Billing</Text>
          <ActionButton
            label="Create Invoice"
            icon="receipt-outline"
            variant="primary"
            onPress={() =>
              router.push({
                pathname: '/invoice/new',
                params: {
                  serviceRequestId: request.id,
                  ...(request.contact_id ? { contactId: request.contact_id } : {}),
                },
              })
            }
          />
        </View>

        {/* Record info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Record Info</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <InfoRow icon="calendar-outline" label="Created" value={formatDateTime(request.created_at)} />
            <View style={styles.rowDivider} />
            <InfoRow icon="time-outline" label="Updated" value={formatDateTime(request.updated_at)} />
          </View>
        </View>

        {/* Actions */}
        {!isFinal && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Actions</Text>
            <View style={styles.actionsWrap}>

              {request.status === 'new' && (
                <ActionButton
                  label="Mark as Triaged"
                  icon="checkmark-circle-outline"
                  onPress={() => transition('triaged', 'Triage Request')}
                  loading={actionLoading === 'triaged'}
                />
              )}

              {request.status === 'triaged' && (
                <ActionButton
                  label="Mark as Estimated"
                  icon="calculator-outline"
                  onPress={() => transition('estimated', 'Mark Estimated')}
                  loading={actionLoading === 'estimated'}
                />
              )}

              {(request.status === 'estimated') && (
                <ActionButton
                  label="Mark as Approved"
                  icon="thumbs-up-outline"
                  onPress={() => transition('approved', 'Approve Request')}
                  loading={actionLoading === 'approved'}
                />
              )}

              {(request.status === 'approved' || request.status === 'triaged') && (
                <ActionButton
                  label="Convert to Work Order"
                  icon="construct-outline"
                  onPress={() => transition('converted_to_wo', 'Convert to Work Order')}
                  variant="primary"
                  loading={actionLoading === 'converted_to_wo'}
                />
              )}

              <ActionButton
                label="Close Request"
                icon="close-circle-outline"
                onPress={() => transition('closed', 'Close Request')}
                variant="secondary"
                loading={actionLoading === 'closed'}
              />

              <ActionButton
                label="Mark as Spam"
                icon="ban-outline"
                onPress={() => transition('spam', 'Mark as Spam')}
                variant="danger"
                loading={actionLoading === 'spam'}
              />
            </View>
          </View>
        )}

        {/* Final state notice */}
        {isFinal && (
          <View style={[styles.finalNotice, { borderLeftColor: sColor, backgroundColor: cardBg, borderColor }]}>
            <Ionicons
              name={request.status === 'converted_to_wo' ? 'checkmark-circle' : request.status === 'spam' ? 'ban' : 'lock-closed'}
              size={18}
              color={sColor}
            />
            <Text style={[styles.finalNoticeText, { color: sColor }]}>
              {request.status === 'converted_to_wo'
                ? 'This request has been converted to a work order.'
                : request.status === 'spam'
                  ? 'This request has been marked as spam.'
                  : 'This request is closed and cannot be modified.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },

  // ── Loading / error ────────────────────────────────────────────────────────
  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F8F9FB', gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  errorTitle: { ...typography.h4, color: colors.text },
  errorBack: { marginTop: spacing.sm },
  errorBackText: { ...typography.body, color: ACCENT, fontWeight: '600' },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.sm,
    backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { ...typography.h4, color: colors.text, flex: 1, textAlign: 'center' },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  content: { padding: spacing.lg },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: borderRadius.full, borderWidth: 1,
    paddingHorizontal: spacing.md, paddingVertical: 4,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusBadgeText: { ...typography.bodySmall, fontWeight: '700' },
  priorityBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md, paddingVertical: 4,
  },
  priorityBadgeText: { ...typography.bodySmall, fontWeight: '600' },
  subject: { ...typography.h3, color: colors.text, lineHeight: 28 },
  createdAt: { ...typography.bodySmall, color: colors.textLight },

  // ── Section ───────────────────────────────────────────────────────────────
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    ...typography.label, color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: '#FFF', borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: '#E2E8F0',
  },

  // ── Info row ──────────────────────────────────────────────────────────────
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.md, gap: spacing.sm,
  },
  infoIcon: { width: 20, textAlign: 'center' },
  infoLabel: { ...typography.body, color: colors.textSecondary, flex: 1 },
  infoValue: { ...typography.body, color: colors.text, fontWeight: '500', textAlign: 'right', maxWidth: '55%' },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginLeft: spacing.lg + 20 + spacing.sm,
  },

  // ── Tappable contact row ─────────────────────────────────────────────────────
  contactRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.md, gap: spacing.sm,
  },

  // ── Attachments ──────────────────────────────────────────────────────────────
  attachLoading: { paddingVertical: spacing.lg, alignItems: 'center' },
  attachEmpty: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.lg,
  },
  attachEmptyText: { ...typography.body, color: colors.textLight },
  attachRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.md, gap: spacing.sm,
  },
  attachIcon: {
    width: 36, height: 36, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  attachMeta: { flex: 1, gap: 2 },
  attachName: { ...typography.body, color: colors.text, fontWeight: '500' },
  attachSize: { ...typography.caption, color: colors.textLight },

  // ── Description ───────────────────────────────────────────────────────────
  descText: { ...typography.body, color: colors.text, lineHeight: 22, paddingVertical: spacing.md },

  // ── Timeline ──────────────────────────────────────────────────────────────
  timeline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  timelineStep: { flex: 1, alignItems: 'center', gap: spacing.xs },
  timelineDot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  timelineLine: {
    position: 'absolute',
    top: 9, left: '50%', right: '-50%',
    height: 2, zIndex: -1,
  },
  timelineLabel: {
    ...typography.caption, color: colors.textLight,
    textAlign: 'center', fontSize: 10,
  },
  spamNotice: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingBottom: spacing.md,
    justifyContent: 'center',
  },
  spamNoticeText: { ...typography.body, color: '#ef4444', fontWeight: '600' },

  // ── Actions ───────────────────────────────────────────────────────────────
  actionsWrap: { gap: spacing.sm },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, borderRadius: 10,
    height: 52,
  },
  actionBtnText: { ...typography.button },

  // ── Final notice ──────────────────────────────────────────────────────────
  finalNotice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: '#FFF', borderRadius: borderRadius.md,
    borderLeftWidth: 4, padding: spacing.md,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  finalNoticeText: { ...typography.body, flex: 1, lineHeight: 20 },
});
