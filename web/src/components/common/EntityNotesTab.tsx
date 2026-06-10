import { useState } from 'react';
import { Card, Input, Button, List, Typography, Space, message, Popconfirm } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios-instance';
import { formatDateTime } from '@/utils/format-date';

const { Text } = Typography;
const { TextArea } = Input;

interface Note {
  id: string;
  content: string;
  created_at: string;
  author: {
    first_name: string;
    last_name: string;
  };
}

interface EntityNotesTabProps {
  entityType: string;
  entityId: string;
}

export const EntityNotesTab = ({ entityType, entityId }: EntityNotesTabProps) => {
  const [content, setContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const queryClient = useQueryClient();

  const queryKey = ['notes', entityType, entityId];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await api.get('/notes', {
        params: { entity_type: entityType, entity_id: entityId, take: 50 },
      });
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (noteContent: string) => {
      await api.post('/notes', {
        entity_type: entityType,
        entity_id: entityId,
        content: noteContent,
      });
    },
    onSuccess: () => {
      setContent('');
      message.success('Note added successfully');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => {
      message.error('Failed to add note');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      await api.put(`/notes/${id}`, { content });
    },
    onSuccess: () => {
      setEditingNoteId(null);
      setEditContent('');
      message.success('Note updated successfully');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => {
      message.error('Failed to update note');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notes/${id}`);
    },
    onSuccess: () => {
      message.success('Note deleted');
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) return;
    createMutation.mutate(content);
  };

  const handleUpdate = (id: string) => {
    if (!editContent.trim()) return;
    updateMutation.mutate({ id, content: editContent });
  };

  const notes: Note[] = Array.isArray(data?.data?.data) 
    ? data.data.data 
    : Array.isArray(data?.data) 
      ? data.data 
      : Array.isArray(data) 
        ? data 
        : [];

  return (
    <Card size="small" style={{ marginTop: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <TextArea
            rows={3}
            placeholder="Write a note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <Button
            type="primary"
            style={{ marginTop: 8 }}
            onClick={handleSubmit}
            loading={createMutation.isPending}
            disabled={!content.trim()}
          >
            Save Note
          </Button>
        </div>

        <List
          loading={isLoading}
          dataSource={notes}
          renderItem={(note) => (
            <List.Item
              actions={[
                <Button 
                  type="text" 
                  icon={<EditOutlined />} 
                  size="small" 
                  onClick={() => {
                    setEditingNoteId(note.id);
                    setEditContent(note.content);
                  }}
                  key="edit"
                />,
                <Popconfirm
                  title="Delete note"
                  description="Are you sure you want to delete this note?"
                  onConfirm={() => deleteMutation.mutate(note.id)}
                  okText="Yes"
                  cancelText="No"
                  key="delete"
                >
                  <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>{note.author?.first_name} {note.author?.last_name}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {formatDateTime(note.created_at)}
                    </Text>
                  </Space>
                }
                description={
                  editingNoteId === note.id ? (
                    <div style={{ marginTop: 8 }}>
                      <TextArea
                        rows={2}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                      />
                      <Space style={{ marginTop: 8 }}>
                        <Button 
                          type="primary" 
                          size="small" 
                          onClick={() => handleUpdate(note.id)}
                          loading={updateMutation.isPending}
                        >
                          Save
                        </Button>
                        <Button 
                          size="small" 
                          onClick={() => {
                            setEditingNoteId(null);
                            setEditContent('');
                          }}
                        >
                          Cancel
                        </Button>
                      </Space>
                    </div>
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap', color: 'rgba(0, 0, 0, 0.85)' }}>{note.content}</div>
                  )
                }
              />
            </List.Item>
          )}
        />
      </Space>
    </Card>
  );
};
