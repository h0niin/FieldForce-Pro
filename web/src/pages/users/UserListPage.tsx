import { useState } from 'react';
import { Button, Space, Tooltip, Progress, Tag, Typography, Alert } from 'antd';
import { PlusOutlined, EyeOutlined, TeamOutlined, LinkOutlined, UserAddOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { useUsers, useCompanyUsage } from '@/hooks/use-users';
import type { User, Role } from '@/types/models.types';
import type { PageOptions } from '@/types/api.types';
import { Order } from '@/types/enums';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { formatDateTime } from '@/utils/format-date';
import { PermissionGuard } from '@/components/permissions';
import RoleAssignmentModal from '@/components/users/RoleAssignmentModal';
import InviteUserModal from '@/components/users/InviteUserModal';
import { useAuthStore } from '@/store/auth.store';
import { useGenerateMagicLink } from '@/hooks/use-magic-links';
import MagicLinkModal from '@/components/magic-links/MagicLinkModal';
import type { InviteResult } from '@/api/users.api';

const { Text } = Typography;

export default function UserListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useState<PageOptions>({
    page: 1,
    take: 10,
    order: Order.DESC,
  });
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [magicLinkModal, setMagicLinkModal] = useState<{ link: string; expiresAt: string; purpose: string } | null>(null);

  const currentUser = useAuthStore((s) => s.user);
  const generateLink = useGenerateMagicLink();

  const { data, isLoading } = useUsers(params);
  const { data: usage } = useCompanyUsage();

  const isCompanyAdmin =
    !currentUser?.is_super_admin &&
    currentUser?.roles?.some((r) => (typeof r === 'string' ? r : r.name).toLowerCase() === 'admin');

  const handleAssignRoles = (userId: string) => {
    setSelectedUserId(userId);
    setRoleModalOpen(true);
  };

  const handleCloseRoleModal = () => {
    setRoleModalOpen(false);
    setSelectedUserId(null);
  };

  const handleSendMagicLink = (userId: string) => {
    generateLink.mutate(
      { target_user_id: userId, purpose: 'user_access' },
      {
        onSuccess: (res) => {
          const d = res.data.data;
          if (d) setMagicLinkModal({ link: d.link, expiresAt: d.expires_at, purpose: d.purpose });
        },
      },
    );
  };

  const handleResendInvite = (userId: string) => {
    generateLink.mutate(
      { target_user_id: userId, purpose: 'user_onboarding' },
      {
        onSuccess: (res) => {
          const d = res.data.data;
          if (d) setMagicLinkModal({ link: d.link, expiresAt: d.expires_at, purpose: d.purpose });
        },
      },
    );
  };

  const handleInvited = (result: InviteResult) => {
    setMagicLinkModal({
      link: result.magic_link,
      expiresAt: result.expires_at,
      purpose: 'user_onboarding',
    });
  };

  const isTargetAdmin = (record: User) =>
    record.roles?.some((r) => (typeof r === 'string' ? r : r.name).toLowerCase() === 'admin');

  const usageCurrent = usage?.usage?.total_users?.current;
  const usageLimit = usage?.usage?.total_users?.limit;
  const usagePct = usageLimit && usageCurrent != null ? Math.round((usageCurrent / usageLimit) * 100) : 0;

  const getProgressColor = (pct: number) => {
    if (pct > 90) return '#ff4d4f';
    if (pct > 70) return '#faad14';
    return '#52c41a';
  };

  const columns: ColumnsType<User> = [
    {
      title: t('users.name'),
      key: 'name',
      render: (_, record) => `${record.first_name} ${record.last_name}`,
      sorter: true,
    },
    {
      title: t('users.email'),
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: t('users.role'),
      key: 'roles',
      render: (_, record) =>
        record.roles
          ?.filter((r): r is Role => typeof r !== 'string')
          .map((r) => r.name)
          .join(', ') || '-',
    },
    {
      title: t('users.status'),
      key: 'status',
      render: (_, record) =>
        record.is_active ? (
          <Tag color="success">{t('users.active')}</Tag>
        ) : (
          <Tag color="warning">{t('users.pending')}</Tag>
        ),
    },
    {
      title: t('users.lastLogin'),
      dataIndex: 'last_login_at',
      key: 'last_login_at',
      render: (val: string, record: any) => formatDateTime(val),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title={t('users.viewDetails')}>
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={(e) => { e.stopPropagation(); navigate(`/users/${record.id}`); }}
            />
          </Tooltip>
          <PermissionGuard permission="users:update">
            <Tooltip title={t('users.assignRoles')}>
              <Button
                type="link"
                icon={<TeamOutlined />}
                onClick={(e) => { e.stopPropagation(); handleAssignRoles(record.id); }}
              />
            </Tooltip>
          </PermissionGuard>
          {isCompanyAdmin && !record.is_active && (
            <Tooltip title={t('users.resendInvite')}>
              <Button
                type="link"
                icon={<ReloadOutlined />}
                loading={generateLink.isPending}
                onClick={(e) => { e.stopPropagation(); handleResendInvite(record.id); }}
              />
            </Tooltip>
          )}
          {isCompanyAdmin && record.is_active && !isTargetAdmin(record) && (
            <Tooltip title={t('users.sendMagicLink')}>
              <Button
                type="link"
                icon={<LinkOutlined />}
                loading={generateLink.isPending}
                onClick={(e) => { e.stopPropagation(); handleSendMagicLink(record.id); }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const isLimitReached = !currentUser?.is_super_admin && usageLimit != null && usageCurrent != null && usageCurrent >= usageLimit;

  return (
    <div>
      <PageHeader
        title={t('users.title')}
        subtitle="Manage the accounts and active profiles of your workforce. Dynamically configure user access levels, assign dispatch crews, align territories, and establish skill sets to streamline field operations."
        extra={
          <Space>
            <PermissionGuard permission="users:create">
              <Tooltip title={isLimitReached ? "User limit reached. Upgrade your plan to invite more users." : ""}>
                <Button
                  icon={<UserAddOutlined />}
                  onClick={() => setInviteModalOpen(true)}
                  disabled={isLimitReached}
                >
                  {t('users.inviteUser')}
                </Button>
              </Tooltip>
            </PermissionGuard>
            <PermissionGuard permission="users:create">
              <Tooltip title={isLimitReached ? "User limit reached. Upgrade your plan to create more users." : ""}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/users/create')}
                  disabled={isLimitReached}
                >
                  {t('users.createUser')}
                </Button>
              </Tooltip>
            </PermissionGuard>
          </Space>
        }
      />

      {isLimitReached && (
        <Alert
          message="User Limit Reached"
          description="Your company has reached the maximum number of users allowed by your subscription plan. To add more team members, please upgrade your plan."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {usage && (
        <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--primary-light)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {t('users.plan')}: <strong>{usage.plan_name}</strong>
            </Text>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {t('users.users')}: <strong>{usageCurrent ?? 0}</strong>
              {usageLimit ? ` / ${usageLimit}` : t('users.unlimited')}
            </Text>
          </Space>
          {usageLimit ? (
            <Progress
              percent={usagePct}
              strokeColor={getProgressColor(usagePct)}
              status={usagePct > 90 ? 'exception' : 'normal'}
              size="small"
            />
          ) : null}
        </div>
      )}

      <DataTable
        columns={columns}
        dataSource={data?.data || []}
        loading={isLoading}
        onRow={(record: User) => ({
          onClick: () => navigate(`/users/${record.id}`),
          style: { cursor: 'pointer' },
        })}
        total={data?.meta?.itemCount}
        page={params.page}
        pageSize={params.take}
        onPageChange={(page, pageSize) =>
          setParams((prev) => ({ ...prev, page, take: pageSize }))
        }
        onSearch={(search) => setParams((prev) => ({ ...prev, search, page: 1 }))}
        onSort={(_, order) =>
          setParams((prev) => ({ ...prev, order: order as Order }))
        }
      />

      <RoleAssignmentModal
        userId={selectedUserId}
        open={roleModalOpen}
        onClose={handleCloseRoleModal}
      />

      <InviteUserModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onInvited={handleInvited}
      />

      {magicLinkModal && (
        <MagicLinkModal
          open={!!magicLinkModal}
          onClose={() => setMagicLinkModal(null)}
          link={magicLinkModal.link}
          expiresAt={magicLinkModal.expiresAt}
          purpose={magicLinkModal.purpose}
        />
      )}
    </div>
  );
}