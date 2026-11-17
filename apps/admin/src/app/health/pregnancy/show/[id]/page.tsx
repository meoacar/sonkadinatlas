'use client';

import { Show } from '@refinedev/antd';
import { useShow } from '@refinedev/core';
import { Descriptions, Tag, Card, Table, Typography, Button } from 'antd';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

const { Text } = Typography;

export default function PregnancyShow() {
  const router = useRouter();
  const { queryResult } = useShow({
    resource: 'health/pregnancy',
  });

  const { data, isLoading } = queryResult;
  const record = data?.data;

  return (
    <Show isLoading={isLoading} title="Hamilelik Kaydı Detayı">
      <Descriptions bordered column={2}>
        <Descriptions.Item label="Kullanıcı">
          {record?.user ? (
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() => router.push(`/users/show/${record.user.id}`)}
            >
              {record.user.email}
              {record.user.username ? ` (@${record.user.username})` : ''}
            </Button>
          ) : (
            record?.userId || '-'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Durum">
          <Tag color={record?.isActive ? 'green' : 'default'}>
            {record?.isActive ? 'Aktif' : 'Pasif'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Son Adet Tarihi (LMP)">
          {record?.lmpDate ? dayjs(record.lmpDate).format('DD.MM.YYYY') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Tahmini Doğum Tarihi">
          {record?.dueDate ? dayjs(record.dueDate).format('DD.MM.YYYY') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Hafta">
          {record?.weekCache != null ? `${record.weekCache}. Hafta` : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Trimester">
          {record?.trimester ? `${record.trimester}. Trimester` : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Anonim Mod">
          {record?.anonymousMode ? 'Evet' : 'Hayır'}
        </Descriptions.Item>
        <Descriptions.Item label="Doktor Notları">
          {record?.doctorNotes || '-'}
        </Descriptions.Item>
      </Descriptions>

      <Card title="Tekme Sayım Seansları" style={{ marginTop: 16 }}>
        {record?.kickCounts?.length > 0 ? (
          <Table
            dataSource={record?.kickCounts || []}
            rowKey="id"
            pagination={false}
            columns={[
              {
                title: 'Tarih',
                dataIndex: 'sessionDate',
                key: 'sessionDate',
                render: (d: string) => dayjs(d).format('DD.MM.YYYY HH:mm'),
              },
              {
                title: 'Tekme Sayısı',
                dataIndex: 'kickCount',
                key: 'kickCount',
                render: (c: number) => <Tag color="cyan">{c} tekme</Tag>,
              },
              {
                title: 'Süre (dk)',
                dataIndex: 'durationMin',
                key: 'durationMin',
                render: (m: number) => `${m} dk`,
              },
              { title: 'Not', dataIndex: 'notes', key: 'notes', render: (n: string) => n || '-' },
            ]}
          />
        ) : (
          <Text type="secondary">Tekme sayım kaydı yok.</Text>
        )}
      </Card>

      <Card title="Kasılma Kayıtları" style={{ marginTop: 16 }}>
        {record?.contractions?.length > 0 ? (
          <Table
            dataSource={record?.contractions || []}
            rowKey="id"
            pagination={false}
            columns={[
              {
                title: 'Başlangıç',
                dataIndex: 'startTime',
                key: 'startTime',
                render: (d: string) => dayjs(d).format('DD.MM.YYYY HH:mm:ss'),
              },
              {
                title: 'Süre (sn)',
                dataIndex: 'durationSec',
                key: 'durationSec',
                render: (s: number) => `${s} sn`,
              },
              {
                title: 'Şiddet',
                dataIndex: 'intensity',
                key: 'intensity',
                render: (i: number) => (i != null ? <Tag color="orange">{i}/10</Tag> : '-'),
              },
              { title: 'Not', dataIndex: 'notes', key: 'notes', render: (n: string) => n || '-' },
            ]}
          />
        ) : (
          <Text type="secondary">Kasılma kaydı yok.</Text>
        )}
      </Card>

      <Card title="Doktor Randevuları" style={{ marginTop: 16 }}>
        {record?.appointments?.length > 0 ? (
          <Table
            dataSource={record?.appointments || []}
            rowKey="id"
            pagination={false}
            columns={[
              {
                title: 'Tarih',
                dataIndex: 'appointmentAt',
                key: 'appointmentAt',
                render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
              },
              { title: 'Klinik', dataIndex: 'clinic', key: 'clinic', render: (v: string) => v || '-' },
              { title: 'Doktor', dataIndex: 'doctorName', key: 'doctorName', render: (v: string) => v || '-' },
              { title: 'Notlar', dataIndex: 'notes', key: 'notes', render: (v: string) => v || '-' },
            ]}
          />
        ) : (
          <Text type="secondary">Randevu kaydı yok.</Text>
        )}
      </Card>

      <Card title="İlaçlar ve Takviyeler" style={{ marginTop: 16 }}>
        {record?.medications?.length > 0 ? (
          <Table
            dataSource={record?.medications || []}
            rowKey="id"
            pagination={false}
            columns={[
              { title: 'İlaç Adı', dataIndex: 'name', key: 'name' },
              { title: 'Dozaj', dataIndex: 'dosage', key: 'dosage', render: (v: string) => v || '-' },
              { title: 'Sıklık', dataIndex: 'frequency', key: 'frequency', render: (v: string) => v || '-' },
              { title: 'Güvenlik Sınıfı', dataIndex: 'safetyRating', key: 'safetyRating', render: (v: string) => v || '-' },
            ]}
          />
        ) : (
          <Text type="secondary">İlaç kaydı yok.</Text>
        )}
      </Card>

      {record?.pregnancyNotes?.length > 0 && (
        <Card title="Hamilelik Notları" style={{ marginTop: 16 }}>
          <Table
            dataSource={record?.pregnancyNotes || []}
            rowKey="id"
            pagination={false}
            columns={[
              { title: 'Başlık', dataIndex: 'title', key: 'title', render: (v: string) => v || 'Not' },
              { title: 'İçerik', dataIndex: 'content', key: 'content' },
              {
                title: 'Tarih',
                dataIndex: 'createdAt',
                key: 'createdAt',
                render: (d: string) => dayjs(d).format('DD.MM.YYYY'),
              },
            ]}
          />
        </Card>
      )}
    </Show>
  );
}
