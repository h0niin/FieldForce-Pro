import { useState, useRef, useCallback, useEffect } from 'react';
import { AutoComplete } from 'antd';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';

// Safe to call multiple times — idempotent
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface SuggestionOption {
  value: string;
  label: string;
  lat: number;
  lng: number;
}

export interface AddressPickerFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

async function nominatimSearch(query: string): Promise<NominatimResult[]> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=0`,
      { headers: { 'Accept-Language': 'en' } },
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default function AddressPickerField({
  value = '',
  onChange,
  disabled = false,
  placeholder = 'Search address...',
}: AddressPickerFieldProps) {
  const [suggestions, setSuggestions] = useState<SuggestionOption[]>([]);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear map preview when value is cleared externally (e.g. billing address unchecked)
  useEffect(() => {
    if (!value) {
      setMapCoords(null);
      setSuggestions([]);
    }
  }, [value]);

  const handleSearch = useCallback(
    (query: string) => {
      onChange?.(query);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        const results = await nominatimSearch(query);
        setSuggestions(
          results.map((r) => ({
            value: r.display_name,
            label: r.display_name,
            lat: parseFloat(r.lat),
            lng: parseFloat(r.lon),
          })),
        );
      }, 400);
    },
    [onChange],
  );

  const handleSelect = (_val: string, option: SuggestionOption) => {
    onChange?.(option.value);
    setMapCoords({ lat: option.lat, lng: option.lng });
    setSuggestions([]);
  };

  const handleClear = () => {
    onChange?.('');
    setMapCoords(null);
    setSuggestions([]);
  };

  return (
    <div>
      <AutoComplete
        value={value}
        options={suggestions}
        onSearch={handleSearch}
        onSelect={handleSelect as (val: string, option: unknown) => void}
        onClear={handleClear}
        filterOption={false}
        placeholder={placeholder}
        style={{ width: '100%' }}
        disabled={disabled}
        allowClear
      />
      {mapCoords && !disabled && (
        <div
          style={{
            height: 180,
            borderRadius: 6,
            overflow: 'hidden',
            border: '1px solid #e8e8e8',
            marginTop: 8,
          }}
        >
          <MapContainer
            key={`addr-${mapCoords.lat.toFixed(5)}-${mapCoords.lng.toFixed(5)}`}
            center={[mapCoords.lat, mapCoords.lng]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            scrollWheelZoom={false}
            dragging={false}
            doubleClickZoom={false}
            attributionControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[mapCoords.lat, mapCoords.lng]} />
          </MapContainer>
        </div>
      )}
    </div>
  );
}
