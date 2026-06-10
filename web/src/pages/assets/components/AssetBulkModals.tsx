import { useState } from 'react';
import { Modal, Upload, Button, Select, Typography, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useImportAssets, useChangeAssetOwner } from '@/hooks/use-assets';
import { useUsers } from '@/hooks/use-users';

const { Text } = Typography;
const { Option } = Select;

export function AssetImportModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const importAssets = useImportAssets();

  const handleImport = async () => {
    if (!file) {
      message.error('Please select a CSV file first');
      return;
    }
    await importAssets.mutateAsync(file);
    setFile(null);
    onClose();
  };

  return (
    <Modal title="Import Assets" open={open} onCancel={onClose} onOk={handleImport} confirmLoading={importAssets.isPending}>
      <div style={{ padding: '20px 0' }}>
        <Text>Please upload a CSV file containing asset records. The file should include headers such as <b>Asset Name</b>, <b>Serial Number</b>, <b>Model</b>, and <b>Manufacturer</b>.</Text>
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

export function AssetChangeOwnerModal({ open, onClose, selectedIds }: { open: boolean, onClose: () => void, selectedIds: string[] }) {
  const [newOwnerId, setNewOwnerId] = useState<string>('');
  const { data: usersResponse, isLoading } = useUsers();
  const changeOwner = useChangeAssetOwner();
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
        <Text>Select a new owner for the {selectedIds.length} selected asset(s).</Text>
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
