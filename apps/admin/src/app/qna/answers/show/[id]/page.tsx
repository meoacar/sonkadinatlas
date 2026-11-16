'use client';

import { Show } from '@refinedev/antd';
import { useShow } from '@refinedev/core';
import { Descriptions, Tag, Card, Typography } from 'antd';
import dayjs from 'dayjs';

const { Paragraph } = Typography;

export default function AnswerShow() {
  const { queryResult } = useShow({
    resource: 'qna/answers',
  });

  const { data, isLoading } = queryResult;
  const record = data?.data;

  return (
    <Show isLoading={isLoading} title="Cevap Detayı">
      <Descriptions bordered column={2}>
        <Descriptions.Item label="Soru" span={2}>
          {record?.question?.title || record?.questionId || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Yazar">
          {record?.user?.displayName || record?.user?.username || record?.user?.email || 'Anonim'}
        </Descriptions.Item>
        <Descriptions.Item label="En İyi Cevap">
          <Tag color={record?.isBestAnswer ? 'gold' : 'default'}>
            {record?.isBestAnswer ? 'Evet' : 'Hayır'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Oylar">
          <Tag color={(record?.voteCount ?? 0) > 0 ? 'green' : 'default'}>
            {record?.voteCount ?? 0}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Tarih">
          {record?.createdAt ? dayjs(record.createdAt).format('DD.MM.YYYY HH:mm') : '-'}
        </Descriptions.Item>
      </Descriptions>

      <Card title="Cevap İçeriği" style={{ marginTop: 16 }}>
        <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{record?.content}</Paragraph>
      </Card>
    </Show>
  );
}
