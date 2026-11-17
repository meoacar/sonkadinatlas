'use client';

import { useState } from 'react';
import { useTable, List } from '@refinedev/antd';
import {
  Table,
  Tag,
  Switch,
  Space,
  Input,
  Select,
  Button,
  Popconfirm,
  Typography,
  message,
} from 'antd';
import { DeleteOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiClient } from '@/providers/dataProvider';

const { Text } = Typography;

export default function RemindersList() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [activeFilter, setActiveFilter] = useState<string | undefined>();

  const { tableProps, setFilters, tableQueryResult } = useTable({
    resource: 'reminders',
    syncWithLocation: false,
  });

  const applyFilters = (nextSearch: string, nextType?: string, nextActive?: string) => {
    const filters: any[] = [];
    if (nextSearch.trim()) {
      filters.push({ field: 'search', operator: 'contains', value: nextSearch.trim() });
    }
    if (nextType) {
      filters.push({ field: 'type', operator: 'eq', value: nextType });
    }
    if (nextActive) {
      filters.push({ field: 'active', operator: 'eq', value: nextActive });
    }
    setFilters(filters, 'replace');
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await apiClient.patch(`/reminders/admin/${id}`, { active });
      message.success(active ? 'Hatırlatıcı aktifleştirildi' : 'Hatırlatıcı duraklatıldı');
      tableQueryResult?.refetch();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Hatırlatıcı güncellenemedi');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/reminders/admin/${id}`);
      message.success('Hatırlatıcı silindi');
      tableQueryResult?.refetch();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Hatırlatıcı silinemedi');
    }
  };

  const typeLabels: Record<string, string> = {
    DAILY: 'Günlük',
    WEEKLY: 'Haftalık',
    MONTHLY: 'Aylık',
    CUSTOM: 'Özel',
  };

  const typeColors: Record<string, string> = {
    DAILY: 'blue',
    WEEKLY: 'purple',
    MONTHLY: 'magenta',
    CUSTOM: 'orange',
  };

  const columns = [
    {
      title: 'Kullanıcı',
      key: 'user',
      render: (_: any, record: any) => (
        <div>
          <Text strong>{record.user?.email || '-'}</Text>
          {record.user?.username && (
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>@{record.user.username}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Başlık & İçerik',
      dataIndex: 'payloadJson',
      key: 'payloadJson',
      render: (payload: any) => (
        <div style={{ maxWidth: 320 }}>
          <div>
            <Text strong>{payload?.title || 'Hatırlatıcı'}</Text>
            {payload?.time && (
              <Tag color="cyan" style={{ marginLeft: 8 }}>
                {payload.time}
              </Tag>
            )}
          </div>
          {(payload?.message || payload?.body) && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {payload.message || payload.body}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Tür',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={typeColors[type] || 'default'}>{typeLabels[type] || type}</Tag>
      ),
    },
    {
      title: 'Sonraki Çalışma',
      dataIndex: 'nextRunAt',
      key: 'nextRunAt',
      render: (date: string) => (date ? dayjs(date).format('DD.MM.YYYY HH:mm') : '-'),
    },
    {
      title: 'Aktif',
      dataIndex: 'active',
      key: 'active',
      render: (active: boolean, record: any) => (
        <Switch
          checked={active}
          onChange={(checked) => handleToggleActive(record.id, checked)}
        />
      ),
    },
    {
      title: 'İşlemler',
      key: 'actions',
      width: 90,
      render: (_: any, record: any) => (
        <Popconfirm
          title="Hatırlatıcıyı silmek istediğinize emin misiniz?"
          onConfirm={() => handleDelete(record.id)}
          okText="Sil"
          cancelText="İptal"
        >
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <List title="Hatırlatıcı Yönetimi">
      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          placeholder="E-posta veya kullanıcı adı ara..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onPressEnter={() => applyFilters(search, typeFilter, activeFilter)}
          style={{ width: 250 }}
          allowClear
        />
        <Select
          placeholder="Tür"
          allowClear
          value={typeFilter}
          onChange={(val) => {
            setTypeFilter(val);
            applyFilters(search, val, activeFilter);
          }}
          style={{ width: 140 }}
          options={[
            { label: 'Günlük', value: 'DAILY' },
            { label: 'Haftalık', value: 'WEEKLY' },
            { label: 'Aylık', value: 'MONTHLY' },
            { label: 'Özel', value: 'CUSTOM' },
          ]}
        />
        <Select
          placeholder="Durum"
          allowClear
          value={activeFilter}
          onChange={(val) => {
            setActiveFilter(val);
            applyFilters(search, typeFilter, val);
          }}
          style={{ width: 130 }}
          options={[
            { label: 'Aktif', value: 'true' },
            { label: 'Pasif', value: 'false' },
          ]}
        />
        <Button type="primary" onClick={() => applyFilters(search, typeFilter, activeFilter)}>
          Filtrele
        </Button>
        <Button icon={<ReloadOutlined />} onClick={() => tableQueryResult?.refetch()}>
          Yenile
        </Button>
      </Space>

      <Table {...tableProps} columns={columns} rowKey="id" />
    </List>
  );
}
