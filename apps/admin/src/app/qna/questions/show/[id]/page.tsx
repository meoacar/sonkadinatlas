'use client';

import { Show, EditButton, DeleteButton } from '@refinedev/antd';
import { useShow, useUpdate } from '@refinedev/core';
import {
  Typography,
  Descriptions,
  Tag,
  Card,
  Table,
  Space,
  Button,
  Input,
  Select,
  Popconfirm,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  SendOutlined,
  StarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QNA_CATEGORY_MAP, QNA_STATUS_MAP } from '@/lib/community';
import { apiClient } from '@/providers/dataProvider';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

export default function QuestionShow() {
  const router = useRouter();
  const { queryResult } = useShow({
    resource: 'qna/questions',
  });
  const { mutate: updateQuestion, isLoading: updatingStatus } = useUpdate();

  const { data, isLoading } = queryResult;
  const record = data?.data;

  const [answerContent, setAnswerContent] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  const handleStatusChange = (status: string) => {
    if (!record?.id) return;
    updateQuestion(
      {
        resource: 'qna/questions',
        id: record.id,
        values: { status },
      },
      {
        onSuccess: () => {
          message.success('Soru durumu güncellendi');
          queryResult.refetch();
        },
        onError: () => {
          message.error('Durum güncellenemedi');
        },
      }
    );
  };

  const handleAddOfficialAnswer = async () => {
    if (!record?.id) return;
    if (answerContent.trim().length < 20) {
      message.warning('Cevap en az 20 karakter olmalıdır');
      return;
    }

    setSubmittingAnswer(true);
    try {
      await apiClient.post(`/qna/questions/${record.id}/answers/admin`, {
        content: answerContent.trim(),
      });
      message.success('Resmi cevap eklendi');
      setAnswerContent('');
      queryResult.refetch();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Cevap eklenemedi');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleMarkBestAnswer = async (answerId: string) => {
    if (!record?.id) return;
    try {
      await apiClient.post(
        `/qna/questions/${record.id}/answers/${answerId}/mark-best/admin`,
        {},
      );
      message.success('En iyi cevap olarak işaretlendi');
      queryResult.refetch();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'İşlem başarısız');
    }
  };

  const handleDeleteAnswer = async (answerId: string) => {
    try {
      await apiClient.delete(`/qna/answers/${answerId}/admin`);
      message.success('Cevap silindi');
      queryResult.refetch();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Cevap silinemedi');
    }
  };

  const categoryMeta = QNA_CATEGORY_MAP[record?.category];
  const statusMeta = QNA_STATUS_MAP[record?.status];

  return (
    <Show
      isLoading={isLoading}
      title="Soru Yönetimi ve Detayı"
      headerButtons={({ defaultButtons }) => (
        <Space>
          {record?.id && (
            <>
              <Select
                value={record.status}
                loading={updatingStatus}
                style={{ width: 140 }}
                onChange={handleStatusChange}
                options={[
                  { value: 'OPEN', label: 'Açık' },
                  { value: 'ANSWERED', label: 'Cevaplandı' },
                  { value: 'CLOSED', label: 'Kapalı' },
                ]}
              />
              <EditButton recordItemId={record.id} />
              <DeleteButton
                resource="qna/questions"
                recordItemId={record.id}
                onSuccess={() => router.push('/qna/questions')}
              />
            </>
          )}
          {defaultButtons}
        </Space>
      )}
    >
      <Descriptions bordered column={2}>
        <Descriptions.Item label="Başlık" span={2}>
          <strong>{record?.title}</strong>
        </Descriptions.Item>
        <Descriptions.Item label="Kategori">
          <Tag color={categoryMeta?.color || 'blue'}>
            {categoryMeta?.label || record?.category}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Durum">
          <Tag color={statusMeta?.color || 'default'}>
            {statusMeta?.label || record?.status}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Yazar">
          {record?.isAnonymous
            ? 'Anonim Kullanıcı'
            : record?.user?.displayName ||
              record?.user?.username ||
              record?.user?.email ||
              'Bilinmiyor'}
        </Descriptions.Item>
        <Descriptions.Item label="Etkileşim">
          <Space>
            <Tag>{record?.viewCount ?? 0} görüntülenme</Tag>
            <Tag color="pink">{record?._count?.favorites ?? 0} favori</Tag>
            <Tag color="blue">{record?._count?.comments ?? 0} yorum</Tag>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Etiketler">
          {record?.tags?.length
            ? record.tags.map((t: string) => <Tag key={t}>#{t}</Tag>)
            : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Oluşturulma Tarihi">
          {record?.createdAt
            ? dayjs(record.createdAt).format('DD.MM.YYYY HH:mm')
            : '-'}
        </Descriptions.Item>
      </Descriptions>

      <Card title="Soru İçeriği" style={{ marginTop: 16 }}>
        <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
          {record?.content}
        </Paragraph>
      </Card>

      {/* Answers Management */}
      <Card
        title={`Cevaplar (${record?.answers?.length || 0})`}
        style={{ marginTop: 16 }}
      >
        {record?.answers && record.answers.length > 0 ? (
          <Table
            dataSource={record.answers}
            rowKey="id"
            pagination={false}
            columns={[
              {
                title: 'Cevap',
                dataIndex: 'content',
                key: 'content',
                render: (text: string) => (
                  <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {text}
                  </Paragraph>
                ),
              },
              {
                title: 'Yazar',
                key: 'author',
                width: 170,
                render: (_: any, ans: any) => (
                  <div>
                    <Text strong>
                      {ans.user?.displayName || ans.user?.username || 'Anonim'}
                    </Text>
                    {ans.user?.email && (
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {ans.user.email}
                        </Text>
                      </div>
                    )}
                  </div>
                ),
              },
              {
                title: 'Durum / Oy',
                key: 'meta',
                width: 150,
                render: (_: any, ans: any) => (
                  <Space direction="vertical" size={4}>
                    {ans.isBestAnswer && (
                      <Tag icon={<StarOutlined />} color="gold">
                        En İyi Cevap
                      </Tag>
                    )}
                    <Tag>{ans.voteCount ?? 0} oy</Tag>
                  </Space>
                ),
              },
              {
                title: 'İşlemler',
                key: 'actions',
                width: 220,
                render: (_: any, ans: any) => (
                  <Space size="small">
                    {!ans.isBestAnswer && (
                      <Button
                        size="small"
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleMarkBestAnswer(ans.id)}
                      >
                        En İyi Seç
                      </Button>
                    )}
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => router.push(`/qna/answers/edit/${ans.id}`)}
                    />
                    <Popconfirm
                      title="Bu cevabı silmek istediğinize emin misiniz?"
                      onConfirm={() => handleDeleteAnswer(ans.id)}
                      okText="Sil"
                      cancelText="İptal"
                    >
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        ) : (
          <Text type="secondary">Henüz cevap verilmemiş.</Text>
        )}
      </Card>

      {/* Official Admin Answer Composer */}
      <Card title="Resmi Cevap / Uzman Yanıtı Ekle" style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <TextArea
            rows={4}
            value={answerContent}
            onChange={(e) => setAnswerContent(e.target.value)}
            placeholder="Topluluk sorusuna resmi veya uzman yanıtı yazın (en az 20 karakter)..."
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={submittingAnswer}
            onClick={handleAddOfficialAnswer}
          >
            Cevabı Yayınla
          </Button>
        </Space>
      </Card>
    </Show>
  );
}
