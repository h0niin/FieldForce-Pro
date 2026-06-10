import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Form, Input, Button, Space, Skeleton, Select, Row, Col, Typography,
  message, Alert, Divider, AutoComplete, DatePicker, Upload, Checkbox,
} from 'antd';
import {
  EnvironmentOutlined, CheckCircleOutlined, WarningOutlined, SaveOutlined,
  CloseOutlined, AimOutlined, LoadingOutlined, PlusOutlined, InboxOutlined,
} from '@ant-design/icons';
import {
  MapContainer, TileLayer, Marker, useMap, useMapEvents, CircleMarker, Tooltip, GeoJSON,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import dayjs from 'dayjs';
import { useServiceRequest, useCreateServiceRequest, useUpdateServiceRequest } from '@/hooks/use-service-requests';
import { formatDateTime } from '@/utils/format-date';
import { useAllContacts } from '@/hooks/use-contacts';
import { useAllCompanies } from '@/hooks/use-companies';
import { useAllServiceLocations } from '@/hooks/use-service-locations';
import { useAgents } from '@/hooks/use-users';
import PageHeader from '@/components/common/PageHeader';
import CompanyQuickCreateDrawer from '@/components/service-requests/CompanyQuickCreateDrawer';
import ContactQuickCreateDrawer from '@/components/service-requests/ContactQuickCreateDrawer';
import AddressPickerField from '@/components/service-requests/AddressPickerField';
import type { ServiceLocation } from '@/types/models.types';

const { TextArea } = Input;
const { Text } = Typography;

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// --- Map helper components ---

function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      const currentZoom = map.getZoom();
      const targetZoom = currentZoom < 13 ? 14 : currentZoom;
      map.flyTo([lat, lng], targetZoom, { duration: 1 });
    }
  }, [lat, lng, map]);
  return null;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function DraggableMarker({
  lat, lng, onDragEnd,
}: { lat: number; lng: number; onDragEnd: (lat: number, lng: number) => void }) {
  const markerRef = useRef<L.Marker>(null);
  const eventHandlers = useMemo(() => ({
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const pos = marker.getLatLng();
        onDragEnd(pos.lat, pos.lng);
      }
    },
  }), [onDragEnd]);
  return <Marker draggable eventHandlers={eventHandlers} position={[lat, lng]} ref={markerRef} />;
}

// --- Haversine distance (km) ---
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestLocation(
  lat: number,
  lng: number,
  locs: ServiceLocation[],
  maxKm?: number,
): { location: ServiceLocation; distance: number } | null {
  let nearest: ServiceLocation | null = null;
  let minDist = Infinity;
  for (const loc of locs) {
    if (loc.lat == null || loc.lng == null) continue;
    const dist = haversineDistance(lat, lng, Number(loc.lat), Number(loc.lng));
    if (dist < minDist) { minDist = dist; nearest = loc; }
  }
  if (!nearest) return null;
  if (maxKm !== undefined && minDist > maxKm) return null;
  return { location: nearest, distance: minDist };
}

const MATCH_RADIUS_KM = 10;

// --- Photon geocoding (for service location search) ---
interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string; street?: string; housenumber?: string;
    city?: string; town?: string; village?: string;
    state?: string; country?: string; postcode?: string; osm_value?: string;
  };
}

async function photonSearch(query: string): Promise<PhotonFeature[]> {
  const res = await fetch(
    `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lang=en`,
  );
  if (!res.ok) throw new Error(`Photon error: ${res.status}`);
  const data = await res.json();
  return data.features || [];
}

