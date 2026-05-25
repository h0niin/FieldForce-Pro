import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Space, Skeleton, Select, Row, Col, Typography, message, Alert, Divider, AutoComplete, DatePicker } from 'antd';
import { EnvironmentOutlined, CheckCircleOutlined, WarningOutlined, SaveOutlined, CloseOutlined, AimOutlined, LoadingOutlined, PlusOutlined, RobotOutlined } from '@ant-design/icons';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, CircleMarker, Tooltip, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import dayjs from 'dayjs';
import { useServiceRequest, useCreateServiceRequest, useUpdateServiceRequest } from '@/hooks/use-service-requests';
import { useAllContacts } from '@/hooks/use-contacts';
import { useAllServiceLocations } from '@/hooks/use-service-locations';
import PageHeader from '@/components/common/PageHeader';
import CreateContactModal from '@/components/contacts/CreateContactModal';
import type { ServiceLocation } from '@/types/models.types';
import api from '@/api/axios-instance';

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

function DraggableMarker({ lat, lng, onDragEnd }: { lat: number; lng: number; onDragEnd: (lat: number, lng: number) => void }) {
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

// Find nearest service location within a max distance (km). Returns null if none within range.
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
    if (dist < minDist) {
      minDist = dist;
      nearest = loc;
    }
  }
  if (!nearest) return null;
  if (maxKm !== undefined && minDist > maxKm) return null;
  return { location: nearest, distance: minDist };
}

// Max distance (km) to auto-match a searched point to an existing service location
const MATCH_RADIUS_KM = 10;

// --- Photon geocoding (fast, free, no rate limit issues) ---
interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    postcode?: string;
    osm_value?: string;
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

