import { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, TagsOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSetting, useUpsertSetting } from '@/hooks/use-settings';
import { useUsers } from '@/hooks/use-users';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';

interface SkillItem {
  id: string;
  name: string;
  category: string;
  description: string;
  technician_ids: string[];
}

const INITIAL_SKILLS: SkillItem[] = [
  {
    id: 's-1',
    name: 'HVAC Diagnostics & Repair',
    category: 'Mechanical',
    description: 'Diagnosing and repairing complex HVAC and air cooling machinery.',
    technician_ids: [],
  },
  {
    id: 's-2',
    name: 'High Voltage Wiring',
    category: 'Electrical',
    description: 'Installing and repairing industrial electrical circuits and breaker units.',
    technician_ids: [],
  },
];

export default function SkillsSettingsPage() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SkillItem | null>(null);
  const [form] = Form.useForm();

  // Fetch setting key
  const { data: settingData, isLoading } = useSetting('skills_settings');
  const upsertMutation = useUpsertSetting();

  // Fetch users for dropdown assignment
  const { data: usersData } = useUsers({ take: 100 });
  const users = usersData?.data || [];

  const [skills, setSkills] = useState<SkillItem[]>(INITIAL_SKILLS);

  useEffect(() => {
    if (settingData?.value?.list) {
      setSkills(settingData.value.list as SkillItem[]);
    }
  }, [settingData]);

  const saveSkills = async (newList: SkillItem[]) => {
    await upsertMutation.mutateAsync({
      key: 'skills_settings',
      category: 'workforce',
      value: { list: newList },
    });
    setSkills(newList);
  };

  const handleCreateOrEdit = (record?: SkillItem) => {
    if (record) {
      setEditingItem(record);
      form.setFieldsValue(record);
    } else {
      setEditingItem(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    let newList = [...skills];

    if (editingItem) {
      newList = newList.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              name: values.name,
              category: values.category,
              description: values.description,
              technician_ids: values.technician_ids || [],
            }
          : item
      );
    } else {
      newList.push({
        id: `s-${Date.now()}`,
        name: values.name,
        category: values.category,
        description: values.description,
        technician_ids: values.technician_ids || [],
      });
    }

    await saveSkills(newList);
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleDelete = (record: SkillItem) => {
    showConfirmDialog({
      title: t('settings.skills.deleteTitle', 'Delete Skill'),
      content: t('settings.skills.deleteConfirm', {
        name: record.name,
      }),
      onOk: async () => {
        const newList = skills.filter((item) => item.id !== record.id);
        await saveSkills(newList);
      },
      danger: true,
    });
  };

  const getTechnicianNames = (ids: string[]) => {
    return ids
      .map((id) => {
        const u = users.find((user) => user.id === id);
        return u ? `${u.first_name} ${u.last_name}` : null;
      })
      .filter(Boolean) as string[];
  };

  const columns: ColumnsType<SkillItem> = [
    {
      title: t('settings.skills.colName', 'Skill Name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
          <TagsOutlined style={{ marginRight: 6 }} /> {name}
        </span>
      ),
    },
    {
      title: t('settings.skills.colCategory', 'Category'),
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => <Tag color="orange">{cat}</Tag>,
    },
    {
      title: t('settings.skills.colDesc', 'Description'),
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: t('settings.skills.colTechnicians', 'Assigned Technicians'),
      dataIndex: 'technician_ids',
      key: 'technician_ids',
      render: (ids: string[]) => {
        const names = getTechnicianNames(ids);
        return names.length > 0 ? (
          names.map((name) => <Tag color="green" key={name}>{name}</Tag>)
        ) : (
          <span style={{ opacity: 0.5 }}>-</span>
        );
      },
    },
    {
      title: t('settings.skills.colActions', 'Actions'),
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('common.edit', 'Edit')}>
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleCreateOrEdit(record)}
            />
          </Tooltip>
          <Tooltip title={t('common.delete', 'Delete')}>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            {t('settings.skills.title', 'Skills')}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0', maxWidth: 650 }}>
            Catalog professional certifications, technical specialties, and equipment expertise. Assign these skills to technicians to match jobs with qualified personnel on the dispatch board.
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleCreateOrEdit()}
        >
          {t('settings.skills.addBtn', 'Add Skill')}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={skills}
        rowKey="id"
        loading={isLoading}
        pagination={false}
      />

      <Modal
        title={
          editingItem
            ? t('settings.skills.editTitle', 'Edit Skill')
            : t('settings.skills.createTitle', 'Add Skill')
        }
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={upsertMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label={t('settings.skills.formName', 'Skill Name')}
            rules={[{ required: true, message: t('settings.skills.requiredName', 'Please input the skill name') }]}
          >
            <Input placeholder="Fiber Optic Splicing" />
          </Form.Item>

          <Form.Item
            name="category"
            label={t('settings.skills.formCategory', 'Category')}
            rules={[{ required: true, message: t('settings.skills.requiredCategory', 'Please input the category') }]}
          >
            <Input placeholder="Telecommunications" />
          </Form.Item>

          <Form.Item
            name="description"
            label={t('settings.skills.formDesc', 'Description')}
          >
            <Input.TextArea placeholder="Splicing single-mode and multi-mode optical cables" rows={2} />
          </Form.Item>

          <Form.Item
            name="technician_ids"
            label={t('settings.skills.formTechnicians', 'Associate Field Technicians')}
          >
            <Select
              mode="multiple"
              placeholder={t('settings.skills.selectTechnicians', 'Select technicians')}
              options={users.map((u) => ({
                label: `${u.first_name} ${u.last_name}`,
                value: u.id,
              }))}
              optionFilterProp="label"
              maxTagCount="responsive"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
