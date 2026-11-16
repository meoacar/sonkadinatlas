'use client';

import { useTable } from '@refinedev/antd';
import { List, EditButton } from '@refinedev/antd';
import { Table, Tag, Space } from 'antd';
import dayjs from 'dayjs';

export default function FeatureFlagsList() {
    const { tableProps } = useTable({
        resource: 'system/feature-flags',
        syncWithLocation: true,
    });

    const columns = [
        {
            title: 'Anahtar (Key)',
            dataIndex: 'key',
            key: 'key',
        },
        {
            title: 'Değer',
            dataIndex: 'valueJson',
            key: 'valueJson',
            render: (value: any) => {
                if (typeof value === 'boolean') {
                    return <Tag color={value ? 'green' : 'red'}>{value ? 'Aktif' : 'Pasif'}</Tag>;
                }
                return <code>{JSON.stringify(value)}</code>;
            },
        },
        {
            title: 'Son Güncelleme',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
        },
        {
            title: 'İşlemler',
            key: 'actions',
            render: (_: any, record: any) => (
                <Space>
                    <EditButton hideText size="small" recordItemId={record.key} />
                </Space>
            ),
        },
    ];

    return (
        <List title="Özellik Bayrakları">
            <Table {...tableProps} columns={columns} rowKey="key" />
        </List>
    );
}