// --- Nominatim (only for boundary polygon — single call after selection) ---
async function fetchNominatimBoundary(lat: number, lng: number) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&polygon_geojson=1&addressdetails=1`,
    { headers: { 'Accept': 'application/json', 'Accept-Language': 'en' } },
  );
  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
  return res.json();
}

// Boundary styles
const boundaryStyle = {
  color: '#F59E0B',
  weight: 3,
  fillColor: '#FCD34D',
  fillOpacity: 0.12,
  dashArray: '6 4',
};

const boundaryMatchedStyle = {
  color: '#10B981',
  weight: 3,
  fillColor: '#6EE7B7',
  fillOpacity: 0.15,
};

// --- Main form ---

export default function RequestFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isEdit = !!id;

  const { data: request, isLoading } = useServiceRequest(id!);
  const createRequest = useCreateServiceRequest();
  const updateRequest = useUpdateServiceRequest();
  const { data: contacts } = useAllContacts();
  const { data: locations } = useAllServiceLocations();

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
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

  const [aiDiagnosing, setAiDiagnosing] = useState(false);

  const handleAiDiagnose = () => {
    const descValue = form.getFieldValue('description');
    if (!descValue || descValue.trim().length < 10) {
      message.warning('Please enter a description of at least 10 characters to diagnose with AI.');
      return;
    }

    setAiDiagnosing(true);
    api
      .post('/ai/diagnose', { description: descValue })
      .then((res) => {
        setAiDiagnosing(false);
        const data = res.data?.data;
        if (data) {
          // AI urgency: Low, Medium, High, Critical -> priority: low, medium, high, urgent
          let mappedPriority = data.urgency.toLowerCase();
          if (mappedPriority === 'critical') {
            mappedPriority = 'urgent';
          }
          
          form.setFieldsValue({
            category: data.category,
            priority: mappedPriority,
          });

          const appendedText = `\n\n--- AI Diagnosis Report ---\nEstimated Issue: ${data.estimated_issue}\nRecommended Tools: ${data.recommended_tools.join(', ')}`;
          form.setFieldsValue({
            description: descValue + appendedText,
          });

          message.success('AI issue diagnosis completed successfully!');
        } else {
          throw new Error('Invalid diagnosis response from backend');
        }
      })
      .catch((err) => {
        setAiDiagnosing(false);
        const errMsg = err?.response?.data?.message || 'Failed to complete AI issue diagnosis.';
        message.error(errMsg);
      });
  };

  const selectedLocation = (locations || []).find((l) => l.id === selectedLocationId) || null;

  useEffect(() => {
    if (request) {
      form.setFieldsValue({
        subject: request.subject,
        description: request.description,
        contact_id: request.contact_id,
        location_id: request.location_id,
        priority: request.priority,
        category: request.category,
        channel: request.channel,
        scheduled_start: request.scheduled_start ? dayjs(request.scheduled_start) : null,
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

  // --- Fetch and show boundary on map for any lat/lng ---
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
      // Boundary fetch failed — not critical, just skip
    }
  }, []);

  // --- Check if user-selected point matches an existing service location ---
  const matchLocationAndFetchBoundary = useCallback(async (lat: number, lng: number) => {
    setMapCoords({ lat, lng });

    // 1. Check if any existing service location is near the selected point
    const match = findNearestLocation(lat, lng, locations || [], MATCH_RADIUS_KM);

    if (match) {
      form.setFieldsValue({ location_id: match.location.id });
      setSelectedLocationId(match.location.id);
      setNoServiceWarning('');
      setBoundaryMatched(true);
      message.success(
        `Service location matched: ${match.location.address}` +
        (match.distance > 0.5 ? ` (${match.distance.toFixed(1)} km away)` : ''),
      );
    } else {
      form.setFieldsValue({ location_id: undefined });
      setSelectedLocationId(null);
      setBoundaryMatched(false);
      setNoServiceWarning(
        'This location does not match any existing service location. Please select a location that was already created in the Service Locations page, or create a new service location first.',
      );
    }

    // 2. Always fetch and show the boundary
    await fetchBoundary(lat, lng);
  }, [locations, form, fetchBoundary]);

  // --- Dropdown selection (direct pick — always valid) ---
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
        // Fetch boundary for this location
        fetchBoundary(Number(loc.lat), Number(loc.lng), false);
      }
      message.success(`Selected: ${loc.address}`);
    }
  };

  // --- Address search (existing locations first, then Photon geocoder) ---
  const handleSearch = useCallback((query: string) => {
    setSearchText(query);
    isTypingRef.current = true;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const lowerQuery = query.toLowerCase();

    // 1. Immediately show matching saved locations
    const localMatches = (locations || [])
      .filter((l) => l.address && l.address.toLowerCase().includes(lowerQuery) && l.lat != null && l.lng != null)
      .slice(0, 3)
      .map((l) => ({
        value: l.address || '',
        label: `📍 ${l.address} (Saved Location)`,
        lat: Number(l.lat),
        lng: Number(l.lng),
        localId: l.id,
      }));

    setSuggestions(localMatches.length > 0
      ? localMatches
      : [{ value: '', label: '🔍 Searching...', lat: 0, lng: 0 }],
    );

    // 2. Debounce the Photon search (300ms — no rate limit issues)
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
              p.city || p.town || p.village,
              p.state,
              p.country,
            ].filter(Boolean).join(', ');

            return {
              value: label,
              label: `🔍 ${label}`,
              lat,
              lng: lon,
            };
          });

          const combined = [...localMatches, ...photonResults];
          setSuggestions(combined.length > 0 ? combined : [{ value: '', label: 'No results found', lat: 0, lng: 0 }]);
        } catch {
          setSuggestions(localMatches.length > 0 ? localMatches : [{ value: '', label: 'Search failed. Try again.', lat: 0, lng: 0 }]);
        }
      }, 300);
    }
  }, [locations]);

  const handleSelectSuggestion = (_value: string, option: { lat?: number; lng?: number; value?: string; localId?: string }) => {
    isTypingRef.current = false;
    setSuggestions([]);

    // Ignore placeholder items
    if (!option.lat && !option.lng) return;

    // Direct pick of existing service location — always valid
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
          // Fetch boundary for this location
          fetchBoundary(Number(loc.lat), Number(loc.lng), false);
        }
        message.success(`Selected: ${loc.address}`);
        return;
      }
    }

    // Nominatim result — check if it matches an existing service location
    setSearchText(option.value || '');
    matchLocationAndFetchBoundary(option.lat!, option.lng!);
  };

  // --- Current location ---
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) { message.error('Geolocation not supported'); return; }
    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFetchingLocation(false);
        matchLocationAndFetchBoundary(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setFetchingLocation(false);
        message.error('Unable to get your location.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // --- Map click / marker drag ---
  const handleMapClick = useCallback((lat: number, lng: number) => {
    matchLocationAndFetchBoundary(lat, lng);
  }, [matchLocationAndFetchBoundary]);

  const handleMarkerDrag = useCallback((lat: number, lng: number) => {
    matchLocationAndFetchBoundary(lat, lng);
  }, [matchLocationAndFetchBoundary]);

  // --- Submit ---
  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!values.location_id) {
      message.warning('Please select an existing service location.');
      return;
    }
    const payload = {
      ...values,
      lat: mapCoords.lat || undefined,
      lng: mapCoords.lng || undefined,
      scheduled_start: values.scheduled_start ? dayjs(values.scheduled_start as any).toISOString() : undefined,
    };
    try {
      if (isEdit) {
        await updateRequest.mutateAsync({ id: id!, ...payload });
      } else {
        await createRequest.mutateAsync(payload as unknown as Record<string, unknown> & { subject: string });
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

  // Wrap boundary geometry as a GeoJSON Feature for react-leaflet
  const boundaryFeature = boundaryData
    ? { type: 'Feature' as const, geometry: boundaryData, properties: { name: boundaryName } }
    : null;

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Service Request' : 'New Service Request'}
        subtitle={isEdit ? `Editing request: ${request?.subject || ''}` : 'Create a new service request and assign a location'}
        onBack={() => navigate('/service-requests')}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
        initialValues={{ priority: 'medium', channel: 'phone' }}
      >
        <Row gutter={24}>
          {/* Left column: Request details */}
          <Col xs={24} lg={10}>
            <Card title="Request Details" style={{ marginBottom: 24 }}>
              <Form.Item
                name="subject"
                label="Subject"
                rules={[{ required: true, message: 'Please enter a subject' }]}
              >
                <Input placeholder="e.g. AC unit not cooling" />
              </Form.Item>

              <Form.Item label="Description">
                <Form.Item name="description" noStyle>
                  <TextArea rows={4} placeholder="Describe the service request in detail..." />
                </Form.Item>
                <div style={{ textAlign: 'right', marginTop: 8 }}>
                  <Button
                    type="default"
                    icon={<RobotOutlined />}
                    loading={aiDiagnosing}
                    onClick={handleAiDiagnose}
                    style={{
                      background: 'linear-gradient(135deg, #108ee9 0%, #87d068 100%)',
                      border: 'none',
                      color: '#fff',
                      fontWeight: 600,
                      borderRadius: 16,
                      padding: '0 16px',
                    }}
                  >
                    Diagnose with AI
                  </Button>
                </div>
              </Form.Item>

              <Form.Item
                name="scheduled_start"
                label="Scheduled Date"
                rules={[{ required: true, message: 'Scheduled date is required' }]}
              >
                <DatePicker
                  format="YYYY-MM-DD"
                  placeholder="Select scheduled date"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                name="contact_id"
                label="Customer (Contact)"
                rules={[{ required: true, message: 'Customer is required' }]}
              >
                <Select
                  placeholder="Select customer"
                  showSearch
                  optionFilterProp="label"
                  onChange={() => {}}
                  options={contacts?.map((c) => ({
                    value: c.id,
                    label: `${c.first_name} ${c.last_name}${c.email ? ` (${c.email})` : ''}`,
                  })) || []}
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      <Divider style={{ margin: '8px 0' }} />
                      <Button
                        type="text"
                        icon={<PlusOutlined />}
                        onClick={() => setIsContactModalOpen(true)}
                        style={{ width: '100%', textAlign: 'left', padding: '4px 12px' }}
                      >
                        Create New Customer
                      </Button>
                    </>
                  )}
                />
              </Form.Item>
              <Form.Item
                noStyle
                shouldUpdate={(prev, curr) => prev.contact_id !== curr.contact_id}
              >
                {({ getFieldValue }) => {
                  const selectedId = getFieldValue('contact_id');
                  const contact = contacts?.find((c) => c.id === selectedId);
                  if (!contact) return null;
                  return (
                    <Form.Item label="Customer Phone" required>
                      <Input
                        readOnly
                        value={contact.phone || 'No phone on record'}
                        style={{
                          background: contact.phone ? undefined : '#fff7e6',
                          color: contact.phone ? undefined : '#d46b08',
                        }}
                        suffix={
                          !contact.phone && (
                            <Text type="warning" style={{ fontSize: 11 }}>
                              Add phone in Contacts
                            </Text>
                          )
                        }
                      />
                    </Form.Item>
                  );
                }}
              </Form.Item>

              <Divider style={{ margin: '16px 0' }} />

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="priority" label="Priority">
                    <Select placeholder="Select">
                      <Select.Option value="low">Low</Select.Option>
                      <Select.Option value="medium">Medium</Select.Option>
                      <Select.Option value="high">High</Select.Option>
                      <Select.Option value="urgent">Urgent</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="category" label="Category">
                    <Select placeholder="Select" allowClear>
                      <Select.Option value="HVAC">HVAC</Select.Option>
                      <Select.Option value="Plumbing">Plumbing</Select.Option>
                      <Select.Option value="Electrical">Electrical</Select.Option>
                      <Select.Option value="Appliance">Appliance</Select.Option>
                      <Select.Option value="General">General</Select.Option>
                      <Select.Option value="Other">Other</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="channel" label="Channel" style={{ marginBottom: 0 }}>
                <Select placeholder="Select channel">
                  <Select.Option value="phone">Phone</Select.Option>
                  <Select.Option value="email">Email</Select.Option>
                  <Select.Option value="portal">Portal</Select.Option>
                  <Select.Option value="webform">Web Form</Select.Option>
                  <Select.Option value="api">API</Select.Option>
                  <Select.Option value="whatsapp">WhatsApp</Select.Option>
                  <Select.Option value="sms">SMS</Select.Option>
                </Select>
              </Form.Item>
            </Card>
          </Col>

          {/* Right column: Location picker */}
          <Col xs={24} lg={14}>
            <Card
              title={<Space><EnvironmentOutlined /> Service Location <span style={{ color: '#ff4d4f' }}>*</span></Space>}
              extra={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {locations?.length || 0} location{(locations?.length || 0) !== 1 ? 's' : ''} available
                </Text>
              }
              style={{ marginBottom: 24 }}
            >
              <Form.Item name="location_id" hidden rules={[{ required: true, message: 'Please select a service location' }]}>
                <Input />
              </Form.Item>

              {/* Quick select dropdown */}
              <Text strong style={{ display: 'block', marginBottom: 6 }}>Quick select:</Text>
              <Select
                value={selectedLocationId || undefined}
                placeholder="Select from existing locations..."
                allowClear
                showSearch
                optionFilterProp="label"
                style={{ width: '100%', marginBottom: 16 }}
                size="large"
                onChange={handleDropdownSelect}
                options={(locations || []).map((l) => ({
                  value: l.id,
                  label: l.address,
                }))}
              />

              <Divider style={{ margin: '0 0 16px 0' }}>or find on map</Divider>

              {/* Address search */}
              <AutoComplete
                value={searchText}
                options={suggestions}
                onSearch={handleSearch}
                onSelect={handleSelectSuggestion}
                onBlur={() => { isTypingRef.current = false; }}
                filterOption={false}
                placeholder="Search address..."
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
                Use My Current Location
              </Button>

              {/* Interactive map */}
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

                  {/* Boundary polygon (visual context) */}
                  {boundaryFeature && (
                    <GeoJSON
                      key={boundaryKeyRef.current}
                      data={boundaryFeature as GeoJSON.Feature}
                      style={boundaryMatched ? boundaryMatchedStyle : boundaryStyle}
                    />
                  )}

                  {/* Existing service locations as dots */}
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
                          message.success(`Selected: ${loc.address}`);
                        },
                      }}
                    >
                      <Tooltip>{loc.address}</Tooltip>
                    </CircleMarker>
                  ))}

                  {/* Draggable marker */}
                  {mapCoords.lat !== 0 && mapCoords.lng !== 0 && (
                    <DraggableMarker lat={mapCoords.lat} lng={mapCoords.lng} onDragEnd={handleMarkerDrag} />
                  )}
                </MapContainer>
              </div>

              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 6 }}>
                Search an address or click the map. Blue dots are existing service locations — your selection must match one.
              </Text>

              {/* Success: matched an existing service location */}
              {selectedLocation && (
                <Alert
                  message={
                    <span>
                      Matched service location: <strong>{selectedLocation.address}</strong>
                      {boundaryName && (
                        <Text type="secondary" style={{ marginLeft: 8 }}>
                          (in {boundaryName})
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

              {/* Warning: no matching service location */}
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

              {/* No locations at all */}
              {(locations || []).length === 0 && (
                <Alert
                  message="No service locations available. Please create a service location first."
                  type="warning"
                  showIcon
                  banner
                  style={{ marginTop: 12 }}
                />
              )}
            </Card>
          </Col>
        </Row>

        <Card>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={createRequest.isPending || updateRequest.isPending}
            >
              {isEdit ? 'Update Request' : 'Create Request'}
            </Button>
            <Button onClick={() => navigate('/service-requests')} icon={<CloseOutlined />}>
              Cancel
            </Button>
          </Space>
        </Card>
      </Form>

      <CreateContactModal
        open={isContactModalOpen}
        onCancel={() => setIsContactModalOpen(false)}
        onSuccess={(newContact) => {
          form.setFieldValue('contact_id', newContact.id);
          setIsContactModalOpen(false);
        }}
      />
    </div>
  );
}