async function fetchNominatimBoundary(lat: number, lng: number) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&polygon_geojson=1&addressdetails=1`,
    { headers: { 'Accept': 'application/json', 'Accept-Language': 'en' } },
  );
  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
  return res.json();
}

const boundaryStyle = {
  color: '#F59E0B', weight: 3, fillColor: '#FCD34D', fillOpacity: 0.12, dashArray: '6 4',
};
const boundaryMatchedStyle = {
  color: '#10B981', weight: 3, fillColor: '#6EE7B7', fillOpacity: 0.15,
};

// Disable past dates for date pickers
const disablePastDates = (current: dayjs.Dayjs) =>
  current && current.isBefore(dayjs().startOf('day'));

// --- Main form ---

export default function RequestFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isEdit = !!id;

  const { data: request, isLoading } = useServiceRequest(id!);
  const createRequest = useCreateServiceRequest();
  const updateRequest = useUpdateServiceRequest();

  const { data: contacts } = useAllContacts();
  const { data: companies } = useAllCompanies();
  const { data: locations } = useAllServiceLocations();
  const { data: agents } = useAgents();

  // Watched form values for reactive behaviour
  const companyId = Form.useWatch('company_id', form);
  const contactId = Form.useWatch('contact_id', form);
  const serviceAddress = Form.useWatch('service_address', form);

  const [sameAsService, setSameAsService] = useState(false);
  const [isContactDrawerOpen, setIsContactDrawerOpen] = useState(false);
  const [isCompanyDrawerOpen, setIsCompanyDrawerOpen] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);

  // Service location map state (unchanged)
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<{ value: string; label: string; lat: number; lng: number; localId?: string }[]>([]);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [boundaryData, setBoundaryData] = useState<{ type: string; coordinates: number[][][] | number[][][][] } | null>(null);
  const [boundaryName, setBoundaryName] = useState('');
  const [boundaryMatched, setBoundaryMatched] = useState(false);
  const [noServiceWarning, setNoServiceWarning] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boundaryKeyRef = useRef(0);
  const isTypingRef = useRef(false);

  const selectedLocation = (locations || []).find((l) => l.id === selectedLocationId) || null;

  // Filter contacts by selected company (or show all)
  const filteredContacts = useMemo(() => {
    if (!contacts) return [];
    if (!companyId) return contacts;
    return contacts.filter((c) => c.company_id === companyId);
  }, [contacts, companyId]);

  // Clear contact when company changes if the contact doesn't belong to new company
  useEffect(() => {
    const currentContactId = form.getFieldValue('contact_id');
    if (currentContactId && contacts) {
      const currentContact = contacts.find((c) => c.id === currentContactId);
      if (currentContact && companyId && currentContact.company_id !== companyId) {
        form.setFieldsValue({ contact_id: undefined, email: '' });
      }
    }
  }, [companyId, contacts, form]);

  // Auto-populate email from selected contact
  useEffect(() => {
    if (contactId && contacts) {
      const contact = contacts.find((c) => c.id === contactId);
      form.setFieldValue('email', contact?.email || '');
    } else if (!contactId) {
      form.setFieldValue('email', '');
    }
  }, [contactId, contacts, form]);

  // Sync billing address when "same as service" is active
  useEffect(() => {
    if (sameAsService) {
      form.setFieldValue('billing_address', serviceAddress || '');
    }
  }, [sameAsService, serviceAddress, form]);

  // Populate form in edit mode
  useEffect(() => {
    if (request) {
      form.setFieldsValue({
        subject: request.subject,
        description: request.description,
        contact_id: request.contact_id,
        location_id: request.location_id,
        priority: request.priority || request.priority_id,
        channel: request.channel,
        scheduled_start: request.scheduled_start ? dayjs(request.scheduled_start) : null,
        technician_ids: request.technicians?.map((tech) => tech.id) || [],
      });
      setSelectedLocationId(request.location_id || null);
      if (request.location_id && locations) {
        const loc = locations.find((l) => l.id === request.location_id);
        if (loc?.lat != null && loc?.lng != null) {
          setMapCoords({ lat: Number(loc.lat), lng: Number(loc.lng) });
          setBoundaryMatched(true);
          fetchBoundary(Number(loc.lat), Number(loc.lng), false);
        }
      }
    }
  }, [request, form, locations]);

  // --- Boundary fetch ---
  const fetchBoundary = useCallback(async (lat: number, lng: number, updateSearchText = true) => {
    try {
      const data = await fetchNominatimBoundary(lat, lng);
      if (data.geojson && (data.geojson.type === 'Polygon' || data.geojson.type === 'MultiPolygon')) {
        setBoundaryData(data.geojson);
        const areaName = data.address?.city || data.address?.town || data.address?.village ||
          data.address?.county || data.address?.state_district || data.display_name || '';
        setBoundaryName(areaName);
        boundaryKeyRef.current += 1;
      } else {
        setBoundaryData(null);
        setBoundaryName('');
      }
      if (updateSearchText && data.display_name && !isTypingRef.current) {
        setSearchText(data.display_name);
      }
    } catch {
      // Boundary fetch failed — not critical
    }
  }, []);

  const matchLocationAndFetchBoundary = useCallback(async (lat: number, lng: number) => {
    setMapCoords({ lat, lng });
    const match = findNearestLocation(lat, lng, locations || [], MATCH_RADIUS_KM);
    if (match) {
      form.setFieldsValue({ location_id: match.location.id });
      setSelectedLocationId(match.location.id);
      setNoServiceWarning('');
      setBoundaryMatched(true);
      message.success(
        t('serviceRequests.serviceLocationMatched', { address: match.location.address }) +
        (match.distance > 0.5 ? t('serviceRequests.distanceAway', { distance: match.distance.toFixed(1) }) : ''),
      );
    } else {
      form.setFieldsValue({ location_id: undefined });
      setSelectedLocationId(null);
      setBoundaryMatched(false);
      setNoServiceWarning(t('serviceRequests.noServiceWarning'));
    }
    await fetchBoundary(lat, lng);
  }, [locations, form, fetchBoundary, t]);

  const handleDropdownSelect = (value: string | undefined) => {
    if (!value) {
      form.setFieldsValue({ location_id: undefined });
      setSelectedLocationId(null);
      setBoundaryData(null);
      setBoundaryName('');
      setNoServiceWarning('');
      setBoundaryMatched(false);
      return;
    }
    const loc = (locations || []).find((l) => l.id === value);
    if (loc) {
      form.setFieldsValue({ location_id: loc.id });
      setSelectedLocationId(loc.id);
      setNoServiceWarning('');
      setBoundaryMatched(true);
      setSearchText(loc.address || '');
      if (loc.lat != null && loc.lng != null) {
        setMapCoords({ lat: Number(loc.lat), lng: Number(loc.lng) });
        fetchBoundary(Number(loc.lat), Number(loc.lng), false);
      }
      message.success(t('serviceRequests.selectedAddress', { address: loc.address }));
    }
  };

  const handleSearch = useCallback((query: string) => {
    setSearchText(query);
    isTypingRef.current = true;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (query.length < 2) { setSuggestions([]); return; }
    const lowerQuery = query.toLowerCase();
    const localMatches = (locations || [])
      .filter((l) => l.address && l.address.toLowerCase().includes(lowerQuery) && l.lat != null && l.lng != null)
      .slice(0, 3)
      .map((l) => ({
        value: l.address || '',
        label: t('serviceRequests.savedLocationLabel', { address: l.address }),
        lat: Number(l.lat),
        lng: Number(l.lng),
        localId: l.id,
      }));
    setSuggestions(localMatches.length > 0
      ? localMatches
      : [{ value: '', label: t('serviceRequests.searching'), lat: 0, lng: 0 }],
    );
    if (query.length >= 3) {
      debounceTimer.current = setTimeout(async () => {
        try {
          const features = await photonSearch(query);
          const photonResults = features.map((f) => {
            const p = f.properties;
            const [lon, lat] = f.geometry.coordinates;
            const label = [
              p.name,
              p.street && p.housenumber ? `${p.street} ${p.housenumber}` : p.street,
              p.city || p.town || p.village, p.state, p.country,
            ].filter(Boolean).join(', ');
            return { value: label, label: `🔍 ${label}`, lat, lng: lon };
          });
          const combined = [...localMatches, ...photonResults];
          setSuggestions(combined.length > 0 ? combined : [{ value: '', label: t('serviceRequests.noResults'), lat: 0, lng: 0 }]);
        } catch {
          setSuggestions(localMatches.length > 0 ? localMatches : [{ value: '', label: t('serviceRequests.searchFailed'), lat: 0, lng: 0 }]);
        }
      }, 300);
    }
  }, [locations, t]);

  const handleSelectSuggestion = (_value: string, option: { lat?: number; lng?: number; value?: string; localId?: string }) => {
    isTypingRef.current = false;
    setSuggestions([]);
    if (!option.lat && !option.lng) return;
    if (option.localId) {
      const loc = (locations || []).find((l) => l.id === option.localId);
      if (loc) {
        form.setFieldsValue({ location_id: loc.id });
        setSelectedLocationId(loc.id);
        setNoServiceWarning('');
        setBoundaryMatched(true);
        setSearchText(loc.address || '');
        if (loc.lat != null && loc.lng != null) {
          setMapCoords({ lat: Number(loc.lat), lng: Number(loc.lng) });
          fetchBoundary(Number(loc.lat), Number(loc.lng), false);
        }
        message.success(t('serviceRequests.selectedAddress', { address: loc.address }));
        return;
      }
    }
    setSearchText(option.value || '');
    matchLocationAndFetchBoundary(option.lat!, option.lng!);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) { message.error(t('serviceRequests.geolocationNotSupported')); return; }
    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFetchingLocation(false);
        matchLocationAndFetchBoundary(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setFetchingLocation(false);
        message.error(t('serviceRequests.unableToGetLocation'));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleMapClick = useCallback((lat: number, lng: number) => {
    matchLocationAndFetchBoundary(lat, lng);
  }, [matchLocationAndFetchBoundary]);

  const handleMarkerDrag = useCallback((lat: number, lng: number) => {
    matchLocationAndFetchBoundary(lat, lng);
  }, [matchLocationAndFetchBoundary]);

  // --- Submit ---
  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!values.location_id) {
      message.warning(t('serviceRequests.selectExistingLocationWarning'));
      return;
    }
    // Build a payload containing only fields the backend DTO accepts.
    // (Global ValidationPipe runs with forbidNonWhitelisted:true — unknown fields throw 400.)
    const v = values as any;
    const payload = {
      subject: v.subject,
      description: v.description || undefined,
      contact_id: v.contact_id || undefined,
      location_id: v.location_id || undefined,
      priority: v.priority || undefined,
      channel: v.channel || undefined,
      technician_ids: v.technician_ids?.length ? v.technician_ids : undefined,
      lat: mapCoords.lat || undefined,
      lng: mapCoords.lng || undefined,
      scheduled_start: v.scheduled_start
        ? dayjs(v.scheduled_start as any).toISOString()
        : undefined,
    };
    try {
      if (isEdit) {
        await updateRequest.mutateAsync({ id: id!, ...payload });
      } else {
        await createRequest.mutateAsync(payload as any);
      }
      navigate('/service-requests');
    } catch {
      // Error handled by mutation hooks
    }
  };

  if (isEdit && isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Skeleton active />
      </div>
    );
  }

  const boundaryFeature = boundaryData
    ? { type: 'Feature' as const, geometry: boundaryData, properties: { name: boundaryName } }
    : null;

  return (
    <div>
      <PageHeader
        title={isEdit ? t('serviceRequests.editTitle') : t('serviceRequests.createTitle')}
        subtitle={
          isEdit
            ? t('serviceRequests.editSubtitle', { subject: request?.subject || '' })
            : t('serviceRequests.createSubtitle')
        }
        onBack={() => navigate('/service-requests')}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
        initialValues={{ priority: 'MEDIUM', channel: 'phone', preferred_time: 'Anytime' }}
      >
        {/* ── Row 1: Request details + Location map ── */}
        <Row gutter={24}>
          {/* Left column: Request details */}
          <Col xs={24} lg={11}>
            <Card title={t('serviceRequests.requestDetails')} style={{ marginBottom: 24 }}>
              <Form.Item
                name="subject"
                label={t('serviceRequests.subject')}
                rules={[{ required: true, message: t('serviceRequests.subjectRequired') }]}
              >
                <Input placeholder={t('serviceRequests.subjectPlaceholder')} />
              </Form.Item>

              <Form.Item name="description" label={t('serviceRequests.description')}>
                <TextArea rows={3} placeholder={t('serviceRequests.descriptionPlaceholder')} />
              </Form.Item>

              <Form.Item
                name="scheduled_start"
                label={t('serviceRequests.scheduledDate')}
                rules={[{ required: true, message: t('serviceRequests.scheduledDateRequired') }]}
              >
                <DatePicker
                  format="YYYY-MM-DD"
                  placeholder={t('serviceRequests.selectScheduledDate')}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Divider style={{ margin: '16px 0' }} />

              {/* ── 1. Priority ── */}
              <Form.Item name="priority" label={t('serviceRequests.priority')}>
                <Select placeholder={t('serviceRequests.select')} allowClear>
                  <Select.Option value="LOW">Low</Select.Option>
                  <Select.Option value="MEDIUM">Medium</Select.Option>
                  <Select.Option value="HIGH">High</Select.Option>
                  <Select.Option value="CRITICAL">Critical</Select.Option>
                </Select>
              </Form.Item>

              {/* ── 2. Company → Contact (side by side) ── */}
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="company_id" label="Company">
                    <Select
                      placeholder="Select company"
                      showSearch
                      allowClear
                      optionFilterProp="label"
                      options={companies?.map((c) => ({ value: c.id, label: c.name })) || []}
                      dropdownRender={(menu) => (
                        <>
                          {menu}
                          <Divider style={{ margin: '8px 0' }} />
                          <Button
                            type="text"
                            icon={<PlusOutlined />}
                            onClick={() => setIsCompanyDrawerOpen(true)}
                            style={{ width: '100%', textAlign: 'left', padding: '4px 12px' }}
                          >
                            + Create New Company
                          </Button>
                        </>
                      )}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="contact_id"
                    label={t('serviceRequests.customer')}
                    rules={[{ required: true, message: t('serviceRequests.customerRequired') }]}
                  >
                    <Select
                      placeholder={t('serviceRequests.selectCustomer')}
                      showSearch
                      allowClear
                      optionFilterProp="label"
                      options={filteredContacts.map((c) => ({
                        value: c.id,
                        label: `${c.first_name} ${[c.last_name].filter(Boolean).join('')}${c.email ? ` (${c.email})` : ''}`,
                      }))}
                      dropdownRender={(menu) => (
                        <>
                          {companyId && filteredContacts.length === 0 ? (
                            <div style={{ padding: '8px 12px', color: '#6b7280', fontSize: 13 }}>
                              {`No contacts found for ${companies?.find((c) => c.id === companyId)?.name ?? 'this company'} — `}
                              <Button
                                type="link"
                                size="small"
                                style={{ padding: 0, height: 'auto' }}
                                onClick={() => setIsContactDrawerOpen(true)}
                              >
                                + Create one?
                              </Button>
                            </div>
                          ) : (
                            menu
                          )}
                          <Divider style={{ margin: '8px 0' }} />
                          <Button
                            type="text"
                            icon={<PlusOutlined />}
                            onClick={() => setIsContactDrawerOpen(true)}
                            style={{ width: '100%', textAlign: 'left', padding: '4px 12px' }}
                          >
                            + Create New Contact
                          </Button>
                        </>
                      )}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* ── 3. Email (auto-populated from contact) ── */}
              <Form.Item name="email" label="Email">
                <Input
                  placeholder="Contact email or enter manually"
                  type="email"
                />
              </Form.Item>

              {/* Customer phone display (conditional) */}
              <Form.Item
                noStyle
                shouldUpdate={(prev, curr) => prev.contact_id !== curr.contact_id}
              >
                {({ getFieldValue }) => {
                  const selectedId = getFieldValue('contact_id');
                  const contact = contacts?.find((c) => c.id === selectedId);
                  if (!contact) return null;
                  return (
                    <Form.Item label={t('serviceRequests.customerPhone')} required>
                      <Input
                        readOnly
                        value={contact.phone || t('serviceRequests.noPhoneOnRecord')}
                        style={{
                          background: contact.phone ? undefined : '#fff7e6',
                          color: contact.phone ? undefined : '#d46b08',
                        }}
                        suffix={
                          !contact.phone && (
                            <Text type="warning" style={{ fontSize: 11 }}>
                              {t('serviceRequests.addPhoneInContacts')}
                            </Text>
                          )
                        }
                      />
                    </Form.Item>
                  );
                }}
              </Form.Item>

              <Divider style={{ margin: '16px 0' }} />

              <Form.Item name="channel" label={t('serviceRequests.channel')}>
                <Select placeholder={t('serviceRequests.selectChannel')}>
                  <Select.Option value="phone">{t('serviceRequests.channelPhone')}</Select.Option>
                  <Select.Option value="email">{t('serviceRequests.channelEmail')}</Select.Option>
                  <Select.Option value="portal">{t('serviceRequests.channelPortal')}</Select.Option>
                  <Select.Option value="webform">{t('serviceRequests.channelWebform')}</Select.Option>
                  <Select.Option value="api">{t('serviceRequests.channelApi')}</Select.Option>
                  <Select.Option value="whatsapp">{t('serviceRequests.channelWhatsapp')}</Select.Option>
                  <Select.Option value="sms">{t('serviceRequests.channelSms')}</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item name="technician_ids" label={t('serviceRequests.assignedTechnicians')}>
                <Select
                  mode="multiple"
                  placeholder={t('serviceRequests.selectTechnicians', 'Select technicians')}
                  allowClear
                  options={agents?.map((a) => ({
                    value: a.id,
                    label: `${a.first_name} ${a.last_name}`,
                  })) || []}
                />
              </Form.Item>

              <Form.Item label={t('serviceRequests.attachmentsOptional')} style={{ marginBottom: 0 }}>
                <Upload.Dragger
                  multiple
                  fileList={fileList}
                  beforeUpload={() => false}
                  onChange={({ fileList: newList }) => setFileList(newList)}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                >
                  <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                  <p className="ant-upload-text">{t('serviceRequests.uploadDragText')}</p>
                  <p className="ant-upload-hint">{t('serviceRequests.uploadHint')}</p>
                </Upload.Dragger>
              </Form.Item>
            </Card>
          </Col>

          {/* Right column: Service location map (unchanged) */}
          <Col xs={24} lg={13}>
            <Card
              title={
                <Space>
                  <EnvironmentOutlined />
                  {t('serviceRequests.serviceLocation')}
                  <span style={{ color: '#ff4d4f' }}>*</span>
                </Space>
              }
              extra={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t('serviceRequests.locationsAvailable', { count: locations?.length || 0 })}
                </Text>
              }
              style={{ marginBottom: 24 }}
            >
              <Form.Item
                name="location_id"
                hidden
                rules={[{ required: true, message: t('serviceRequests.pleaseSelectLocation') }]}
              >
                <Input />
              </Form.Item>

              <Text strong style={{ display: 'block', marginBottom: 6 }}>
                {t('serviceRequests.quickSelect')}
              </Text>
              <Select
                value={selectedLocationId || undefined}
                placeholder={t('serviceRequests.selectFromExisting')}
                allowClear
                showSearch
                optionFilterProp="label"
                style={{ width: '100%', marginBottom: 16 }}
                size="large"
                onChange={handleDropdownSelect}
                options={(locations || []).map((l) => ({ value: l.id, label: l.address }))}
              />

              <Divider style={{ margin: '0 0 16px 0' }}>{t('serviceRequests.orFindOnMap')}</Divider>

              <AutoComplete
                value={searchText}
                options={suggestions}
                onSearch={handleSearch}
                onSelect={handleSelectSuggestion}
                onBlur={() => { isTypingRef.current = false; }}
                filterOption={false}
                placeholder={t('serviceRequests.searchAddress')}
                style={{ width: '100%', marginBottom: 8 }}
                size="large"
                allowClear
                onClear={() => { setSearchText(''); setSuggestions([]); }}
              />

              <Button
                icon={fetchingLocation ? <LoadingOutlined /> : <AimOutlined />}
                onClick={handleUseCurrentLocation}
                loading={fetchingLocation}
                block
                style={{ marginBottom: 8 }}
              >
                {t('serviceRequests.useCurrentLocation')}
              </Button>

              <div style={{ height: 350, borderRadius: 8, overflow: 'hidden', border: '1px solid #e8e8e8' }}>
                <MapContainer
                  center={[mapCoords.lat || 25.276987, mapCoords.lng || 55.296249]}
                  zoom={mapCoords.lat && mapCoords.lng ? 12 : 3}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapUpdater lat={mapCoords.lat} lng={mapCoords.lng} />
                  <MapClickHandler onMapClick={handleMapClick} />
                  {boundaryFeature && (
                    <GeoJSON
                      key={boundaryKeyRef.current}
                      data={boundaryFeature as GeoJSON.Feature}
                      style={boundaryMatched ? boundaryMatchedStyle : boundaryStyle}
                    />
                  )}
                  {(locations || []).filter((l) => l.lat != null && l.lng != null).map((loc) => (
                    <CircleMarker
                      key={loc.id}
                      center={[Number(loc.lat), Number(loc.lng)]}
                      radius={8}
                      pathOptions={{
                        color: loc.id === selectedLocationId ? '#10B981' : '#3B82F6',
                        fillColor: loc.id === selectedLocationId ? '#10B981' : '#3B82F6',
                        fillOpacity: 0.8,
                        weight: 2,
                      }}
                      eventHandlers={{
                        click: () => {
                          form.setFieldsValue({ location_id: loc.id });
                          setSelectedLocationId(loc.id);
                          setNoServiceWarning('');
                          setBoundaryMatched(true);
                          setSearchText(loc.address || '');
                          if (loc.lat != null && loc.lng != null) {
                            setMapCoords({ lat: Number(loc.lat), lng: Number(loc.lng) });
                            fetchBoundary(Number(loc.lat), Number(loc.lng), false);
                          }
                          message.success(t('serviceRequests.selectedAddress', { address: loc.address }));
                        },
                      }}
                    >
                      <Tooltip>{loc.address}</Tooltip>
                    </CircleMarker>
                  ))}
                  {mapCoords.lat !== 0 && mapCoords.lng !== 0 && (
                    <DraggableMarker
                      lat={mapCoords.lat}
                      lng={mapCoords.lng}
                      onDragEnd={handleMarkerDrag}
                    />
                  )}
                </MapContainer>
              </div>

              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 6 }}>
                {t('serviceRequests.mapHelpText')}
              </Text>

              {selectedLocation && (
                <Alert
                  message={
                    <span>
                      {t('serviceRequests.matchedServiceLocation')}{' '}
                      <strong>{selectedLocation.address}</strong>
                      {boundaryName && (
                        <Text type="secondary" style={{ marginLeft: 8 }}>
                          {t('serviceRequests.inBoundary', { name: boundaryName })}
                        </Text>
                      )}
                    </span>
                  }
                  type="success"
                  showIcon
                  icon={<CheckCircleOutlined />}
                  style={{ marginTop: 12 }}
                  banner
                />
              )}
              {noServiceWarning && !selectedLocation && (
                <Alert
                  message={noServiceWarning}
                  type="warning"
                  showIcon
                  icon={<WarningOutlined />}
                  banner
                  style={{ marginTop: 12 }}
                />
              )}
              {(locations || []).length === 0 && (
                <Alert
                  message={t('serviceRequests.noLocationsAvailable')}
                  type="warning"
                  showIcon
                  banner
                  style={{ marginTop: 12 }}
                />
              )}
            </Card>
          </Col>
        </Row>

        {/* ── Row 2: Address Details ── */}
        <Card title="Address Details" style={{ marginBottom: 24 }}>
          <Row gutter={24}>
            {/* ── 4. Service Address ── */}
            <Col xs={24} lg={12}>
              <Form.Item name="service_address" label="Service Address">
                <AddressPickerField placeholder="Search service address..." />
              </Form.Item>
            </Col>

            {/* ── 5. Billing Address ── */}
            <Col xs={24} lg={12}>
              <Form.Item
                label={
                  <Space>
                    <span>Billing Address</span>
                    <Checkbox
                      checked={sameAsService}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSameAsService(checked);
                        if (checked) {
                          const current = form.getFieldValue('service_address') || '';
                          form.setFieldValue('billing_address', current);
                        } else {
                          form.setFieldValue('billing_address', '');
                        }
                      }}
                      style={{ fontWeight: 400, fontSize: 13 }}
                    >
                      Same as service address
                    </Checkbox>
                  </Space>
                }
                name="billing_address"
              >
                <AddressPickerField
                  placeholder="Search billing address..."
                  disabled={sameAsService}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ── Row 3: Scheduling Preferences ── */}
        <Card title="Scheduling Preferences" style={{ marginBottom: 24 }}>
          {/* ── 6. Preferred Date 1 + Preferred Date 2 (side by side) ── */}
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="preferred_date_1" label="Preferred Date 1">
                <DatePicker
                  format="YYYY-MM-DD"
                  placeholder="Select preferred date"
                  style={{ width: '100%' }}
                  disabledDate={disablePastDates}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="preferred_date_2" label="Preferred Date 2">
                <DatePicker
                  format="YYYY-MM-DD"
                  placeholder="Select preferred date"
                  style={{ width: '100%' }}
                  disabledDate={disablePastDates}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* ── 7. Preferred Time ── */}
          <Form.Item name="preferred_time" label="Preferred Time">
            <Select>
              <Select.Option value="Anytime">Anytime</Select.Option>
              <Select.Option value="Morning">Morning</Select.Option>
              <Select.Option value="Afternoon">Afternoon</Select.Option>
              <Select.Option value="Evening">Evening</Select.Option>
            </Select>
          </Form.Item>

          {/* ── 8. Preference Note ── */}
          <Form.Item name="preference_note" label="Preference Note" style={{ marginBottom: 0 }}>
            <TextArea
              rows={3}
              placeholder="Add any special instructions or customer preferences..."
            />
          </Form.Item>
        </Card>

        {/* ── Submit / Cancel ── */}
        <Card>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={createRequest.isPending || updateRequest.isPending}
            >
              {isEdit ? t('serviceRequests.updateRequest') : t('serviceRequests.createRequest')}
            </Button>
            <Button onClick={() => navigate('/service-requests')} icon={<CloseOutlined />}>
              {t('serviceRequests.cancel')}
            </Button>
          </Space>
        </Card>
      </Form>

      <CompanyQuickCreateDrawer
        open={isCompanyDrawerOpen}
        onClose={() => setIsCompanyDrawerOpen(false)}
        onSuccess={(newCompany) => {
          form.setFieldValue('company_id', newCompany.id);
          setIsCompanyDrawerOpen(false);
        }}
      />

      <ContactQuickCreateDrawer
        open={isContactDrawerOpen}
        onClose={() => setIsContactDrawerOpen(false)}
        defaultCompanyId={companyId}
        onSuccess={(newContact) => {
          form.setFieldValue('contact_id', newContact.id);
          form.setFieldValue('email', newContact.email || '');
          setIsContactDrawerOpen(false);
        }}
      />
    </div>
  );
}
