'use client';

import { Show } from '@refinedev/antd';
import { useShow } from '@refinedev/core';
import { Descriptions, Tag, Card } from 'antd';
import dayjs from 'dayjs';

export default function CycleShow() {
  const { queryResult } = useShow({
    resource: 'health/cycles',
  });

  const { data, isLoading } = queryResult;
  const record = data?.data;

  const duration =
    record?.startDate && record?.endDate
      ? `${dayjs(record.endDate).diff(dayjs(record.startDate), 'day')} gün`
      : 'Devam Ediyor';

  return (
    <Show isLoading={isLoading} title="Regl Döngüsü Detayı">
      <Descriptions bordered column={2}>
        <Descriptions.Item label="Kullanıcı E-postası">
          {record?.user?.email || record?.userId || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Süre">
          <Tag color={record?.endDate ? 'blue' : 'green'}>{duration}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Başlangıç Tarihi">
          {record?.startDate ? dayjs(record.startDate).format('DD.MM.YYYY') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Bitiş Tarihi">
          {record?.endDate ? dayjs(record.endDate).format('DD.MM.YYYY') : 'Devam Ediyor'}
        </Descriptions.Item>
        <Descriptions.Item label="Notlar" span={2}>
          {record?.notes || 'Not bulunmuyor'}
        </Descriptions.Item>
      </Descriptions>

      {record?.symptomsJson && Object.keys(record.symptomsJson).length > 0 && (
        <Card title="Semptomlar" style={{ marginTop: 16 }}>
          <pre style={{ margin: 0 }}>{JSON.stringify(record.symptomsJson, null, 2)}</pre>
        </Card>
      )}
    </Show>
  );
}
