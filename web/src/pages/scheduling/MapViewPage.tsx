import { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import {
  Card, Col, Row, List, Tag, Input, Button, Radio,
  Empty, Space, Typography, Spin, Badge, Avatar,
} from 'antd';
import {
  UserOutlined, EnvironmentOutlined, SearchOutlined,
  AimOutlined, ClockCircleOutlined, ThunderboltOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { useAgents } from '@/hooks/use-users';
import { useAllAppointments } from '@/hooks/use-appointments';
import { useAgentLatestLocation } from '@/hooks/use-agent-locations';
import PageHeader from '@/components/common/PageHeader';
import type { User, ServiceAppointment } from '@/types/models.types';
import { formatDateTime } from '@/utils/format-date';

const { Text } = Typography;

// ─── Haversine straight-line distance ────────────────────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Free Nominatim geocoder (no API key) ────────────────────────────────────
async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number; displayName: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'FieldForcePro/1.0' } },
    );
    const data = await res.json();
    if (data?.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name as string,
      };
    }
  } catch { /* silent */ }
  return null;
}

// ─── Map markers (DivIcon — no broken image issue with Vite) ─────────────────
const STATUS_COLORS: Record<string, string> = {
  scheduled: '#1677ff',
  in_progress: '#722ed1',
  completed: '#52c41a',
  cancelled: '#ff4d4f',
};

const STATUS_TAG: Record<string, string> = {
  scheduled: 'blue',
  in_progress: 'processing',
  completed: 'green',
  cancelled: 'red',
};

function apptMarker(status: string, idx: number) {
  const c = STATUS_COLORS[status] || '#666';
  return L.divIcon({
    html: `<div style="background:${c};width:30px;height:30px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);
      display:flex;align-items:center;justify-content:center;">
      <span style="transform:rotate(45deg);color:#fff;font-size:11px;font-weight:700">${idx}</span>
    </div>`,
    className: '', iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -32],
  });
}

const AGENT_ICON = L.divIcon({
  html: `<div style="background:#2563eb;width:38px;height:38px;border-radius:50%;
    border:3px solid #fff;box-shadow:0 2px 10px rgba(37,99,235,.5);
    display:flex;align-items:center;justify-content:center;font-size:18px;">👤</div>`,
  className: '', iconSize: [38, 38], iconAnchor: [19, 19], popupAnchor: [0, -22],
});

const FROM_ICON = L.divIcon({
  html: `<div style="background:#f97316;width:38px;height:38px;border-radius:8px;
    border:3px solid #fff;box-shadow:0 2px 10px rgba(249,115,22,.5);
    display:flex;align-items:center;justify-content:center;font-size:18px;">🏢</div>`,
  className: '', iconSize: [38, 38], iconAnchor: [19, 19], popupAnchor: [0, -22],
});

// ─── Fly map to a center only when coordinates actually change ───────────────���
function FlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  const prev = useRef<[number, number] | null>(null);
  useEffect(() => {
    if (prev.current?.[0] === center[0] && prev.current?.[1] === center[1]) return;
    prev.current = center;
    map.flyTo(center, 13, { duration: 1.2 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1]]);
  return null;
}

// ─── isOnline: GPS ping within last 2 hours ────────────────────────────────────
function isOnline(recordedAt?: string): boolean {
  if (!recordedAt) return false;
  return Date.now() - new Date(recordedAt).getTime() < 2 * 60 * 60 * 1000;
}

