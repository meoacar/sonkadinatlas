'use client';

import { Show } from '@refinedev/antd';
import { useShow, useUpdate } from '@refinedev/core';
import { Descriptions, Tag, Card, Button, Space, Select, Input, message } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';

export default function ReportShow() {
  const { queryResult } = useShow({
    resource: 'qna/reports',
  });
  const { mutate: updateReport, isLoading: isUpdating } = useUpdate();

  const { data, isLoading } = queryResult;
  const record = data?.data;

  const [moderatorNote, setModeratorNote] = useState('');
  const [selectedAction, setSelectedAction] = useState<'APPROVE' | 'HIDE' | 'DELETE'>('APPROVE');

  const statusLabels: Record<string, string> = {
    PENDING: 'Beklemede',
    REVIEWED: 'İncelendi',
    RESOLVED: 'Çözüldü',
    DISMISSED: 'Reddedildi',
  };

  const typeLabels: Record<string, string> = {
    QUESTION: 'Soru',
    ANSWER: 'Cevap',
    COMMENT: 'Yorum',
  };

  const handleReview = () => {
    if (!record?.id) return;
    updateReport(
      {
        resource: 'qna/reports',
        id: record.id,
        values: {
          action: selectedAction,
          moderatorNote,
        },
      },
      {
        onSuccess: () => {
          message.success('Rapor incelemesi kaydedildi');
          queryResult.refetch();
        },
      }
    );
  };

  return (
    <Show isLoading={isLoading} title="Rapor İnceleme Detayı">
      <Descriptions bordered column={2}>
        <Descriptions.Item label="İçerik Türü">
          <Tag color="blue">{typeLabels[record?.contentType] || record?.contentType}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Durum">
          <Tag color={record?.status === 'PENDING' ? 'orange' : 'green'}>
            {statusLabels[record?.status] || record?.status}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Sebep">{record?.reason}</Descriptions.Item>
        <Descriptions.Item label="Raporlayan">
          {record?.reporter?.username || record?.reporter?.email || 'Bilinmiyor'}
        </Descriptions.Item>
        <Descriptions.Item label="Açıklama" span={2}>
          {record?.description || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Rapor Tarihi">
          {record?.createdAt ? dayjs(record.createdAt).format('DD.MM.YYYY HH:mm') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="İçerik ID">{record?.contentId}</Descriptions.Item>
      </Descriptions>

      {record?.contentDetails && (
        <Card title="Raporlanan İçerik" style={{ marginTop: 16 }}>
          {record.contentDetails.title && (
            <p>
              <strong>Başlık:</strong> {record.contentDetails.title}
            </p>
          )}
          <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{record.contentDetails.content}</p>
        </Card>
      )}

      <Card title="Moderasyon Aksiyonu" style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Select
            style={{ width: 280 }}
            value={selectedAction}
            onChange={(val) => setSelectedAction(val)}
            options={[
              { value: 'APPROVE', label: 'İçeriği Onayla (Raporu Reddet)' },
              { value: 'HIDE', label: 'İçeriği Gizle' },
              { value: 'DELETE', label: 'İçeriği Kalıcı Olarak Sil' },
            ]}
          />
          <Input.TextArea
            rows={3}
            placeholder="Moderatör notu (isteğe bağlı)..."
            value={moderatorNote}
            onChange={(e) => setModeratorNote(e.target.value)}
          />
          <Button type="primary" loading={isUpdating} onClick={handleReview}>
            Kararı Uygula
          </Button>
        </Space>
      </Card>
    </Show>
  );
}
