'use client';

import { Show } from '@refinedev/antd';
import { useShow } from '@refinedev/core';
import { Descriptions, Tag, Card, Table, Space, Typography, Button } from 'antd';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

const { Text } = Typography;

const FLOW_LABELS: Record<string, string> = {
  light: 'Hafif',
  moderate: 'Orta',
  heavy: 'Yoğun',
};

export default function CycleShow() {
  const router = useRouter();
  const { queryResult } = useShow({
    resource: 'health/cycles',
  });

  const { data, isLoading } = queryResult;
  const record = data?.data;

  const duration =
    record?.startDate && record?.endDate
      ? `${Math.max(1, dayjs(record.endDate).diff(dayjs(record.startDate), 'day') + 1)} gün`
      : 'Devam Ediyor';

  const symptoms = record?.symptomsJson && typeof record.symptomsJson === 'object'
    ? record.symptomsJson
    : null;

  return (
    <Show isLoading={isLoading} title="Regl Döngüsü Detayı">
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
        <Descriptions.Item label="Süre">
          <Tag color={record?.endDate ? 'blue' : 'magenta'}>{duration}</Tag>
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

      {symptoms && Object.keys(symptoms).length > 0 && (
        <Card title="Döngü Semptom Özeti" style={{ marginTop: 16 }}>
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Akış Yoğunluğu">
              {symptoms.flow ? (
                <Tag color="volcano">{FLOW_LABELS[symptoms.flow] || symptoms.flow}</Tag>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Kramp Seviyesi">
              {symptoms.cramps !== undefined ? `${symptoms.cramps} / 5` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Ruh Hali">
              {Array.isArray(symptoms.mood) && symptoms.mood.length > 0 ? (
                <Space wrap>
                  {symptoms.mood.map((m: string) => (
                    <Tag key={m} color="purple">{m}</Tag>
                  ))}
                </Space>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Fiziksel Belirtiler">
              {Array.isArray(symptoms.physical) && symptoms.physical.length > 0 ? (
                <Space wrap>
                  {symptoms.physical.map((p: string) => (
                    <Tag key={p} color="pink">{p}</Tag>
                  ))}
                </Space>
              ) : (
                '-'
              )}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Card title="Bu Dönemdeki Günlük Kayıtlar & Check-in" style={{ marginTop: 16 }}>
        {record?.dailyLogs && record.dailyLogs.length > 0 ? (
          <Table
            dataSource={record.dailyLogs}
            rowKey="id"
            pagination={false}
            columns={[
              {
                title: 'Tarih',
                dataIndex: 'date',
                key: 'date',
                render: (d: string) => dayjs(d).format('DD.MM.YYYY'),
              },
              {
                title: 'Akış',
                dataIndex: 'flow',
                key: 'flow',
                render: (f: string) => (f ? <Tag color="red">{FLOW_LABELS[f] || f}</Tag> : '-'),
              },
              {
                title: 'Kramp',
                dataIndex: 'cramps',
                key: 'cramps',
                render: (c: number) => (c != null ? `${c}/5` : '-'),
              },
              {
                title: 'Ruh Hali',
                dataIndex: 'mood',
                key: 'mood',
                render: (mood: string[]) =>
                  mood?.length ? (
                    <Space wrap>
                      {mood.map((m) => (
                        <Tag key={m} color="purple">{m}</Tag>
                      ))}
                    </Space>
                  ) : (
                    '-'
                  ),
              },
              {
                title: 'Belirtiler',
                dataIndex: 'symptoms',
                key: 'symptoms',
                render: (syms: string[]) =>
                  syms?.length ? (
                    <Space wrap>
                      {syms.map((s) => (
                        <Tag key={s} color="cyan">{s}</Tag>
                      ))}
                    </Space>
                  ) : (
                    '-'
                  ),
              },
              {
                title: 'Sağlık Notu',
                dataIndex: 'healthNotes',
                key: 'healthNotes',
                render: (n: string) => n || <Text type="secondary">-</Text>,
              },
            ]}
          />
        ) : (
          <Text type="secondary">Bu döngü aralığında günlük kayıt bulunmuyor.</Text>
        )}
      </Card>
    </Show>
  );
}