// ─── Agent panel row ──────────────────────────────────────────────────────────
function AgentRow({
  agent, activeCount, liveLocation, selected, onClick,
}: {
  agent: User; activeCount: number; liveLocation?: boolean; selected: boolean; onClick: () => void;
}) {
  const { t } = useTranslation();
  const initials = `${agent.first_name?.[0] ?? ''}${agent.last_name?.[0] ?? ''}`.toUpperCase();
  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px 12px', cursor: 'pointer', borderRadius: 8, marginBottom: 6,
        background: selected ? '#eff6ff' : 'transparent',
        border: selected ? '1.5px solid #2563eb' : '1.5px solid transparent',
        transition: 'all .15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Badge dot color={liveLocation ? '#52c41a' : '#d9d9d9'} offset={[-4, 4]}>
          <Avatar style={{ background: selected ? '#2563eb' : '#6b7280', fontSize: 13 }}>
            {initials}
          </Avatar>
        </Badge>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {agent.first_name} {agent.last_name}
          </div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>
            {selected
              ? liveLocation
                ? <Text style={{ color: '#52c41a', fontSize: 11 }}>● {t('mapView.liveGps')}</Text>
                : <Text type="secondary" style={{ fontSize: 11 }}>● {t('mapView.noGps')}</Text>
              : <Text type="secondary" style={{ fontSize: 11 }}>● —</Text>
            }
            {' · '}
            <Text type="secondary" style={{ fontSize: 11 }}>{t('mapView.activeCount', { count: activeCount })}</Text>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MapViewPage() {
  const { t } = useTranslation();
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [fromType, setFromType] = useState<'agent' | 'custom'>('agent');
  const [customAddress, setCustomAddress] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [customLatLng, setCustomLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [geocodeError, setGeocodeError] = useState('');
  const [matchedAddress, setMatchedAddress] = useState('');
  const [mapFlyTo, setMapFlyTo] = useState<[number, number] | null>(null);

  const { data: agents = [] } = useAgents();
  const { data: allAppointments = [], isLoading: apptLoading, refetch } = useAllAppointments();
  const { data: agentLocation, isLoading: locationLoading } = useAgentLatestLocation(selectedAgentId);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);
  const agentAppointments: ServiceAppointment[] = allAppointments.filter((a) => a.agent_id === selectedAgentId);
  const mappableAppointments = agentAppointments.filter((a) => a.work_order?.location?.lat && a.work_order?.location?.lng);
  
  const fromLatLng: { lat: number; lng: number } | null =
    fromType === 'agent'
      ? agentLocation?.lat && agentLocation?.lng
        ? { lat: agentLocation.lat, lng: agentLocation.lng }
        : null
      : customLatLng;

  const firstAppt = mappableAppointments[0];
  const defaultCenter: [number, number] = firstAppt
    ? [firstAppt.work_order!.location!.lat!, firstAppt.work_order!.location!.lng!]
    : fromLatLng
    ? [fromLatLng.lat, fromLatLng.lng]
    : [20, 0];

  const activeCountMap: Record<string, number> = {};
  agents.forEach((a) => {
    activeCountMap[a.id] = allAppointments.filter(
      (ap) => ap.agent_id === a.id && ap.status !== 'completed' && ap.status !== 'cancelled',
    ).length;
  });

  const handleGeocode = async () => {
    if (!customAddress.trim()) return;
    setGeocoding(true);
    setGeocodeError('');
    setMatchedAddress('');
    const result = await geocodeAddress(customAddress.trim());
    setGeocoding(false);
    if (result) {
      setCustomLatLng({ lat: result.lat, lng: result.lng });
      setMatchedAddress(result.displayName);
      setMapFlyTo([result.lat, result.lng]);
    } else {
      setGeocodeError(t('mapView.addressNotFound'));
    }
  };

  return (
    <div>
      <PageHeader
        title={t('mapView.title')}
        subtitle={t('mapView.subtitle')}
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={apptLoading}>
            {t('mapView.refresh')}
          </Button>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {[
          { title: t('mapView.stats.totalAgents'), value: agents.length, icon: <UserOutlined style={{ fontSize: 20, color: '#2563eb' }} />, iconBg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', cardBg: 'linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 100%)', accent: '#2563eb', border: '#bfdbfe' },
          { title: t('mapView.stats.activeJobs'), value: allAppointments.filter((a) => a.status !== 'completed' && a.status !== 'cancelled').length, icon: <ClockCircleOutlined style={{ fontSize: 20, color: '#059669' }} />, iconBg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', cardBg: 'linear-gradient(135deg, #f0fdf4 0%, #e8faf2 100%)', accent: '#059669', border: '#a7f3d0' },
          { title: t('mapView.stats.inProgress'), value: allAppointments.filter((a) => a.status === 'in_progress').length, icon: <ThunderboltOutlined style={{ fontSize: 20, color: '#7c3aed' }} />, iconBg: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)', cardBg: 'linear-gradient(135deg, #faf5ff 0%, #f3effe 100%)', accent: '#7c3aed', border: '#ddd6fe' },
          { title: t('mapView.stats.completed'), value: allAppointments.filter((a) => a.status === 'completed').length, icon: <EnvironmentOutlined style={{ fontSize: 20, color: '#16a34a' }} />, iconBg: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', cardBg: 'linear-gradient(135deg, #f0fdf4 0%, #e8faf2 100%)', accent: '#16a34a', border: '#bbf7d0' },
        ].map((stat) => (
          <Col xs={12} sm={6} key={stat.title}>
            <div style={{ background: stat.cardBg, border: `1px solid ${stat.border}`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'box-shadow 0.2s' }}>
              <div style={{ background: stat.iconBg, borderRadius: 10, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${stat.border}` }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, marginBottom: 2 }}>{stat.title}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: stat.accent, lineHeight: 1 }}>{stat.value}</div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      <Row gutter={12}>
        <Col xs={24} lg={5}>
          <Card
            title={<><UserOutlined style={{ marginRight: 6 }} />{t('mapView.technicians')}</>}
            size="small"
            style={{ height: 620, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}
          >
            {agents.length === 0 ? (
              <Empty description={t('mapView.noAgents')} image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 40 }} />
            ) : (
              agents.map((agent) => (
                <AgentRow
                  key={agent.id}
                  agent={agent}
                  activeCount={activeCountMap[agent.id] ?? 0}
                  liveLocation={agent.id === selectedAgentId ? isOnline(agentLocation?.recorded_at) : undefined}
                  selected={agent.id === selectedAgentId}
                  onClick={() => {
                    setSelectedAgentId(agent.id);
                    setFromType('agent');
                    setCustomLatLng(null);
                    setCustomAddress('');
                    setGeocodeError('');
                    setMatchedAddress('');
                    setMapFlyTo(null);
                  }}
                />
              ))
            )}
          </Card>
        </Col>

        <Col xs={24} lg={13}>
          <Card size="small" style={{ marginBottom: 8 }}>
            <Space wrap>
              <Text strong style={{ fontSize: 12 }}>{t('mapView.calcDistanceFrom')}</Text>
              <Radio.Group
                size="small"
                value={fromType}
                onChange={(e) => {
                  setFromType(e.target.value);
                  setGeocodeError('');
                  setMatchedAddress('');
                  if (e.target.value === 'agent') setMapFlyTo(null);
                }}
              >
                <Radio.Button value="agent"><AimOutlined /> {t('mapView.agentLocation')}</Radio.Button>
                <Radio.Button value="custom"><EnvironmentOutlined /> {t('mapView.officeLocation')}</Radio.Button>
              </Radio.Group>

              {fromType === 'custom' && (
                <Space.Compact style={{ width: 320 }}>
                  <Input
                    size="small"
                    placeholder={t('mapView.addressPlaceholder')}
                    value={customAddress}
                    onChange={(e) => { setCustomAddress(e.target.value); setGeocodeError(''); setMatchedAddress(''); setCustomLatLng(null); }}
                    onPressEnter={handleGeocode}
                  />
                  <Button size="small" icon={<SearchOutlined />} loading={geocoding} onClick={handleGeocode}>
                    {t('mapView.locate')}
                  </Button>
                </Space.Compact>
              )}

              {geocodeError && <Text type="danger" style={{ fontSize: 11 }}>{geocodeError}</Text>}
              {fromType === 'custom' && customLatLng && matchedAddress && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '4px 10px', maxWidth: 400 }}>
                  <span style={{ color: '#16a34a', fontSize: 13, marginTop: 1 }}>✓</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#15803d' }}>{t('mapView.matchedLocation')}</div>
                    <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.4 }}>{matchedAddress}</div>
                    <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{t('mapView.addressCorrection')}</div>
                  </div>
                </div>
              )}
              {fromType === 'agent' && selectedAgentId && !locationLoading && !agentLocation && (
                <Text type="secondary" style={{ fontSize: 11 }}>⚠ {t('mapView.noGpsData')}</Text>
              )}
            </Space>
          </Card>

          <div style={{ height: 560, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            {!selectedAgentId ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', gap: 12 }}>
                <EnvironmentOutlined style={{ fontSize: 48, color: '#d1d5db' }} />
                <Text type="secondary">{t('mapView.selectTechnicianPrompt')}</Text>
              </div>
            ) : (
              <MapContainer key={selectedAgentId} center={defaultCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
                {mapFlyTo ? <FlyTo center={mapFlyTo} /> : defaultCenter[0] !== 20 && <FlyTo center={defaultCenter} />}
                {agentLocation?.lat && agentLocation?.lng && (
                  <Marker position={[agentLocation.lat, agentLocation.lng]} icon={AGENT_ICON}>
                    <Popup>
                      <strong>📍 {selectedAgent?.first_name} {selectedAgent?.last_name}</strong>
                      <br />
                      <span style={{ fontSize: 11, color: '#666' }}>{t('mapView.lastSeen')}: {formatDateTime(agentLocation.recorded_at)}</span>
                    </Popup>
                  </Marker>
                )}
                {fromType === 'custom' && customLatLng && (
                  <Marker position={[customLatLng.lat, customLatLng.lng]} icon={FROM_ICON}>
                    <Popup>
                      <strong>🏢 {t('mapView.baseLocation')}</strong><br />
                      <span style={{ fontSize: 11 }}>{customAddress}</span>
                    </Popup>
                  </Marker>
                )}
                {mappableAppointments.map((appt, idx) => {
                  const lat = appt.work_order!.location!.lat!;
                  const lng = appt.work_order!.location!.lng!;
                  const dist = fromLatLng ? haversineKm(fromLatLng.lat, fromLatLng.lng, lat, lng) : null;
                  return (
                    <>
                      <Marker key={appt.id} position={[lat, lng]} icon={apptMarker(appt.status, idx + 1)}>
                        <Popup>
                          <div style={{ minWidth: 180 }}>
                            <div style={{ fontWeight: 700, marginBottom: 4 }}>#{idx + 1} — {appt.work_order?.wo_number || t('mapView.woLabel')}</div>
                            <div style={{ fontSize: 12, marginBottom: 4 }}>📍 {appt.work_order?.location?.address || t('mapView.noAddress')}</div>
                            <div style={{ fontSize: 12, marginBottom: 4 }}>
                              {t('mapView.status')}: <Tag color={STATUS_TAG[appt.status]}>{appt.status.replace(/_/g, ' ').toUpperCase()}</Tag>
                            </div>
                            <div style={{ fontSize: 11, color: '#666' }}>{formatDateTime(appt.scheduled_start)}</div>
                            {dist !== null && (
                              <div style={{ fontSize: 12, marginTop: 6, color: '#2563eb', fontWeight: 600 }}>
                                📏 {dist.toFixed(1)} km {t('mapView.fromBase')}
                              </div>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                      {fromLatLng && (
                        <Polyline key={`line-${appt.id}`} positions={[[fromLatLng.lat, fromLatLng.lng], [lat, lng]]} pathOptions={{ color: STATUS_COLORS[appt.status] || '#666', weight: 1.5, dashArray: '6 4', opacity: 0.7 }} />
                      )}
                    </>
                  );
                })}
              </MapContainer>
            )}
          </div>
        </Col>

        <Col xs={24} lg={6}>
          <Card
            title={
              <Space>
                <EnvironmentOutlined />
                <span>{selectedAgent ? t('mapView.agentJobs', { name: selectedAgent.first_name }) : t('mapView.jobs')}</span>
                {agentAppointments.length > 0 && <Tag color="blue">{agentAppointments.length}</Tag>}
              </Space>
            }
            size="small"
            style={{ height: 620, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, overflowY: 'auto', padding: 8 }}
          >
            {!selectedAgentId ? (
              <Empty description={t('mapView.selectTechnicianPrompt')} image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 60 }} />
            ) : apptLoading ? (
              <div style={{ textAlign: 'center', marginTop: 60 }}><Spin /></div>
            ) : agentAppointments.length === 0 ? (
              <Empty description={t('mapView.noScheduledJobs')} image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 60 }} />
            ) : (
              <List
                size="small"
                dataSource={agentAppointments}
                renderItem={(appt, idx) => {
                  const hasCoords = !!(appt.work_order?.location?.lat && appt.work_order?.location?.lng);
                  const dist = fromLatLng && hasCoords ? haversineKm(fromLatLng.lat, fromLatLng.lng, appt.work_order!.location!.lat!, appt.work_order!.location!.lng!) : null;
                  const isDone = appt.status === 'completed' || appt.status === 'cancelled';
                  return (
                    <div style={{ padding: '10px 8px', borderRadius: 6, marginBottom: 6, background: isDone ? '#fafafa' : '#f0f7ff', border: `1px solid ${isDone ? '#f0f0f0' : '#bfdbfe'}`, opacity: isDone ? 0.7 : 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Space size={4}>
                          <Tag style={{ margin: 0, fontSize: 11 }}>#{idx + 1}</Tag>
                          <Text strong style={{ fontSize: 13 }}>{appt.work_order?.wo_number || 'N/A'}</Text>
                        </Space>
                        <Tag color={STATUS_TAG[appt.status]} style={{ margin: 0, fontSize: 10 }}>{appt.status.replace(/_/g, ' ').toUpperCase()}</Tag>
                      </div>
                      <div style={{ fontSize: 12, color: '#374151', marginBottom: 3 }}>
                        <EnvironmentOutlined style={{ marginRight: 4, color: '#6b7280' }} />
                        {appt.work_order?.location?.address || <Text type="secondary" style={{ fontSize: 11 }}>{t('mapView.noAddress')}</Text>}
                      </div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {formatDateTime(appt.scheduled_start)}
                      </div>
                      {dist !== null ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#eff6ff', borderRadius: 4, padding: '2px 8px', fontSize: 12, color: '#2563eb', fontWeight: 600 }}>
                          📏 {dist.toFixed(1)} km <Text type="secondary" style={{ fontSize: 10, fontWeight: 400 }}>({t('mapView.straightLine')})</Text>
                        </div>
                      ) : !hasCoords ? (
                        <Text type="secondary" style={{ fontSize: 11 }}>📍 {t('mapView.noCoordinates')}</Text>
                      ) : (
                        <Text type="secondary" style={{ fontSize: 11 }}>{fromType === 'agent' ? t('mapView.noGpsFromAgent') : t('mapView.enterBaseLocation')}</Text>
                      )}
                    </div>
                  );
                }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}