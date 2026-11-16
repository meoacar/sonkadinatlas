'use client';

import { Show } from '@refinedev/antd';
import { useShow } from '@refinedev/core';
import { Descriptions, Tag, Card, Table, Typography } from 'antd';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function PregnancyShow() {
  const { queryResult } = useShow({
    resource: 'health/pregnancy',
  });

  const { data, isLoading } = queryResult;
  const record = data?.data;

  return (
    <Show isLoading={isLoading} title="Hamilelik Kaydı Detayı">
      <Descriptions bordered column={2}>
        <Descriptions.Item label="Kullanıcı E-postası">
          {record?.user?.email || record?.userId || '-'}
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
          {record?.weekCache ? `${record.weekCache}. Hafta` : '-'}
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

      {record?.appointments && record.appointments.length > 0 && (
        <Card title="Doktor Randevuları" style={{ marginTop: 16 }}>
          <Table
            dataSource={record.appointments}
            rowKey="id"
            pagination={false}
            columns={[
              {
                title: 'Tarih',
                dataIndex: 'appointmentAt',
                key: 'appointmentAt',
                render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
              },
              { title: 'Klinik', dataIndex: 'clinic', key: 'clinic' },
              { title: 'Doktor', dataIndex: 'doctorName', key: 'doctorName' },
              { title: 'Notlar', dataIndex: 'notes', key: 'notes' },
            ]}
          />
        </Card>
      )}

      {record?.medications && record.medications.length > 0 && (
        <Card title="İlaçlar ve Takviyeler" style={{ marginTop: 16 }}>
          <Table
            dataSource={record.medications}
            rowKey="id"
            pagination={false}
            columns={[
              { title: 'İlaç Adı', dataIndex: 'name', key: 'name' },
              { title: 'Dozaj', dataIndex: 'dosage', key: 'dosage' },
              { title: 'Sıklık', dataIndex: 'frequency', key: 'frequency' },
              { title: 'Güvenlik Sınıfı', dataIndex: 'safetyRating', key: 'safetyRating' },
            ]}
          />
        </Card>
      )}
    </Show>
  );
}
