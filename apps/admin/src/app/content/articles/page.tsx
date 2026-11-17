'use client';

import { useState } from 'react';
import { useTable, List, EditButton, DeleteButton } from '@refinedev/antd';
import { Table, Tag, Space, Button, Image, Input, Select } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

const CATEGORY_LABELS: Record<string, string> = {
    menstrual_health: 'Regl Sağlığı',
    pregnancy: 'Hamilelik',
    fertility: 'Doğurganlık',
    nutrition: 'Beslenme',
    exercise: 'Egzersiz',
    mental_health: 'Ruh Sağlığı',
    sleep: 'Uyku',
    hydration: 'Hidrasyon',
    contraception: 'Doğum Kontrolü',
    pms: 'PMS',
    menopause: 'Menopoz',
    sexual_health: 'Cinsel Sağlık',
};

const FALLBACK_PIXEL =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

export default function ArticlesList() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string | undefined>();

    const { tableProps, setFilters } = useTable({
        resource: 'content/articles',
        syncWithLocation: false,
    });

    const applyFilters = (nextSearch: string, nextCategory?: string) => {
        const filters: any[] = [];
        if (nextSearch.trim()) {
            filters.push({ field: 'search', operator: 'contains', value: nextSearch.trim() });
        }
        if (nextCategory) {
            filters.push({ field: 'category', operator: 'eq', value: nextCategory });
        }
        setFilters(filters, 'replace');
    };

    const columns = [
        {
            title: 'Görsel',
            dataIndex: 'thumbnailUrl',
            key: 'thumbnailUrl',
            width: 80,
            render: (url: string, record: any) => (
                <Image
                    src={url || record.imageUrl || FALLBACK_PIXEL}
                    alt="Makale görseli"
                    width={60}
                    height={60}
                    style={{ objectFit: 'cover', borderRadius: 8, background: '#fdf2f8' }}
                    fallback={FALLBACK_PIXEL}
                />
            ),
        },
        {
            title: 'Başlık (TR)',
            dataIndex: 'titleTr',
            key: 'titleTr',
            ellipsis: true,
            width: 300,
        },
        {
            title: 'Kategori',
            dataIndex: 'category',
            key: 'category',
            render: (category: string) => (
                <Tag color="blue">{CATEGORY_LABELS[category] || category}</Tag>
            ),
        },
        {
            title: 'Durum',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive: boolean) => (
                <Tag color={isActive ? 'green' : 'red'}>
                    {isActive ? 'Aktif' : 'Pasif'}
                </Tag>
            ),
        },
        {
            title: 'Öncelik',
            dataIndex: 'priority',
            key: 'priority',
            sorter: true,
        },
        {
            title: 'Okuma Süresi',
            dataIndex: 'readTimeMin',
            key: 'readTimeMin',
            render: (time: number) => `${time} dk`,
        },
        {
            title: 'Yayın Tarihi',
            dataIndex: 'publishedAt',
            key: 'publishedAt',
            render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
            sorter: true,
        },
        {
            title: 'İşlemler',
            key: 'actions',
            fixed: 'right' as const,
            width: 120,
            render: (_: any, record: any) => (
                <Space>
                    <EditButton hideText size="small" recordItemId={record.id} />
                    <DeleteButton hideText size="small" recordItemId={record.id} />
                </Space>
            ),
        },
    ];

    return (
        <List
            headerButtons={
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => router.push('/content/articles/create')}
                >
                    Makale Oluştur
                </Button>
            }
        >
            <Space wrap style={{ marginBottom: 16 }}>
                <Input
                    placeholder="Makale başlığı veya özet ara..."
                    prefix={<SearchOutlined />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onPressEnter={() => applyFilters(search, categoryFilter)}
                    style={{ width: 250 }}
                    allowClear
                />
                <Select
                    placeholder="Kategori"
                    allowClear
                    value={categoryFilter}
                    onChange={(val) => {
                        setCategoryFilter(val);
                        applyFilters(search, val);
                    }}
                    style={{ width: 180 }}
                    options={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
                        value,
                        label,
                    }))}
                />
                <Button type="primary" onClick={() => applyFilters(search, categoryFilter)}>
                    Filtrele
                </Button>
            </Space>

            <Table
                {...tableProps}
                columns={columns}
                rowKey="id"
                scroll={{ x: 1200 }}
            />
        </List>
    );
}
