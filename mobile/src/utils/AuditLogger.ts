import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { auditLogsApi } from '@/api/endpoints';

// ─── Action constants ─────────────────────────────────────────────────────────

export const AUDIT_ACTIONS = {
  // Auth
  LOGIN_SUCCESS:          'login_success',
  LOGIN_FAILED:           'login_failed',
  BIOMETRIC_LOGIN:        'biometric_login',
  LOGOUT:                 'logout',

  // Work Orders
  WO_STATUS_CHANGED:      'work_order_status_changed',
  WO_NOTE_ADDED:          'work_order_note_added',
  WO_PHOTO_UPLOADED:      'work_order_photo_uploaded',
  WO_DELETED:             'work_order_deleted',

  // Timesheets
  CLOCK_IN:               'clock_in',
  CLOCK_OUT:              'clock_out',

  // Service Requests
  SR_ACCEPTED:            'service_request_accepted',
  SR_REJECTED:            'service_request_rejected',
  SR_STATUS_CHANGED:      'service_request_status_changed',

  // Estimates
  ESTIMATE_SENT:          'estimate_sent',
  ESTIMATE_SIGNATURE:     'estimate_signature_captured',

  // Appointments
  APPOINTMENT_SIGNATURE:  'appointment_signature_captured',
} as const;

// ─── Module constants ─────────────────────────────────────────────────────────

export const AUDIT_MODULES = {
  AUTH:             'mobile_auth',
  WORK_ORDERS:      'work_orders',
  TIMESHEETS:       'timesheets',
  SERVICE_REQUESTS: 'service_requests',
  ESTIMATES:        'estimates',
  APPOINTMENTS:     'appointments',
} as const;

// ─── Logger ───────────────────────────────────────────────────────────────────

interface LogOptions {
  action: string;
  module: string;
  record_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
}

function buildUserAgent(): string {
  const brand  = Device.brand ?? 'Unknown';
  const model  = Device.modelName ?? 'Unknown';
  const osVer  = Device.osVersion ?? 'Unknown';
  const os     = Platform.OS === 'ios' ? 'iOS' : 'Android';
  return `FieldForce-Pro Mobile/1.0 (${brand} ${model}; ${os} ${osVer})`;
}

const AuditLogger = {
  log(opts: LogOptions): void {
    // Fire-and-forget — never throws, never blocks the caller
    auditLogsApi
      .create({
        action:     opts.action,
        module:     opts.module,
        record_id:  opts.record_id,
        old_values: opts.old_values,
        new_values: {
          ...opts.new_values,
          _user_agent: buildUserAgent(),
        },
      })
      .catch(() => {
        // Silently ignore — network errors must never surface to field workers
      });
  },
};

export default AuditLogger;
