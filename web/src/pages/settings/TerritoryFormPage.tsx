import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Select, Button, Space, Row, Col, Typography, message, Spin } from 'antd';
import { SaveOutlined, CloseOutlined, SearchOutlined, UndoOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSetting, useUpsertSetting } from '@/hooks/use-settings';
import { useUsers } from '@/hooks/use-users';
import { useNotificationStore } from '@/store/notification.store';
import PageHeader from '@/components/common/PageHeader';
import { MapContainer, TileLayer, Marker, Polyline, Polygon, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const { Text } = Typography;

// Fix Leaflet default marker icon issue with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface TerritoryItem {
  id: string;
  name: string;
  description: string;
  zip_codes: string[];
  dispatcher_ids: string[];
  technician_ids: string[];
  coordinates?: [number, number][];
  color?: string;
}

// --- Nominatim Address Geocoder with Polygon capability ---
async function geocodeAddressWithPolygon(
  address: string,
): Promise<{ lat: number; lng: number; geojson?: any } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&polygon_geojson=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'FieldForcePro/1.0' } }
    );
    const data = await res.json();
    if (data?.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        geojson: data[0].geojson,
      };
    }
  } catch { /* silent */ }
  return null;
}

// Ramer-Douglas-Peucker (RDP) algorithm for polygon simplification
function getSqSegDist(p: [number, number], p1: [number, number], p2: [number, number]) {
  let x = p1[0], y = p1[1];
  let dx = p2[0] - x, dy = p2[1] - y;
  if (dx !== 0 || dy !== 0) {
    let t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = p2[0];
      y = p2[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  dx = p[0] - x;
  dy = p[1] - y;
  return dx * dx + dy * dy;
}

function simplifyDPStep(points: [number, number][], first: number, last: number, sqTolerance: number, simplified: [number, number][]) {
  let maxSqDist = sqTolerance;
  let index = -1;
  for (let i = first + 1; i < last; i++) {
    const sqDist = getSqSegDist(points[i], points[first], points[last]);
    if (sqDist > maxSqDist) {
      index = i;
      maxSqDist = sqDist;
    }
  }
  if (index > -1) {
    if (index - first > 1) simplifyDPStep(points, first, index, sqTolerance, simplified);
    simplified.push(points[index]);
    if (last - index > 1) simplifyDPStep(points, index, last, sqTolerance, simplified);
  }
}

function simplifyDouglasPeucker(points: [number, number][], tolerance: number): [number, number][] {
  if (points.length <= 2) return points;
  const sqTolerance = tolerance * tolerance;
  const last = points.length - 1;
  const simplified = [points[0]];
  simplifyDPStep(points, 0, last, sqTolerance, simplified);
  simplified.push(points[last]);
  return simplified;
}

function simplifyPolygonDynamic(points: [number, number][], maxPoints = 60): [number, number][] {
  if (points.length <= maxPoints) return points;
  let tolerance = 0.0005;
  let simplified = points;
  for (let i = 0; i < 5; i++) {
    simplified = simplifyDouglasPeucker(points, tolerance);
    if (simplified.length <= maxPoints) break;
    tolerance *= 2.5;
  }
  if (simplified.length > maxPoints) {
    const step = Math.ceil(simplified.length / maxPoints);
    const downsampled: [number, number][] = [];
    for (let i = 0; i < simplified.length; i += step) {
      downsampled.push(simplified[i]);
    }
    return downsampled;
  }
  return simplified;
}

// Convert GeoJSON coords (lng, lat) to Leaflet (lat, lng) and simplify
function extractLatLngsFromGeoJSON(geojson: any): [number, number][] {
  const coords: [number, number][] = [];
  if (!geojson) return coords;

  if (geojson.type === 'Polygon') {
    const ring = geojson.coordinates[0] || [];
    ring.forEach((pt: any) => {
      if (Array.isArray(pt) && pt.length >= 2) {
        coords.push([pt[1], pt[0]]);
      }
    });
  } else if (geojson.type === 'MultiPolygon') {
    let maxRing: any[] = [];
    geojson.coordinates.forEach((poly: any) => {
      const ring = poly[0] || [];
      if (ring.length > maxRing.length) {
        maxRing = ring;
      }
    });
    maxRing.forEach((pt: any) => {
      if (Array.isArray(pt) && pt.length >= 2) {
        coords.push([pt[1], pt[0]]);
      }
    });
  }
  
  return simplifyPolygonDynamic(coords, 60);
}

// Generate a circular boundary represented as a regular polygon
function generateCircularPolygon(center: [number, number], radiusKm = 5, numPoints = 16): [number, number][] {
  const [lat, lng] = center;
  const coords: [number, number][] = [];
  const kmPerDegreeLat = 111;
  const kmPerDegreeLng = 111 * Math.cos(lat * Math.PI / 180);

  for (let i = 0; i < numPoints; i++) {
    const angle = (i * 360 / numPoints) * Math.PI / 180;
    const offsetLat = (radiusKm * Math.sin(angle)) / kmPerDegreeLat;
    const offsetLng = (radiusKm * Math.cos(angle)) / kmPerDegreeLng;
    coords.push([lat + offsetLat, lng + offsetLng]);
  }
  coords.push([coords[0][0], coords[0][1]]);
  return coords;
}

// --- Map Events for clicking ---
function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// --- Map Center Updater ---
function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== 0) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

// --- Map Invalidator to fix render sizing ---
function MapInvalidator() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 400);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export default function TerritoryFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const addNotification = useNotificationStore((s) => s.add);

  // States
  const [boundaryCoords, setBoundaryCoords] = useState<[number, number][]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([25.276987, 55.296249]);
  const [searchAddress, setSearchAddress] = useState('');
  const [searchingMap, setSearchingMap] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#3B82F6');

  // Fetch setting key
  const { data: settingData, isLoading: isSettingsLoading } = useSetting('territories_settings');
  const upsertMutation = useUpsertSetting();

  // Fetch users for dropdown assignment
  const { data: usersData, isLoading: isUsersLoading } = useUsers({ take: 100 });
  const users = usersData?.data || [];

  const isEdit = !!id;

  const territories = useMemo(() => {
    return (settingData?.value?.list as TerritoryItem[]) || [];
  }, [settingData]);

  // Load editing item data
  useEffect(() => {
    if (id && territories.length > 0) {
      const found = territories.find((item) => item.id === id);
      if (found) {
        form.setFieldsValue({
          ...found,
          zip_codes: found.zip_codes.join(', '),
          color: found.color || '#3B82F6',
        });
        setSelectedColor(found.color || '#3B82F6');
        if (found.coordinates && found.coordinates.length > 0) {
          setBoundaryCoords(found.coordinates);
          // Centroid calculation to center map
          const latSum = found.coordinates.reduce((sum, c) => sum + c[0], 0);
          const lngSum = found.coordinates.reduce((sum, c) => sum + c[1], 0);
          setMapCenter([latSum / found.coordinates.length, lngSum / found.coordinates.length]);
        }
      }
    }
  }, [id, territories, form]);

  const handleMapClick = (lat: number, lng: number) => {
    setBoundaryCoords((prev) => [...prev, [lat, lng]]);
  };

  const handleUndoPoint = () => {
    setBoundaryCoords((prev) => prev.slice(0, prev.length - 1));
  };

  const handleClearBoundary = () => {
    setBoundaryCoords([]);
  };

  const handleMapSearch = async () => {
    if (!searchAddress.trim()) return;
    setSearchingMap(true);
    const res = await geocodeAddressWithPolygon(searchAddress);
    setSearchingMap(false);
    if (res) {
      setMapCenter([res.lat, res.lng]);
      let boundaryFound = false;
      if (res.geojson && (res.geojson.type === 'Polygon' || res.geojson.type === 'MultiPolygon')) {
        const extracted = extractLatLngsFromGeoJSON(res.geojson);
        if (extracted.length > 0) {
          setBoundaryCoords(extracted);
          message.success(`Territory boundary set from district border of "${searchAddress}"`);
          boundaryFound = true;
        }
      }
      
      // Fallback: circular polygon
      if (!boundaryFound) {
        const circularBoundary = generateCircularPolygon([res.lat, res.lng], 5, 16);
        setBoundaryCoords(circularBoundary);
        message.info(`No district border found. Created a default 5km circular boundary around "${searchAddress}".`);
      }
    } else {
      addNotification({
        id: `geo-err-${Date.now()}`,
        title: 'Search Failed',
        message: 'Could not find the specified location on the map.',
        type: 'error',
        read: false,
        created_at: new Date().toISOString()
      });
    }
  };

  const handleSubmit = async (values: any) => {
    const zipArray = values.zip_codes
      ? values.zip_codes
          .split(',')
          .map((z: string) => z.trim())
          .filter(Boolean)
      : [];

    let newList = [...territories];

    const updatedItem: TerritoryItem = {
      id: id ? id : `t-${Date.now()}`,
      name: values.name,
      description: values.description || '',
      zip_codes: zipArray,
      dispatcher_ids: values.dispatcher_ids || [],
      technician_ids: values.technician_ids || [],
      coordinates: boundaryCoords,
      color: selectedColor,
    };

    if (id) {
      newList = newList.map((item) =>
        item.id === id ? updatedItem : item
      );
    } else {
      newList.push(updatedItem);
    }

    await upsertMutation.mutateAsync({
      key: 'territories_settings',
      category: 'workforce',
      value: { list: newList },
    });
    
    message.success(isEdit ? 'Territory updated successfully' : 'Territory created successfully');
    navigate('/settings/territories');
  };

  if (isSettingsLoading || isUsersLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? t('settings.territories.editTitle', 'Edit Territory') : t('settings.territories.createTitle', 'Create Territory')}
        subtitle={isEdit ? `Edit properties and boundaries of the territory` : `Create a new geographic territory with a custom map boundary`}
        onBack={() => navigate('/settings/territories')}
      />

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={24}>
          <Col xs={24} lg={10}>
            <Form.Item
              name="name"
              label={t('settings.territories.formName', 'Territory Name')}
              rules={[{ required: true, message: t('settings.territories.requiredName', 'Please input the name') }]}
            >
              <Input placeholder="East Coast Region" />
            </Form.Item>

            <Form.Item
              name="description"
              label={t('settings.territories.formDesc', 'Description')}
            >
              <Input.TextArea placeholder="Coverage for East Coast states and zip codes" rows={3} />
            </Form.Item>

            <Form.Item
              name="zip_codes"
              label={t('settings.territories.formZips', 'Zip / Postal Codes (Comma-separated)')}
            >
              <Input placeholder="10001, 10002, 10003" />
            </Form.Item>

            <Form.Item
              name="color"
              label={t('settings.territories.formColor', 'Territory Map Color')}
              rules={[{ required: true, message: 'Please select a territory color' }]}
              initialValue="#3B82F6"
            >
              <Select placeholder="Select color" onChange={(val) => setSelectedColor(val)}>
                <Select.Option value="#3B82F6"><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#3B82F6', marginRight: 8, verticalAlign: 'middle' }}></span>Blue</Select.Option>
                <Select.Option value="#EF4444"><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#EF4444', marginRight: 8, verticalAlign: 'middle' }}></span>Red</Select.Option>
                <Select.Option value="#10B981"><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#10B981', marginRight: 8, verticalAlign: 'middle' }}></span>Green</Select.Option>
                <Select.Option value="#F59E0B"><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#F59E0B', marginRight: 8, verticalAlign: 'middle' }}></span>Orange</Select.Option>
                <Select.Option value="#8B5CF6"><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#8B5CF6', marginRight: 8, verticalAlign: 'middle' }}></span>Purple</Select.Option>
                <Select.Option value="#14B8A6"><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#14B8A6', marginRight: 8, verticalAlign: 'middle' }}></span>Teal</Select.Option>
                <Select.Option value="#EC4899"><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#EC4899', marginRight: 8, verticalAlign: 'middle' }}></span>Pink</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="dispatcher_ids"
              label={t('settings.territories.formDispatchers', 'Assign Dispatchers')}
            >
              <Select
                mode="multiple"
                placeholder={t('settings.territories.selectDispatchers', 'Select dispatchers')}
                options={users.map((u) => ({
                  label: `${u.first_name} ${u.last_name}`,
                  value: u.id,
                }))}
                optionFilterProp="label"
                maxTagCount="responsive"
              />
            </Form.Item>

            <Form.Item
              name="technician_ids"
              label={t('settings.territories.formTechnicians', 'Assign Technicians')}
            >
              <Select
                mode="multiple"
                placeholder={t('settings.territories.selectTechnicians', 'Select technicians')}
                options={users.map((u) => ({
                  label: `${u.first_name} ${u.last_name}`,
                  value: u.id,
                }))}
                optionFilterProp="label"
                maxTagCount="responsive"
              />
            </Form.Item>
          </Col>

          <Col xs={24} lg={14}>
            <div style={{ marginBottom: 12 }}>
              <Text strong style={{ display: 'block', marginBottom: 6 }}>
                {t('settings.territories.mapBoundary', 'Define Boundary on Map')}
              </Text>
              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8 }}>
                Click on the map to define the boundary vertices of the territory. Clear or undo to modify coordinates.
              </Text>

              <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
                <Input
                  placeholder="Search city, town, or zip to center map"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  onPressEnter={(e) => {
                    e.preventDefault();
                    handleMapSearch();
                  }}
                />
                <Button onClick={handleMapSearch} loading={searchingMap} icon={<SearchOutlined />}>
                  {t('common.locate', 'Locate')}
                </Button>
              </Space.Compact>

              <div style={{ height: 420, borderRadius: 8, overflow: 'hidden', border: '1px solid #d9d9d9', marginBottom: 8 }}>
                <MapContainer center={mapCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapInvalidator />
                  <MapCenterUpdater center={mapCenter} />
                  <MapEvents onMapClick={handleMapClick} />
                  
                  {boundaryCoords.length < 25 && boundaryCoords.map((coord, idx) => (
                    <Marker
                      key={`${coord[0]}-${coord[1]}-${idx}`}
                      position={coord}
                      icon={L.divIcon({
                        className: '',
                        html: `<div style="background:#fff;border:2px solid ${selectedColor};width:16px;height:16px;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:bold;color:${selectedColor}">${idx + 1}</div>`,
                        iconSize: [16, 16],
                        iconAnchor: [8, 8]
                      })}
                    />
                  ))}

                  {boundaryCoords.length === 2 && (
                    <Polyline positions={boundaryCoords} pathOptions={{ color: selectedColor }} />
                  )}

                  {boundaryCoords.length >= 3 && (
                    <Polygon
                      positions={boundaryCoords}
                      pathOptions={{
                        color: selectedColor,
                        fillColor: selectedColor,
                        fillOpacity: 0.2
                      }}
                    />
                  )}
                </MapContainer>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {boundaryCoords.length === 0
                    ? 'No boundary points added'
                    : `${boundaryCoords.length} boundary points added`}
                </Text>
                <Space>
                  <Button
                    size="small"
                    disabled={boundaryCoords.length === 0}
                    onClick={handleUndoPoint}
                    icon={<UndoOutlined />}
                  >
                    {t('settings.territories.undoPoint', 'Undo Last Point')}
                  </Button>
                  <Button
                    size="small"
                    danger
                    disabled={boundaryCoords.length === 0}
                    onClick={handleClearBoundary}
                    icon={<DeleteOutlined />}
                  >
                    {t('settings.territories.clearBoundary', 'Clear')}
                  </Button>
                </Space>
              </div>
            </div>
          </Col>
        </Row>

        <Form.Item style={{ borderTop: '1px solid #f0f0f0', paddingTop: 20, textAlign: 'right' }}>
          <Space>
            <Button icon={<CloseOutlined />} onClick={() => navigate('/settings/territories')}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={upsertMutation.isPending}
            >
              {t('common.save', 'Save')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}
