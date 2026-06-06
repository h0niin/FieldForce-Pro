import { useState } from 'react';
import { Card, Select, Tag, Avatar, Button, Typography } from 'antd';
import { EnvironmentOutlined, ClockCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

// Mock Data for Crew
const CREW_DATA = [
    {
        id: 1,
        name: 'James Wilson',
        role: 'Field Engineer',
        status: 'Active',
        task: 'Security System Installation',
        location: '123 Broadway, New York, NY',
        time: '12m ago',
        avatar: 'https://i.pravatar.cc/150?u=1',
    },
    {
        id: 2,
        name: 'Anderson Wills',
        role: 'Senior Technician',
        status: 'On Break',
        task: 'Team Coordination & Site Inspection',
        location: '456 Park Ave, New York, NY',
        time: '5m ago',
        avatar: 'https://i.pravatar.cc/150?u=2',
    },
    {
        id: 3,
        name: 'David Kim',
        role: 'Field Supervisor',
        status: 'Idle',
        task: 'Electrical System Maintenance',
        location: '321 W 42nd St, New York, NY',
        time: '32m ago',
        avatar: 'https://i.pravatar.cc/150?u=3',
    },
    {
        id: 4,
        name: 'Tom Harris',
        role: 'Senior Technician',
        status: 'Emergency',
        task: 'HVAC System Repair - Office Building',
        location: '555 Madison Ave, New York, NY',
        time: '12m ago',
        avatar: 'https://i.pravatar.cc/150?u=4',
    },
    {
        id: 5,
        name: 'Adams Jade',
        role: 'Field Engineer',
        status: 'Active',
        task: 'Network Setup',
        location: '789 5th Ave, New York, NY',
        time: '1h ago',
        avatar: 'https://i.pravatar.cc/150?u=5',
    },
];

const STATUS_COLORS: Record<string, string> = {
    Active: '#10b981', // Green
    'On Break': '#f59e0b', // Orange
    Idle: '#fbbf24', // Yellow
    Emergency: '#ef4444', // Red
};

const STATUS_BG_COLORS: Record<string, string> = {
    Active: '#ecfdf5',
    'On Break': '#fffbeb',
    Idle: '#fffbeb',
    Emergency: '#fef2f2',
};

export default function LiveMapDashboard() {
    const { t } = useTranslation();
    const [selectedCrew, setSelectedCrew] = useState<number | null>(null);

    return (
        <div style={{ padding: '0 24px 24px', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Top Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 700 }}>{t('liveMapDashboard.fieldCrewDashboard')}</Title>
                    <Text type="secondary">{t('liveMapDashboard.monitoringDescription')}</Text>
                </div>

                {/* Stats Card */}
                <div style={{
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
                    borderRadius: 12,
                    padding: '16px 24px',
                    color: 'white',
                    display: 'flex',
                    gap: 32,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>{t('liveMapDashboard.totalCrew')}</div>
                        <div style={{ fontSize: 24, fontWeight: 700 }}>8</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>{t('liveMapDashboard.active')}</div>
                        <div style={{ fontSize: 24, fontWeight: 700 }}>4</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>{t('liveMapDashboard.emergency')}</div>
                        <div style={{ fontSize: 24, fontWeight: 700 }}>1</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Tag color="#10b981" style={{ margin: 0, border: 'none', color: '#064e3b', fontWeight: 600 }}>• {t('liveMapDashboard.live')}</Tag>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Select defaultValue="Active" style={{ width: 160 }} options={[{ value: 'Active', label: t('liveMapDashboard.crewStatusActive') }]} bordered={false} className="filter-select" />
                <Select defaultValue="Select" style={{ width: 160 }} options={[{ value: 'Select', label: t('liveMapDashboard.jobStatusSelect') }]} bordered={false} className="filter-select" />
                <Select defaultValue="Select" style={{ width: 150 }} options={[{ value: 'Select', label: t('liveMapDashboard.teamsSelect') }]} bordered={false} className="filter-select" />
                <Select defaultValue="Select" style={{ width: 180 }} options={[{ value: 'Select', label: t('liveMapDashboard.departmentsSelect') }]} bordered={false} className="filter-select" />
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'flex', gap: 24, flex: 1, minHeight: 0 }}>

                {/* Left Column: Crew List */}
                <div style={{ width: 380, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', paddingRight: 8 }}>
                    {CREW_DATA.map((crew) => (
                        <Card
                            key={crew.id}
                            hoverable
                            style={{
                                borderRadius: 12,
                                border: selectedCrew === crew.id ? '2px solid #2563eb' : '1px solid #f0f0f0',
                                transition: 'all 0.2s'
                            }}
                            bodyStyle={{ padding: 16 }}
                            onClick={() => setSelectedCrew(crew.id)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <Avatar src={crew.avatar} size={40} />
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 15, color: '#1f2937' }}>{crew.name}</div>
                                        <div style={{ fontSize: 12, color: '#6b7280' }}>{crew.role}</div>
                                    </div>
                                </div>
                                <Tag
                                    color={STATUS_BG_COLORS[crew.status]}
                                    style={{
                                        color: STATUS_COLORS[crew.status],
                                        border: 'none',
                                        height: 24,
                                        lineHeight: '24px',
                                        borderRadius: 999,
                                        fontWeight: 600,
                                        margin: 0
                                    }}
                                >
                                    {crew.status}
                                </Tag>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, marginTop: 12 }}>
                                <ClockCircleOutlined style={{ color: '#9ca3af', marginTop: 3 }} />
                                <Text style={{ color: '#4b5563', fontSize: 13 }}>{crew.task}</Text>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                <EnvironmentOutlined style={{ color: '#9ca3af', marginTop: 3 }} />
                                <Text style={{ color: '#6b7280', fontSize: 12 }}>{crew.location}</Text>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, alignItems: 'center', gap: 8 }}>
                                <ClockCircleOutlined style={{ fontSize: 12, color: '#9ca3af' }} />
                                <span style={{ fontSize: 12, color: '#9ca3af' }}>{crew.time}</span>
                                <Tag color={selectedCrew === crew.id ? 'blue' : 'default'} style={{ borderRadius: 12, marginLeft: 'auto' }}>
                                    {selectedCrew === crew.id ? t('liveMapDashboard.selected') : t('liveMapDashboard.view')}
                                </Tag>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Right Column: Map Placeholder */}
                <div style={{ flex: 1, background: '#e5e7eb', borderRadius: 16, position: 'relative', overflow: 'hidden' }}>
                    {/* Map Image Placeholder (Simulating the map) */}
                    <div style={{
                        width: '100%',
                        height: '100%',
                        background: 'url(https://api.mapbox.com/styles/v1/mapbox/light-v10/static/-74.006,40.7128,12,0/1000x800?access_token=Pk.mock) center/cover no-repeat',
                        backgroundColor: '#f3f4f6',
                        position: 'relative'
                    }}>
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)',
                            backgroundSize: '40px 40px',
                            opacity: 0.3
                        }} />

                        {/* Mock Pins */}
                        {CREW_DATA.map((crew, index) => (
                            <div
                                key={crew.id}
                                style={{
                                    position: 'absolute',
                                    top: `${20 + (index * 15)}%`,
                                    left: `${30 + (index * 12)}%`,
                                    transform: 'translate(-50%, -50%)',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{
                                    width: 40, height: 40, borderRadius: '50%', border: '3px solid white',
                                    overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                    transform: selectedCrew === crew.id ? 'scale(1.2)' : 'scale(1)',
                                    transition: 'transform 0.2s',
                                    zIndex: selectedCrew === crew.id ? 10 : 1
                                }}>
                                    <img src={crew.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            </div>
                        ))}

                        {/* Map Controls */}
                        <div style={{ position: 'absolute', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <Button icon={<PlusOutlined />} style={{ borderRadius: 8 }} />
                            <Button icon={<EnvironmentOutlined />} style={{ borderRadius: 8 }} />
                        </div>

                        {/* Bottom Overview Panel */}
                        <div style={{
                            position: 'absolute',
                            bottom: 24,
                            left: 24,
                            right: 80,
                            background: 'white',
                            borderRadius: 12,
                            padding: 16,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', gap: 40 }}>
                                <div>
                                    <div style={{ fontSize: 12, color: '#6b7280' }}>{t('liveMapDashboard.name')}</div>
                                    <div style={{ fontWeight: 600 }}>James Wilson</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: '#6b7280' }}>{t('liveMapDashboard.role')}</div>
                                    <div style={{ fontWeight: 600 }}>Field Engineer</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: '#6b7280' }}>{t('liveMapDashboard.team')}</div>
                                    <div style={{ fontWeight: 600 }}>Alpha</div>
                                </div>
                            </div>
                            <Button type="text" icon={<PlusOutlined style={{ transform: 'rotate(45deg)' }} />} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}