import { useState } from 'react';
import {
  Card,
  Upload,
  Button,
  Typography,
  Space,
  Tag,
  List,
  Empty,
  Row,
  Col,
  Select,
} from 'antd';
import {
  AudioOutlined,
  UploadOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useTranscribe } from '../../hooks/use-voice';
import type { TranscriptionResult } from '../../api/voice.api';

const { Title, Text, Paragraph } = Typography;

interface VoiceNote {
  id: string;
  fileName: string;
  transcription: TranscriptionResult;
  uploadedAt: string;
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
];

export default function VoiceNotesPage() {
  const { t } = useTranslation();
  const [language, setLanguage] = useState('en');
  const [notes, setNotes] = useState<VoiceNote[]>([]);
  const [activeNote, setActiveNote] = useState<VoiceNote | null>(null);

  const transcribe = useTranscribe();

  const handleUpload = (file: File) => {
    transcribe.mutate(
      { file, language },
      {
        onSuccess: (response) => {
          if (response.data) {
            const note: VoiceNote = {
              id: Date.now().toString(),
              fileName: file.name,
              transcription: response.data,
              uploadedAt: new Date().toISOString(),
            };
            setNotes((prev) => [note, ...prev]);
            setActiveNote(note);
          }
        },
      },
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>{t('voiceNotes.title')}</Title>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title={t('voiceNotes.uploadTitle')}>
            <Space>
              <Select
                value={language}
                onChange={setLanguage}
                options={LANGUAGES}
                style={{ width: 140 }}
              />
              <Upload
                beforeUpload={(file) => {
                  handleUpload(file);
                  return false;
                }}
                showUploadList={false}
                accept="audio/*,.wav,.mp3,.m4a,.ogg,.flac,.webm"
              >
                <Button
                  icon={<AudioOutlined />}
                  type="primary"
                  size="large"
                  loading={transcribe.isPending}
                >
                  {t('voiceNotes.uploadAndTranscribe')}
                </Button>
              </Upload>
            </Space>
          </Card>
        </Col>

        <Col span={10}>
          <Card title={t('voiceNotes.voiceNotes')} styles={{ body: { padding: notes.length ? 0 : undefined } }}>
            {notes.length === 0 ? (
              <Empty description={t('voiceNotes.noNotesYet')} />
            ) : (
              <List
                dataSource={notes}
                renderItem={(note) => (
                  <List.Item
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      backgroundColor: activeNote?.id === note.id ? '#f0f5ff' : undefined,
                    }}
                    onClick={() => setActiveNote(note)}
                  >
                    <List.Item.Meta
                      avatar={<PlayCircleOutlined style={{ fontSize: 20 }} />}
                      title={note.fileName}
                      description={
                        <Space>
                          <Tag>{note.transcription.language || language}</Tag>
                          <Text type="secondary">
                            {t('voiceNotes.durationSeconds', { val: note.transcription.duration_seconds.toFixed(1) })}
                          </Text>
                          <Text type="secondary">
                            {t('voiceNotes.segmentsCount', { count: note.transcription.segments.length })}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col span={14}>
          {activeNote ? (
            <Card
              title={
                <Space>
                  <FileTextOutlined />
                  <span>{t('voiceNotes.transcriptionLabel', { fileName: activeNote.fileName })}</span>
                </Space>
              }
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Card size="small" type="inner" title={t('voiceNotes.fullText')}>
                  <Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: 15 }}>
                    {activeNote.transcription.text || t('voiceNotes.noTranscriptionAvailable')}
                  </Paragraph>
                </Card>

                {activeNote.transcription.segments.length > 0 && (
                  <Card size="small" type="inner" title={t('voiceNotes.segments')}>
                    <List
                      size="small"
                      dataSource={activeNote.transcription.segments}
                      renderItem={(seg) => (
                        <List.Item>
                          <Space style={{ width: '100%' }} direction="vertical" size={0}>
                            <Space>
                              <Tag color="blue">
                                {seg.start.toFixed(1)}s - {seg.end.toFixed(1)}s
                              </Tag>
                              {seg.confidence !== undefined && (
                                <Text type="secondary">
                                  {t('voiceNotes.confidence', { val: (Math.abs(seg.confidence) * 100).toFixed(0) })}
                                </Text>
                              )}
                            </Space>
                            <Text>{seg.text}</Text>
                          </Space>
                        </List.Item>
                      )}
                    />
                  </Card>
                )}
              </Space>
            </Card>
          ) : (
            <Card>
              <Empty description={t('voiceNotes.selectNoteToView')} />
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}