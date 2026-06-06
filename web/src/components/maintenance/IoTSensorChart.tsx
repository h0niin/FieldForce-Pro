import { Card, Empty, Select, Space, Typography } from 'antd';
import { LineChartOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface SensorReading {
  sensor_type: string;
  value: number;
  recorded_at: string;
  unit?: string;
}

interface IoTSensorChartProps {
  readings?: SensorReading[];
  loading?: boolean;
  title?: string;
}

const DEMO_READINGS: SensorReading[] = Array.from({ length: 24 }, (_, i) => ({
  sensor_type: 'temperature',
  value: 65 + Math.random() * 20 + (i > 18 ? 15 : 0),
  recorded_at: new Date(Date.now() - (24 - i) * 3600000).toISOString(),
  unit: '°C',
})).concat(
  Array.from({ length: 24 }, (_, i) => ({
    sensor_type: 'vibration',
    value: 1.5 + Math.random() * 2 + (i > 20 ? 3 : 0),
    recorded_at: new Date(Date.now() - (24 - i) * 3600000).toISOString(),
    unit: 'mm/s',
  }))
);

export default function IoTSensorChart({
  readings = DEMO_READINGS,
  loading = false,
  title = 'IoT Sensor Data',
}: IoTSensorChartProps) {
  const { t } = useTranslation();
  const sensorTypes = [...new Set(readings.map((r) => r.sensor_type))];
  const [selectedSensor, setSelectedSensor] = useState<string>(sensorTypes[0] || '');

  const filteredReadings = readings
    .filter((r) => r.sensor_type === selectedSensor)
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());

  if (!readings.length && !loading) {
    return (
      <Card title={<><LineChartOutlined /> {title}</>}>
        <Empty description={t('iotSensorChart.noDataAvailable')} />
      </Card>
    );
  }

  const maxVal = Math.max(...filteredReadings.map((r) => r.value));
  const minVal = Math.min(...filteredReadings.map((r) => r.value));
  const range = maxVal - minVal || 1;
  const unit = filteredReadings[0]?.unit || '';

  return (
    <Card
      title={
        <Space>
          <LineChartOutlined />
          <span>{title}</span>
        </Space>
      }
      extra={
        <Select
          value={selectedSensor}
          onChange={setSelectedSensor}
          style={{ width: 150 }}
          options={sensorTypes.map((t) => ({ label: t, value: t }))}
        />
      }
      loading={loading}
    >
      <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 2, padding: '0 8px' }}>
        {filteredReadings.slice(-48).map((r, i) => {
          const height = ((r.value - minVal) / range) * 160 + 20;
          const isAnomaly = r.value > minVal + range * 0.8;
          return (
            <div
              key={i}
              title={t('iotSensorChart.tooltip', { value: r.value.toFixed(1), unit, time: new Date(r.recorded_at).toLocaleTimeString() })}
              style={{
                flex: 1,
                height,
                backgroundColor: isAnomaly ? '#ff4d4f' : '#1890ff',
                borderRadius: '2px 2px 0 0',
                minWidth: 4,
                transition: 'height 0.3s',
              }}
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <Text type="secondary">{t('iotSensorChart.min')}: {minVal.toFixed(1)}{unit}</Text>
        <Text type="secondary">{t('iotSensorChart.max')}: {maxVal.toFixed(1)}{unit}</Text>
        <Text type="secondary">{t('iotSensorChart.readings')}: {filteredReadings.length}</Text>
      </div>
    </Card>
  );
}