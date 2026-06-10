import { useState } from 'react';
import { Modal, Upload, Button, Select, Space, Typography, message, Row, Col, Card } from 'antd';
import { UploadOutlined, DownloadOutlined, ImportOutlined, UserSwitchOutlined, MergeCellsOutlined } from '@ant-design/icons';
import { useImportCompanies, useChangeCompanyOwner, useMergeCompanies } from '@/hooks/use-companies';
import { useUsers } from '@/hooks/use-users';
import type { Company } from '@/types/models.types';

const { Text, Title } = Typography;
const { Option } = Select;

export function CompanyImportModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const importCompanies = useImportCompanies();

  const handleImport = async () => {
    if (!file) {
      message.error('Please select a CSV file first');
      return;
    }
    await importCompanies.mutateAsync(file);
    setFile(null);
    onClose();
  };

  return (
    <Modal title="Import Companies" open={open} onCancel={onClose} onOk={handleImport} confirmLoading={importCompanies.isPending}>
      <div style={{ padding: '20px 0' }}>
        <Text>Please upload a CSV file containing company records. The file should include headers such as <b>Company Name</b>, <b>Industry</b>, and <b>Website</b>.</Text>
        <div style={{ marginTop: 20 }}>
          <Upload 
            accept=".csv" 
            beforeUpload={(f) => { setFile(f); return false; }}
            maxCount={1}
            onRemove={() => setFile(null)}
          >
            <Button icon={<DownloadOutlined />}>Select CSV File</Button>
          </Upload>
        </div>
      </div>
    </Modal>
  );
}

export function CompanyChangeOwnerModal({ open, onClose, selectedIds }: { open: boolean, onClose: () => void, selectedIds: string[] }) {
  const [newOwnerId, setNewOwnerId] = useState<string>('');
  const { data: usersResponse, isLoading } = useUsers();
  const changeOwner = useChangeCompanyOwner();
  const users = usersResponse?.data || [];

  const handleChangeOwner = async () => {
    if (!newOwnerId) {
      message.error('Please select a new owner');
      return;
    }
    await changeOwner.mutateAsync({ recordIds: selectedIds, newOwnerId });
    setNewOwnerId('');
    onClose();
  };

  return (
    <Modal title="Change Owner" open={open} onCancel={onClose} onOk={handleChangeOwner} confirmLoading={changeOwner.isPending}>
      <div style={{ padding: '20px 0' }}>
        <Text>Select a new owner for the {selectedIds.length} selected company(ies).</Text>
        <div style={{ marginTop: 20 }}>
          <Select 
            style={{ width: '100%' }} 
            placeholder="Select a user" 
            loading={isLoading}
            value={newOwnerId || undefined}
            onChange={setNewOwnerId}
          >
            {users.map(user => (
              <Option key={user.id} value={user.id}>{user.first_name} {user.last_name}</Option>
            ))}
          </Select>
        </div>
      </div>
    </Modal>
  );
}

export function CompanyMergeModal({ open, onClose, selectedRecords }: { open: boolean, onClose: () => void, selectedRecords: Company[] }) {
  const [masterId, setMasterId] = useState<string>('');
  const mergeCompanies = useMergeCompanies();

  const handleMerge = async () => {
    if (!masterId) {
      message.error('Please select the Master record');
      return;
    }
    const duplicateId = selectedRecords.find(r => r.id !== masterId)?.id;
    if (!duplicateId) return;

    await mergeCompanies.mutateAsync({ masterRecordId: masterId, duplicateRecordId: duplicateId });
    setMasterId('');
    onClose();
  };

  if (selectedRecords.length !== 2) return null;

  return (
    <Modal title="Merge Companies" open={open} onCancel={onClose} onOk={handleMerge} confirmLoading={mergeCompanies.isPending} width={800} okText="Confirm Merge" okButtonProps={{ danger: true }}>
      <div style={{ padding: '10px 0' }}>
        <Text type="danger">Warning: Merging will transfer all related records from the duplicate to the master, and the duplicate will be deleted. This cannot be undone.</Text>
        <div style={{ marginTop: 20 }}>
          <Row gutter={16}>
            {selectedRecords.map(record => (
              <Col span={12} key={record.id}>
                <Card 
                  title={`${record.name}`} 
                  style={{ borderColor: masterId === record.id ? '#1890ff' : '#f0f0f0', borderWidth: masterId === record.id ? 2 : 1 }}
                  extra={<Button type={masterId === record.id ? 'primary' : 'default'} onClick={() => setMasterId(record.id)}>{masterId === record.id ? 'Selected as Master' : 'Set as Master'}</Button>}
                >
                  <p><strong>Website:</strong> {record.website || '-'}</p>
                  <p><strong>Industry:</strong> {record.industry || '-'}</p>
                  <p><strong>Created:</strong> {new Date(record.created_at).toLocaleDateString()}</p>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>
    </Modal>
  );
}
