'use client';

import { useTable, List, EditButton, DeleteButton } from '@refinedev/antd';
import { useUpdate } from '@refinedev/core';
import { Table, Tag, Space, Button, Input, Select, Card, Switch, message } from 'antd';
import { PlusOutlined, SearchOutlined, StarOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ZODIAC_OPTIONS, ZODIAC_MAP, PERIOD_OPTIONS, PERIOD_MAP } from '@/lib/astrology';

export default function HoroscopesListPage() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [selectedSign, setSelectedSign] = useState<string | undefined>();
  const [selectedPeriod, setSelectedPeriod] = useState<string | undefined>();

  const { mutate: updateHoroscope } = useUpdate();

  const { tableProps, setFilters, tableQueryResult } = useTable({
    resource: 'astrology/horoscopes',
    syncWithLocation: false,
    pagination: {
      pageSize: 12,
    },
  });

  const applyFilters = (search: string, sign?: string, period?: string) => {
    const nextFilters: any[] = [];
    if (search.trim()) {
      nextFilters.push({ field: 'search', operator: 'contains', value: search.trim() });
    }
    if (sign) {
      nextFilters.push({ field: 'sign', operator: 'eq', value: sign });
    }
    if (period) {
      nextFilters.push({ field: 'period', operator: 'eq', value: period });
    }
    setFilters(nextFilters, 'replace');
  };

  const toggleActive = (record: any, checked: boolean) => {
    updateHoroscope(
      {
        resource: 'astrology/horoscopes',
        id: record.id,
        values: { isActive: checked },
      },
      {
        onSuccess: () => {
          message.success(checked ? 'Yorum aktifleştirildi' : 'Yorum pasifleştirildi');
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
      title: 'Burç',
      dataIndex: 'sign',
      key: 'sign',
      width: 125,
      render: (sign: string) => {
        const meta = ZODIAC_MAP[sign];
        return <Tag color={meta?.color || 'default'}>{meta?.label || sign}</Tag>;
      },
    },
    {
      title: 'Dönem',
      dataIndex: 'period',
      key: 'period',
      width: 100,
      render: (period: string) => {
        const meta = PERIOD_MAP[period];
        return <Tag color={meta?.color || 'default'}>{meta?.label || period}</Tag>;
      },
    },
    {
      title: 'Başlık & Özet',
      key: 'content',
      ellipsis: true,
      render: (_: any, record: any) => (
        <div>
          {record.title && (
            <div>
              <strong>{record.title}</strong>
            </div>
          )}
          <span style={{ color: '#666', fontSize: 12 }}>
            {record.summary?.slice(0, 95)}
            {record.summary?.length > 95 ? '...' : ''}
          </span>
        </div>
      ),
    },
    {
      title: 'Enerji / Puan',
      key: 'scores',
      width: 165,
      render: (_: any, record: any) => (
        <Space size={4} wrap>
          <Tag color="purple">%{record.energyScore ?? 80}</Tag>
          <Tag color="pink">Aşk {record.loveScore}/5</Tag>
        </Space>
      ),
    },
    {
      title: 'Şanslı Detay',
      key: 'lucky',
      width: 150,
      render: (_: any, record: any) => (
        <span style={{ fontSize: 12 }}>
          #{record.luckyNumber} • {record.luckyColor}
        </span>
      ),
    },
    {
      title: 'Aktif',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean, record: any) => (
        <Switch
          size="small"
          checked={isActive}
          onChange={(checked) => toggleActive(record, checked)}
        />
      ),
    },
    {
      title: 'İşlemler',
      key: 'actions',
      width: 110,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <EditButton hideText size="small" recordItemId={record.id} />
          <DeleteButton
            hideText
            size="small"
            resource="astrology/horoscopes"
            recordItemId={record.id}
            onSuccess={() => tableQueryResult.refetch()}
          />
        </Space>
      ),
    },
  ];

  return (
    <List
      title="Burç Yorumları Yönetimi"
      headerButtons={() => (
        <Space>
          <Button
            icon={<StarOutlined />}
            onClick={() => router.push('/astrology/cosmic')}
          >
            Kozmik Gökyüzü
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push('/astrology/horoscopes/create')}
          >
            Yeni Burç Yorumu
          </Button>
        </Space>
      )}
    >
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Başlık, yorum veya renk ara..."
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: 250 }}
            value={searchText}
            onChange={(e) => {
              const val = e.target.value;
              setSearchText(val);
              applyFilters(val, selectedSign, selectedPeriod);
            }}
          />
          <Select
            placeholder="Burç Seç"
            allowClear
            style={{ width: 160 }}
            value={selectedSign}
            options={ZODIAC_OPTIONS.map((z) => ({ value: z.value, label: z.label }))}
            onChange={(val) => {
              setSelectedSign(val);
              applyFilters(searchText, val, selectedPeriod);
            }}
          />
          <Select
            placeholder="Dönem Seç"
            allowClear
            style={{ width: 150 }}
            value={selectedPeriod}
            options={PERIOD_OPTIONS.map((p) => ({ value: p.value, label: p.label }))}
            onChange={(val) => {
              setSelectedPeriod(val);
              applyFilters(searchText, selectedSign, val);
            }}
          />
        </Space>
      </Card>

      <Table
        {...tableProps}
        columns={columns}
        rowKey="id"
        scroll={{ x: 900 }}
      />
    </List>
  );
}
