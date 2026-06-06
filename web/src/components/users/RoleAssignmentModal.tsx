import { useEffect, useState } from 'react';
import { Modal, Transfer, Spin, Alert } from 'antd';
import type { Key } from 'antd/es/table/interface';
import { useTranslation } from 'react-i18next';
import { useAllRoles } from '@/hooks/use-roles';
import { useUser } from '@/hooks/use-users';
import { useAssignRoles } from '@/hooks/use-user-roles';

interface RoleAssignmentModalProps {
  userId: string | null;
  open: boolean;
  onClose: () => void;
}

interface TransferItem {
  key: string;
  title: string;
  description?: string;
}

export default function RoleAssignmentModal({
  userId,
  open,
  onClose,
}: RoleAssignmentModalProps) {
  const { t } = useTranslation();
  const [targetKeys, setTargetKeys] = useState<Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Key[]>([]);

  const { data: allRoles, isLoading: rolesLoading } = useAllRoles();
  const { data: user, isLoading: userLoading } = useUser(userId || '');
  const assignRolesMutation = useAssignRoles();

  // Initialize target keys from user's current roles
  useEffect(() => {
    if (user?.roles) {
      setTargetKeys(
        user.roles
          .filter((role): role is import('@/types/models.types').Role => typeof role !== 'string')
          .map((role) => role.id)
      );
    } else {
      setTargetKeys([]);
    }
  }, [user]);

  const handleChange = (newTargetKeys: Key[]) => {
    setTargetKeys(newTargetKeys);
  };

  const handleSelectChange = (sourceSelectedKeys: Key[], targetSelectedKeys: Key[]) => {
    setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys]);
  };

  const handleOk = async () => {
    if (!userId) return;

    try {
      await assignRolesMutation.mutateAsync({
        userId,
        roleIds: targetKeys as string[],
      });
      onClose();
    } catch (error) {
      // Error is handled by the mutation's onError
    }
  };

  const handleCancel = () => {
    onClose();
    // Reset to user's current roles
    if (user?.roles) {
      setTargetKeys(
        user.roles
          .filter((role): role is import('@/types/models.types').Role => typeof role !== 'string')
          .map((role) => role.id)
      );
    }
  };

  // Prepare data for Transfer component
  const dataSource: TransferItem[] =
    allRoles?.map((role) => ({
      key: role.id,
      title: role.name,
      description: role.description || undefined,
    })) || [];

  const isLoading = rolesLoading || userLoading;

  return (
    <Modal
      title={`${t('roleAssignment.title')} - ${user?.first_name} ${user?.last_name}`}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={assignRolesMutation.isPending}
      width={700}
      okText={t('roleAssignment.save')}
      cancelText={t('roleAssignment.cancel')}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {!allRoles || allRoles.length === 0 ? (
            <Alert
              message={t('roleAssignment.noRolesAvailable')}
              description={t('roleAssignment.pleaseCreateRoles')}
              type="warning"
              showIcon
            />
          ) : (
            <Transfer
              dataSource={dataSource}
              titles={[t('roleAssignment.availableRoles'), t('roleAssignment.assignedRoles')]}
              targetKeys={targetKeys}
              selectedKeys={selectedKeys}
              onChange={handleChange}
              onSelectChange={handleSelectChange}
              render={(item) => (
                <div>
                  <div style={{ fontWeight: 500 }}>{item.title}</div>
                  {item.description && (
                    <div style={{ fontSize: 12, color: '#888' }}>{item.description}</div>
                  )}
                </div>
              )}
              listStyle={{
                width: 300,
                height: 400,
              }}
              showSearch
              filterOption={(inputValue, item) =>
                item.title.toLowerCase().includes(inputValue.toLowerCase())
              }
            />
          )}
        </>
      )}
    </Modal>
  );
}