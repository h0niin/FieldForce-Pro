import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Space, Skeleton, Divider, Typography, Row, Col } from 'antd';
import { PrinterOutlined, DownloadOutlined, LeftOutlined } from '@ant-design/icons';
import { useAppointment } from '@/hooks/use-appointments';
import { formatDateTime } from '@/utils/format-date';

const { Title, Text } = Typography;

export default function ServiceReportViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: appointment, isLoading } = useAppointment(id!);

  if (isLoading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 10 }} />
      </Card>
    );
  }

  if (!appointment) {
    return (
      <Card>
        <Title level={4}>Report Not Found</Title>
        <p>The service report you are looking for does not exist.</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 0' }}>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Button icon={<LeftOutlined />} onClick={() => navigate(-1)}>
          Back to Appointment
        </Button>
        <Space>
          <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
            Print
          </Button>
          <Button type="primary" icon={<DownloadOutlined />}>
            Download PDF
          </Button>
        </Space>
      </Space>

      <Card
        id="printable-report"
        style={{
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '1px solid #f0f0f0',
          padding: '24px',
        }}
      >
        {/* Header section */}
        <Row justify="space-between" align="top" style={{ marginBottom: 32 }}>
          <Col>
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>SERVICE REPORT</Title>
            <Text type="secondary">Generated on {formatDateTime(new Date().toISOString())}</Text>
          </Col>
          <Col style={{ textAlign: 'right' }}>
            <Title level={4} style={{ margin: 0 }}>{appointment.work_order?.wo_number || `WO-${appointment.id.substring(0, 8)}`}</Title>
            <Text>Status: <strong>{appointment.status.toUpperCase()}</strong></Text>
          </Col>
        </Row>

        <Divider />

        {/* Customer & Location */}
        <Row gutter={32} style={{ marginBottom: 32 }}>
          <Col span={12}>
            <Title level={5} style={{ marginBottom: 8, color: '#595959' }}>CUSTOMER DETAILS</Title>
            <Text strong>{appointment.work_order?.contact?.first_name} {appointment.work_order?.contact?.last_name}</Text><br />
            {appointment.work_order?.contact?.email && <><Text>{appointment.work_order.contact.email}</Text><br /></>}
            {appointment.work_order?.contact?.phone && <Text>{appointment.work_order.contact.phone}</Text>}
          </Col>
          <Col span={12}>
            <Title level={5} style={{ marginBottom: 8, color: '#595959' }}>SERVICE LOCATION</Title>
            <Text>{appointment.work_order?.location?.address || 'Address not provided'}</Text>
          </Col>
        </Row>

        <Divider />

        {/* Job Details */}
        <div style={{ marginBottom: 32 }}>
          <Title level={5} style={{ marginBottom: 16, color: '#595959' }}>JOB DETAILS</Title>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Text type="secondary">Technician</Text><br />
              <Text strong>{appointment.agent ? `${appointment.agent.first_name} ${appointment.agent.last_name}` : 'Unassigned'}</Text>
            </Col>
            <Col span={8}>
              <Text type="secondary">Scheduled Date</Text><br />
              <Text strong>{formatDateTime(appointment.scheduled_start)}</Text>
            </Col>
            <Col span={8}>
              <Text type="secondary">Completed Date</Text><br />
              <Text strong>{appointment.actual_end ? formatDateTime(appointment.actual_end) : 'Pending'}</Text>
            </Col>
            <Col span={24}>
              <Text type="secondary">Description of Work</Text><br />
              <Text>{appointment.work_order?.description || appointment.notes || 'No description provided.'}</Text>
            </Col>
          </Row>
        </div>

        <Divider />

        {/* Findings (Mocked for now since service_reports API is not wired) */}
        <div style={{ marginBottom: 32 }}>
          <Title level={5} style={{ marginBottom: 16, color: '#595959' }}>TECHNICIAN FINDINGS</Title>
          <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '4px' }}>
            <Text>System was inspected. Replaced faulty components and calibrated the sensors. System is now operating within normal parameters.</Text>
          </div>
        </div>

        <Divider />

        {/* Signatures */}
        <Row gutter={32} style={{ marginTop: 48 }}>
          <Col span={12}>
            <div style={{ borderBottom: '1px solid #d9d9d9', height: '60px', marginBottom: '8px' }}>
              {/* Mock Technician Signature */}
              <div style={{ 
                fontFamily: 'cursive', 
                fontSize: '24px', 
                color: '#1890ff',
                paddingTop: '20px',
                paddingLeft: '10px'
              }}>
                {appointment.agent ? `${appointment.agent.first_name} ${appointment.agent.last_name}` : 'Technician'}
              </div>
            </div>
            <Text type="secondary">Technician Signature</Text>
          </Col>
          <Col span={12}>
            <div style={{ borderBottom: '1px solid #d9d9d9', height: '60px', marginBottom: '8px' }}>
              {/* Mock Customer Signature */}
              <div style={{ 
                fontFamily: 'cursive', 
                fontSize: '24px', 
                color: '#000',
                paddingTop: '20px',
                paddingLeft: '10px'
              }}>
                {appointment.work_order?.contact?.first_name || 'Customer'}
              </div>
            </div>
            <Text type="secondary">Customer Signature</Text>
          </Col>
        </Row>
      </Card>
      
      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white; }
          #root { display: none; }
          #printable-report { 
            display: block !important; 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
