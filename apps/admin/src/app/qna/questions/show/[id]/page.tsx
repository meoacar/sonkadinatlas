'use client';

import { Show } from '@refinedev/antd';
import { useShow } from '@refinedev/core';
import { Typography, Descriptions, Tag, Card, Table } from 'antd';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;

export default function QuestionShow() {
  const { queryResult } = useShow({
    resource: 'qna/questions',
  });

  const { data, isLoading } = queryResult;
  const record = data?.data;

  const statusLabels: Record<string, string> = {
    OPEN: 'Açık',
    ANSWERED: 'Cevaplandı',
    CLOSED: 'Kapalı',
  };

  return (
    <Show isLoading={isLoading} title="Soru Detayı">
      <Descriptions bordered column={2}>
        <Descriptions.Item label="Başlık" span={2}>
          <strong>{record?.title}</strong>
        </Descriptions.Item>
        <Descriptions.Item label="Kategori">
          <Tag color="blue">{record?.category}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Durum">
          <Tag color={record?.status === 'ANSWERED' ? 'green' : record?.status === 'OPEN' ? 'blue' : 'default'}>
            {statusLabels[record?.status] || record?.status}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Yazar">
          {record?.isAnonymous
            ? 'Anonim Kullanıcı'
            : record?.user?.displayName || record?.user?.username || record?.user?.email || 'Bilinmiyor'}
        </Descriptions.Item>
        <Descriptions.Item label="Görüntülenme">{record?.viewCount ?? 0}</Descriptions.Item>
        <Descriptions.Item label="Etiketler">
          {record?.tags?.length ? record.tags.map((t: string) => <Tag key={t}>{t}</Tag>) : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Oluşturulma Tarihi">
          {record?.createdAt ? dayjs(record.createdAt).format('DD.MM.YYYY HH:mm') : '-'}
        </Descriptions.Item>
      </Descriptions>

      <Card title="Soru İçeriği" style={{ marginTop: 16 }}>
        <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{record?.content}</Paragraph>
      </Card>

      {record?.answers && record.answers.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Title level={5}>Cevaplar ({record.answers.length})</Title>
          <Table
            dataSource={record.answers}
            rowKey="id"
            pagination={false}
            columns={[
              {
                title: 'Cevap',
                dataIndex: 'content',
                key: 'content',
              },
              {
                title: 'Yazar',
                key: 'author',
                render: (_: any, ans: any) =>
                  ans.user?.displayName || ans.user?.username || ans.user?.email || 'Anonim',
              },
              {
                title: 'En İyi Cevap',
                dataIndex: 'isBestAnswer',
                key: 'isBestAnswer',
                render: (best: boolean) =>
                  best ? <Tag color="gold">En İyi Cevap</Tag> : <Tag>Normal</Tag>,
              },
              {
                title: 'Tarih',
                dataIndex: 'createdAt',
                key: 'createdAt',
                render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
              },
            ]}
          />
        </div>
      )}
    </Show>
  );
}
