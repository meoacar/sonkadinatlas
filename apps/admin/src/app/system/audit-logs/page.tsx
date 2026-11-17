'use client';

import { useState } from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Tag, Space, Input, Select, Button, Modal, Descriptions, message, theme as antdTheme } from 'antd';
import { DownloadOutlined, SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

export default function AuditLogsList() {
    const { token } = antdTheme.useToken();
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState<string | undefined>();
    const [entityFilter, setEntityFilter] = useState<string | undefined>();
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

    const { tableProps, setFilters, tableQueryResult } = useTable({
        resource: 'system/audit-logs',
        syncWithLocation: false,
        sorters: {
            initial: [
                {
                    field: 'createdAt',
                    order: 'desc',
                },
            ],
        },
    });

    const applyFilters = (nextSearch: string, nextAction?: string, nextEntity?: string) => {
        const filters: any[] = [];
        if (nextSearch.trim()) {
            filters.push({ field: 'search', operator: 'contains', value: nextSearch.trim() });
        }
        if (nextAction) {
            filters.push({ field: 'action', operator: 'eq', value: nextAction });
        }
        if (nextEntity) {
            filters.push({ field: 'entity', operator: 'eq', value: nextEntity });
        }
        setFilters(filters, 'replace');
    };

    const handleExportCsv = () => {
        const rows = (tableProps.dataSource as any[]) || [];
        if (rows.length === 0) {
            message.warning('Dışa aktarılacak kayıt bulunamadı');
            return;
        }

        const escapeCell = (val: unknown) => {
            const text = String(val ?? '').replace(/"/g, '""');
            return `"${text}"`;
        };

        const header = ['Tarih', 'İşlem', 'Varlık', 'Varlık ID', 'Kullanıcı', 'Detay'];
        const lines = [
            header.join(','),
            ...rows.map((r) =>
                [
                    r.createdAt ? dayjs(r.createdAt).format('YYYY-MM-DD HH:mm:ss') : '',
                    r.action || '',
                    r.entity || '',
                    r.entityId || '',
                    r.user?.email || 'Sistem',
                    r.metadataJson ? JSON.stringify(r.metadataJson) : '',
                ]
                    .map(escapeCell)
                    .join(','),
            ),
        ];

        const blob = new Blob([`\uFEFF${lines.join('\n')}`], {
            type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `denetim-kayitlari-${dayjs().format('YYYY-MM-DD-HHmm')}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        message.success(`${rows.length} kayıt CSV olarak indirildi`);
    };

    const columns = [
        {
            title: 'İşlem',
            dataIndex: 'action',
            key: 'action',
            render: (action: string) => <Tag color="blue">{action}</Tag>,
        },
        {
            title: 'Varlık',
            dataIndex: 'entity',
            key: 'entity',
        },
        {
            title: 'Varlık ID',
            dataIndex: 'entityId',
            key: 'entityId',
            ellipsis: true,
        },
        {
            title: 'Kullanıcı',
            dataIndex: ['user', 'email'],
            key: 'user',
            render: (email: string) => email || 'Sistem',
        },
        {
            title: 'Detay',
            dataIndex: 'metadataJson',
            key: 'metadataJson',
            render: (metadata: any) => {
                if (!metadata) return '-';
                const text = JSON.stringify(metadata);
                return (
                    <code style={{ fontSize: 11 }}>
                        {text.length > 60 ? `${text.substring(0, 60)}...` : text}
                    </code>
                );
            },
        },
        {
            title: 'Tarih',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => (date ? dayjs(date).format('DD.MM.YYYY HH:mm:ss') : '-'),
        },
        {
            title: 'İşlemler',
            key: 'ops',
            width: 90,
            render: (_: any, record: any) => (
                <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => setSelectedRecord(record)}
                >
                    Detay
                </Button>
            ),
        },
    ];

    return (
        <List
            title="Denetim Kayıtları"
            headerButtons={
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={() => tableQueryResult?.refetch()}>
                        Yenile
                    </Button>
                    <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportCsv}>
                        CSV Dışa Aktar
                    </Button>
                </Space>
            }
        >
            <Space wrap style={{ marginBottom: 16 }}>
                <Input
                    placeholder="İşlem, varlık ID veya e-posta ara..."
                    prefix={<SearchOutlined />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onPressEnter={() => applyFilters(search, actionFilter, entityFilter)}
                    style={{ width: 260 }}
                    allowClear
                />
                <Select
                    placeholder="İşlem Türü"
                    allowClear
                    value={actionFilter}
                    onChange={(val) => {
                        setActionFilter(val);
                        applyFilters(search, val, entityFilter);
                    }}
                    style={{ width: 180 }}
                    options={[
                        { label: 'CREATE', value: 'CREATE' },
                        { label: 'UPDATE', value: 'UPDATE' },
                        { label: 'DELETE', value: 'DELETE' },
                        { label: 'LOGIN', value: 'LOGIN' },
                        { label: 'USER_IMPERSONATION', value: 'USER_IMPERSONATION' },
                    ]}
                />
                <Select
                    placeholder="Varlık"
                    allowClear
                    value={entityFilter}
                    onChange={(val) => {
                        setEntityFilter(val);
                        applyFilters(search, actionFilter, val);
                    }}
                    style={{ width: 180 }}
                    options={[
                        { label: 'Auth', value: 'Auth' },
                        { label: 'User', value: 'User' },
                        { label: 'Subscription', value: 'Subscription' },
                        { label: 'FeatureFlag', value: 'FeatureFlag' },
                        { label: 'SupportTicket', value: 'SupportTicket' },
                        { label: 'PeriodNotification', value: 'PeriodNotification' },
                        { label: 'PeriodCycle', value: 'PeriodCycle' },
                        { label: 'Reminder', value: 'Reminder' },
                        { label: 'Retention', value: 'Retention' },
                        { label: 'AIConfig', value: 'AIConfig' },
                        { label: 'QnA', value: 'QnA' },
                        { label: 'Article', value: 'Article' },
                    ]}
                />
                <Button type="primary" onClick={() => applyFilters(search, actionFilter, entityFilter)}>
                    Filtrele
                </Button>
            </Space>

            <Table
                {...tableProps}
                columns={columns}
                rowKey="id"
                size="small"
                locale={{ emptyText: 'Henüz denetim kaydı oluşmadı. Sistemdeki her değişiklik otomatik kaydedilir.' }}
            />

            <Modal
                title="Denetim Kaydı Detayı"
                open={Boolean(selectedRecord)}
                onCancel={() => setSelectedRecord(null)}
                footer={[
                    <Button key="close" type="primary" onClick={() => setSelectedRecord(null)}>
                        Kapat
                    </Button>,
                ]}
                width={640}
            >
                {selectedRecord && (
                    <Space direction="vertical" style={{ width: '100%' }} size={12}>
                        <Descriptions bordered column={2} size="small">
                            <Descriptions.Item label="İşlem">
                                <Tag color="blue">{selectedRecord.action}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Varlık">{selectedRecord.entity}</Descriptions.Item>
                            <Descriptions.Item label="Kullanıcı">
                                {selectedRecord.user?.email || 'Sistem'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tarih">
                                {selectedRecord.createdAt
                                    ? dayjs(selectedRecord.createdAt).format('DD.MM.YYYY HH:mm:ss')
                                    : '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Varlık ID" span={2}>
                                <code>{selectedRecord.entityId || '-'}</code>
                            </Descriptions.Item>
                        </Descriptions>
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>Kayıt Metadata (JSON)</div>
                            <pre
                                style={{
                                    background: token.colorFillTertiary,
                                    padding: 12,
                                    borderRadius: 8,
                                    maxHeight: 280,
                                    overflow: 'auto',
                                    fontSize: 12,
                                }}
                            >
                                {JSON.stringify(selectedRecord.metadataJson || {}, null, 2)}
                            </pre>
                        </div>
                    </Space>
                )}
            </Modal>
        </List>
    );
}
