import React, { useMemo } from 'react';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useTranslation } from 'react-i18next';
import { Card, Space, Typography, Tag, Row, Col, Statistic, Alert } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  TeamOutlined,
  CalendarOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { DemandForecastResponse } from '../../api/scheduling.api';

const { Title, Text } = Typography;

interface DemandForecastChartProps {
  forecast: DemandForecastResponse;
  height?: number;
}

export const DemandForecastChart: React.FC<DemandForecastChartProps> = ({
  forecast,
  height = 400,
}) => {
  const { t } = useTranslation();
  const chartOptions = useMemo(() => {
    const dates = forecast.forecast.map((f) => new Date(f.date).toLocaleDateString());
    const predicted = forecast.forecast.map((f) => f.predicted_demand);
    const lowerBound = forecast.forecast.map((f) => f.lower_bound);
    const upperBound = forecast.forecast.map((f) => f.upper_bound);

    return {
      title: {
        text: t('demandForecast.chartTitle'),
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
        formatter: (params: any) => {
          const date = params[0].axisValue;
          let tooltip = `<strong>${date}</strong><br/>`;

          params.forEach((param: any) => {
            tooltip += `${param.marker} ${param.seriesName}: ${param.value}<br/>`;
          });

          return tooltip;
        },
      },
      legend: {
        data: [t('demandForecast.predictedDemand'), t('demandForecast.upperBound'), t('demandForecast.lowerBound')],
        top: 30,
      },
      toolbox: {
        feature: {
          dataZoom: {
            yAxisIndex: 'none',
          },
          restore: {},
          saveAsImage: {},
        },
        right: 20,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLabel: {
          rotate: 45,
        },
      },
      yAxis: {
        type: 'value',
        name: t('demandForecast.numberOfJobs'),
        axisLabel: {
          formatter: '{value}',
        },
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
        },
        {
          start: 0,
          end: 100,
        },
      ],
      series: [
        {
          name: t('demandForecast.predictedDemand'),
          type: 'line',
          data: predicted,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            width: 3,
            color: '#1890ff',
          },
          itemStyle: {
            color: '#1890ff',
          },
          emphasis: {
            focus: 'series',
          },
          markPoint: {
            data: [
              { type: 'max', name: t('demandForecast.peak') },
              { type: 'min', name: t('demandForecast.low') },
            ],
          },
          markLine: {
            data: [
              { type: 'average', name: t('demandForecast.average') },
            ],
          },
        },
        {
          name: t('demandForecast.upperBound'),
          type: 'line',
          data: upperBound,
          smooth: true,
          lineStyle: {
            opacity: 0.5,
            type: 'dashed',
            color: '#ff7875',
          },
          itemStyle: {
            opacity: 0,
          },
          areaStyle: {
            opacity: 0,
          },
        },
        {
          name: t('demandForecast.lowerBound'),
          type: 'line',
          data: lowerBound,
          smooth: true,
          lineStyle: {
            opacity: 0.5,
            type: 'dashed',
            color: '#95de64',
          },
          itemStyle: {
            opacity: 0,
          },
          areaStyle: {
            opacity: 0.1,
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: 'rgba(149, 222, 100, 0.2)',
              },
              {
                offset: 1,
                color: 'rgba(149, 222, 100, 0.05)',
              },
            ]),
          },
          stack: 'confidence',
        },
      ],
    };
  }, [forecast, t]);

  const getTrendIcon = () => {
    switch (forecast.trend) {
      case 'increasing':
        return <ArrowUpOutlined style={{ color: '#52c41a' }} />;
      case 'decreasing':
        return <ArrowDownOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <span style={{ color: '#1890ff' }}>→</span>;
    }
  };

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title={t('demandForecast.trend')}
              value={forecast.trend}
              prefix={getTrendIcon()}
              valueStyle={{ textTransform: 'capitalize' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={t('demandForecast.avgDailyCapacity')}
              value={forecast.capacity_recommendations.average_daily_capacity}
              suffix={t('demandForecast.jobs')}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={t('demandForecast.peakCapacity')}
              value={forecast.capacity_recommendations.peak_capacity}
              suffix={t('demandForecast.jobs')}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={t('demandForecast.minTechnicians')}
              value={forecast.capacity_recommendations.minimum_technicians}
              prefix={<TeamOutlined />}
            />
          </Col>
        </Row>

        {forecast.capacity_recommendations.peak_days && forecast.capacity_recommendations.peak_days.length > 0 && (
          <Alert
            message={t('demandForecast.peakDemandDays')}
            description={
              <Space direction="vertical">
                <Text>{t('demandForecast.highDemandExpected')}</Text>
                <Space wrap>
                  {forecast.capacity_recommendations.peak_days.map((day) => (
                    <Tag key={day} icon={<CalendarOutlined />} color="orange">
                      {new Date(day).toLocaleDateString()}
                    </Tag>
                  ))}
                </Space>
                <Text type="secondary">
                  {t('demandForecast.considerScheduling')}
                </Text>
              </Space>
            }
            type="warning"
            showIcon
            icon={<WarningOutlined />}
          />
        )}

        <ReactECharts option={chartOptions} style={{ height }} />

        {forecast.seasonality && Object.keys(forecast.seasonality).length > 0 && (
          <Card size="small" style={{ backgroundColor: 'var(--bg-color)' }}>
            <Title level={5}>{t('demandForecast.seasonalityPatterns')}</Title>
            <Space wrap>
              {forecast.seasonality.weekly && (
                <Tag color="blue">
                  {t('demandForecast.weeklyPattern')}: {forecast.seasonality.weekly.strength}
                </Tag>
              )}
              {forecast.seasonality.yearly && (
                <Tag color="green">
                  {t('demandForecast.yearlyPattern')}: {t('demandForecast.peakIn', { months: forecast.seasonality.yearly.peak_months?.join(', ') })}
                </Tag>
              )}
            </Space>
          </Card>
        )}

        <Card size="small" style={{ backgroundColor: 'rgba(22, 119, 255, 0.08)' }}>
          <Title level={5}>{t('demandForecast.aiRecommendations')}</Title>
          <Space direction="vertical">
            <Text>
              <TeamOutlined /> {t('demandForecast.maintainMinimum')} <strong>{forecast.capacity_recommendations.minimum_technicians}</strong> {t('demandForecast.techniciansHandleAvg')}
            </Text>
            <Text>
              <CalendarOutlined /> {t('demandForecast.add')} <strong>{forecast.capacity_recommendations.buffer_percentage}%</strong> {t('demandForecast.bufferForSpikes')}
            </Text>
            {forecast.trend === 'increasing' && (
              <Text>
                <ArrowUpOutlined style={{ color: '#52c41a' }} /> {t('demandForecast.trendUpward')}
              </Text>
            )}
            {forecast.trend === 'decreasing' && (
              <Text>
                <ArrowDownOutlined style={{ color: '#ff4d4f' }} /> {t('demandForecast.trendDownward')}
              </Text>
            )}
          </Space>
        </Card>

        <Text type="secondary" style={{ fontSize: 12 }}>
          {t('demandForecast.footerMetadata', {
            model: forecast.metrics?.model_type || 'AI',
            confidence: forecast.metrics?.confidence_level ? `${(forecast.metrics.confidence_level * 100).toFixed(0)}%` : '95%',
            days: forecast.metrics?.historical_days || 'N/A'
          })}
        </Text>
      </Space>
    </Card>
  );
};