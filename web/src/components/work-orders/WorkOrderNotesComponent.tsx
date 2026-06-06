import { useState } from 'react';
import { Card, List, Input, Button, Space, Avatar, Empty, Spin, Typography, Tag } from 'antd';
import {
  PlusOutlined,
  UserOutlined,
  DeleteOutlined,
  EditOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { formatDateTime } from '@/utils/format-date';
import { useTranslation } from 'react-i18next';

const { TextArea } = Input;
const { Text } = Typography;

interface Note {
  id: string;
  user_id: string;
  user_name?: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
}

interface WorkOrderNotesComponentProps {
  workOrderId: string;
  notes?: Note[];
  isLoading?: boolean;
  onAddNote?: (content: string, isInternal: boolean) => Promise<void>;
  onUpdateNote?: (noteId: string, content: string) => Promise<void>;
  onDeleteNote?: (noteId: string) => Promise<void>;
}

export default function WorkOrderNotesComponent({
  workOrderId,
  notes = [],
  isLoading = false,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}: WorkOrderNotesComponentProps) {
  const { t } = useTranslation();
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleAddNote = async () => {
    if (!newNoteContent.trim() || !onAddNote) return;

    setIsAdding(true);
    try {
      await onAddNote(newNoteContent, isInternal);
      setNewNoteContent('');
      setIsInternal(false);
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  };

  const handleSaveEdit = async (noteId: string) => {
    if (!editContent.trim() || !onUpdateNote) return;

    try {
      await onUpdateNote(noteId, editContent);
      setEditingNoteId(null);
      setEditContent('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditContent('');
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!onDeleteNote) return;
    await onDeleteNote(noteId);
  };

  return (
    <Card
      title={
        <Space>
          <MessageOutlined />
          <span>{t('workOrderNotes.title')}</span>
          <Tag color="blue">{notes.length}</Tag>
        </Space>
      }
    >
      {/* Add New Note */}
      <div style={{ marginBottom: 24 }}>
        <TextArea
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
          placeholder={t('workOrderNotes.placeholder')}
          rows={3}
          style={{ marginBottom: 12 }}
        />
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddNote}
            loading={isAdding}
            disabled={!newNoteContent.trim()}
          >
            {t('workOrderNotes.addNote')}
          </Button>
          <Button
            type={isInternal ? 'default' : 'dashed'}
            onClick={() => setIsInternal(!isInternal)}
          >
            {isInternal ? t('workOrderNotes.internalNoteLabel') : t('workOrderNotes.publicNoteLabel')}
          </Button>
        </Space>
        {isInternal && (
          <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
            {t('workOrderNotes.internalNoteDescription')}
          </Text>
        )}
      </div>

      {/* Notes List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
        </div>
      ) : notes.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('workOrderNotes.noNotes')}
        />
      ) : (
        <List
          dataSource={notes}
          renderItem={(note) => (
            <List.Item
              key={note.id}
              actions={
                editingNoteId === note.id
                  ? [
                      <Button key="save" type="primary" size="small" onClick={() => handleSaveEdit(note.id)}>
                        {t('workOrderNotes.save')}
                      </Button>,
                      <Button key="cancel" size="small" onClick={handleCancelEdit}>
                        {t('workOrderNotes.cancel')}
                      </Button>,
                    ]
                  : [
                      <Button
                        key="edit"
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditNote(note)}
                      />,
                      <Button
                        key="delete"
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteNote(note.id)}
                      />,
                    ]
              }
            >
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={
                  <Space>
                    <span>{note.user_name || t('workOrderNotes.user')}</span>
                    {note.is_internal && (
                      <Tag color="orange" style={{ fontSize: 11 }}>
                        {t('workOrderNotes.internal')}
                      </Tag>
                    )}
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
                      {formatDateTime(note.created_at)}
                    </Text>
                  </Space>
                }
                description={
                  editingNoteId === note.id ? (
                    <TextArea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      autoFocus
                    />
                  ) : (
                    <Text style={{ whiteSpace: 'pre-wrap' }}>{note.content}</Text>
                  )
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}