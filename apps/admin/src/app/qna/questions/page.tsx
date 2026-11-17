'use client';

import { useTable, List, EditButton, DeleteButton, ShowButton } from '@refinedev/antd';
import { useUpdate } from '@refinedev/core';
import { Table, Tag, Space, Button, Input, Select, Card, message, Tooltip } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  LockOutlined,
  UnlockOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { QNA_CATEGORIES, QNA_CATEGORY_MAP, QNA_STATUS_MAP } from '@/lib/community';

export default function QuestionsList() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();

  const { mutate: updateQuestion } = useUpdate();

  const { tableProps, setFilters, tableQueryResult } = useTable({
    resource: 'qna/questions',
    syncWithLocation: false,
    pagination: {
      pageSize: 15,
    },
  });

  const applyFilters = (search: string, category?: string, status?: string) => {
    const nextFilters: any[] = [];
    if (search.trim()) {
      nextFilters.push({ field: 'search', operator: 'contains', value: search.trim() });
    }
    if (category) {
      nextFilters.push({ field: 'category', operator: 'eq', value: category });
    }
    if (status) {
      nextFilters.push({ field: 'status', operator: 'eq', value: status });
    }
    setFilters(nextFilters, 'replace');
  };

  const toggleStatus = (record: any) => {
    const nextStatus = record.status === 'CLOSED' ? 'OPEN' : 'CLOSED';
    updateQuestion(
      {
        resource: 'qna/questions',
        id: record.id,
        values: { status: nextStatus },
      },
      {
        onSuccess: () => {
          message.success(
            nextStatus === 'CLOSED' ? 'Soru kapatıldı' : 'Soru yeniden açıldı'
          );
          tableQueryResult.refetch();
        },
        onError: () => {
          message.error('Durum güncellenemedi');
        },
      }
    );
  };

  const columns = [
    {
      title: 'Başlık',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: 280,
      render: (title: string, record: any) => (
        <a onClick={() => router.push(`/qna/questions/show/${record.id}`)}>
          <strong>{title}</strong>
        </a>
      ),
    },
    {
      title: 'Kategori',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      render: (category: string) => {
        const meta = QNA_CATEGORY_MAP[category];
        return <Tag color={meta?.color || 'default'}>{meta?.label || category}</Tag>;
      },
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      key: 'status',
      width: 115,
      render: (status: string) => {
        const meta = QNA_STATUS_MAP[status];
        return <Tag color={meta?.color || 'default'}>{meta?.label || status}</Tag>;
      },
    },
    {
      title: 'Yazar',
      key: 'author',
      width: 150,
      render: (_: any, record: any) =>
        record.isAnonymous
          ? 'Anonim'
          : record.user?.displayName || record.user?.username || 'Kullanıcı',
    },
    {
      title: 'Etkileşim',
      key: 'stats',
      width: 150,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tag>{record.viewCount ?? 0} gör.</Tag>
          <Tag color="blue">{record._count?.answers ?? 0} cev.</Tag>
        </Space>
      ),
    },
    {
      title: 'Tarih',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
    },
    {
      title: 'İşlemler',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <ShowButton hideText size="small" recordItemId={record.id} />
          <EditButton hideText size="small" recordItemId={record.id} />
          <Tooltip title={record.status === 'CLOSED' ? 'Yeniden Aç' : 'Soruyu Kapat'}>
            <Button
              size="small"
              icon={record.status === 'CLOSED' ? <UnlockOutlined /> : <LockOutlined />}
              onClick={() => toggleStatus(record)}
            />
          </Tooltip>
          <DeleteButton
            hideText
            size="small"
            resource="qna/questions"
            recordItemId={record.id}
            onSuccess={() => tableQueryResult.refetch()}
          />
        </Space>
      ),
    },
  ];

  return (
    <List
      title="Topluluk Soruları & Konuları"
      headerButtons={() => (
        <Space>
          <Button
            icon={<BarChartOutlined />}
            onClick={() => router.push('/qna/overview')}
          >
            Genel Bakış
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push('/qna/questions/create')}
          >
            Yeni Soru / Duyuru
          </Button>
        </Space>
      )}
    >
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap style={{ width: '100%' }}>
          <Input
            placeholder="Başlık, içerik veya etiket ara..."
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: 260 }}
            value={searchText}
            onChange={(e) => {
              const val = e.target.value;
              setSearchText(val);
              applyFilters(val, selectedCategory, selectedStatus);
            }}
          />
          <Select
            placeholder="Kategori Filtrele"
            allowClear
            style={{ width: 180 }}
            value={selectedCategory}
            options={QNA_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
            onChange={(val) => {
              setSelectedCategory(val);
              applyFilters(searchText, val, selectedStatus);
            }}
          />
          <Select
            placeholder="Durum Filtrele"
            allowClear
            style={{ width: 150 }}
            value={selectedStatus}
            options={[
              { value: 'OPEN', label: 'Açık' },
              { value: 'ANSWERED', label: 'Cevaplandı' },
              { value: 'CLOSED', label: 'Kapalı' },
            ]}
            onChange={(val) => {
              setSelectedStatus(val);
              applyFilters(searchText, selectedCategory, val);
            }}
          />
        </Space>
      </Card>

      <Table
        {...tableProps}
        columns={columns}
        rowKey="id"
        scroll={{ x: 950 }}
      />
    </List>
  );
}
