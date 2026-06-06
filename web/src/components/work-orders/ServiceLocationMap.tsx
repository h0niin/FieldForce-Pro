import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Button, Space, Typography, Alert, Spin } from 'antd';
import {
  AimOutlined,
  CompassOutlined,
} from '@ant-design/icons';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';

// Fix default marker icon for bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const serviceIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const technicianIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const originIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const { Text } = Typography;

interface Coords {
  lat: number;
  lng: number;
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions, { padding: [40, 40] });
    } else if (positions.length === 1) {
      map.setView(positions[0], 14);
    }
  }, [map, positions]);
  return null;
}

interface Props {
  serviceLat?: number | null;
  serviceLng?: number | null;
  serviceAddress?: string;
  /** Trip start location — shown as green marker with a line to destination */
  originLat?: number | null;
  originLng?: number | null;
  originLabel?: string;
  onLocationDetected?: (coords: Coords) => void;
}

export function ServiceLocationMap({ serviceLat, serviceLng, serviceAddress, originLat, originLng, originLabel, onLocationDetected }: Props) {
  const { t } = useTranslation();
  const [myLocation, setMyLocation] = useState<Coords | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Resolved coords — either from props or from Nominatim geocoding
  const [resolvedLat, setResolvedLat] = useState<number | null>(serviceLat ?? null);
  const [resolvedLng, setResolvedLng] = useState<number | null>(serviceLng ?? null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  // When props change (e.g. data loads), sync resolved coords
  useEffect(() => {
    if (serviceLat != null && serviceLng != null) {
      setResolvedLat(serviceLat);
      setResolvedLng(serviceLng);
    }
  }, [serviceLat, serviceLng]);

  // Auto-geocode from address when no coordinates available
  useEffect(() => {
    if (resolvedLat != null && resolvedLng != null) return; // Already have coords
    if (!serviceAddress) return; // No address to geocode

    setIsGeocoding(true);
    setGeocodeError(null);

    const query = encodeURIComponent(serviceAddress);
    fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
      headers: { 'Accept-Language': 'en' },
    })
      .then((r) => r.json())
      .then((results: { lat: string; lon: string }[]) => {
        if (results && results.length > 0) {
          setResolvedLat(parseFloat(results[0].lat));
          setResolvedLng(parseFloat(results[0].lon));
        } else {
          setGeocodeError(t('serviceLocationMap.geocodeNotFound'));
        }
      })
      .catch(() => setGeocodeError(t('serviceLocationMap.geocodeFailed')))
      .finally(() => setIsGeocoding(false));
  // Only run once when there are no coords
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceAddress]);

  const getMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError(t('serviceLocationMap.geolocationUnsupported'));
      return;
    }
    setIsLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: Coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setMyLocation(coords);
        setIsLocating(false);
        onLocationDetected?.(coords);
      },
      (err) => {
        setGeoError(`${t('serviceLocationMap.locationError')}: ${err.message}`);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // While geocoding, show spinner
  if (isGeocoding) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <Spin tip={t('serviceLocationMap.locatingAddress')} />
      </div>
    );
  }

  // No coords and geocoding failed or no address
  if (resolvedLat == null || resolvedLng == null) {
    const navUrl = serviceAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(serviceAddress)}`
      : null;

    return (
      <div>
        <Alert
          type="info"
          message={
            geocodeError
              ? `${t('serviceLocationMap.geocodeFailedPrefix')} ${geocodeError}`
              : t('serviceLocationMap.noCoordinatesAvailable')
          }
          description={serviceAddress ? <Text>{serviceAddress}</Text> : undefined}
          showIcon
          style={{ marginBottom: 8 }}
        />
        {navUrl && (
          <Button
            icon={<CompassOutlined />}
            type="default"
            href={navUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
          >
            {t('serviceLocationMap.openInGoogleMaps')}
          </Button>
        )}
      </div>
    );
  }

  const servicePos: [number, number] = [resolvedLat, resolvedLng];
  // Treat 0,0 (null island) as no location — means GPS was unavailable when trip started
  const hasOrigin =
    originLat != null && originLng != null &&
    !(Number(originLat) === 0 && Number(originLng) === 0);
  const originPos: [number, number] | null = hasOrigin ? [originLat!, originLng!] : null;

  const allPositions: [number, number][] = [servicePos];
  if (originPos) allPositions.push(originPos);
  if (myLocation) allPositions.push([myLocation.lat, myLocation.lng]);

  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${resolvedLat},${resolvedLng}`;

  return (
    <div>
      <div style={{ height: 300, width: '100%', borderRadius: 8, overflow: 'hidden', border: '1px solid #d9d9d9' }}>
        <MapContainer
          center={originPos ?? servicePos}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds positions={allPositions} />

          {/* Destination — red marker */}
          <Marker position={servicePos} icon={serviceIcon}>
            <Popup>
              <strong>📍 {t('serviceLocationMap.destination')}</strong>
              {serviceAddress && <div style={{ fontSize: 12, marginTop: 4 }}>{serviceAddress}</div>}
            </Popup>
          </Marker>

          {/* Trip start origin — green marker */}
          {originPos && (
            <>
              <Marker position={originPos} icon={originIcon}>
                <Popup>
                  <strong>🟢 {originLabel ?? t('serviceLocationMap.tripStart')}</strong>
                </Popup>
              </Marker>
              {/* Route line: origin → destination */}
              <Polyline
                positions={[originPos, servicePos]}
                color="#fa8c16"
                dashArray="8 4"
                weight={3}
              />
            </>
          )}

          {/* Current location — blue marker (from Get My Location button) */}
          {myLocation && (
            <>
              <Marker position={[myLocation.lat, myLocation.lng]} icon={technicianIcon}>
                <Popup>📱 {t('serviceLocationMap.yourCurrentLocation')}</Popup>
              </Marker>
              <Polyline
                positions={[[myLocation.lat, myLocation.lng], servicePos]}
                color="#1677ff"
                dashArray="6"
                weight={2}
              />
            </>
          )}
        </MapContainer>
      </div>

      {geoError && (
        <Alert type="warning" message={geoError} showIcon style={{ marginTop: 8 }} closable />
      )}

      <Space style={{ marginTop: 8 }}>
        <Button
          icon={<AimOutlined />}
          onClick={getMyLocation}
          loading={isLocating}
          size="small"
        >
          {t('serviceLocationMap.getMyLocation')}
        </Button>
        <Button
          icon={<CompassOutlined />}
          type="link"
          href={navUrl}
          target="_blank"
          rel="noopener noreferrer"
          size="small"
        >
          {t('serviceLocationMap.openNavigation')}
        </Button>
      </Space>

      {myLocation && (
        <div style={{ marginTop: 4 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('serviceLocationMap.yourLocation')}: {myLocation.lat.toFixed(5)}, {myLocation.lng.toFixed(5)}
          </Text>
        </div>
      )}
    </div>
  );
}