'use client';

import { useTable, List, EditButton } from '@refinedev/antd';
import { useInvalidate } from '@refinedev/core';
import { Table, Tag, Space, Switch, Button, Alert, Typography, message } from 'antd';
import { PlusOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiClient } from '@/providers/dataProvider';

const { Text } = Typography;

interface FlagMeta {
    title: string;
    summary: string;
    whenOn: string;
    whenOff: string;
}

const FLAG_DOCS: Record<string, FlagMeta> = {
    maintenance_mode: {
        title: 'Planlı Bakım Modu',
        summary: 'Mobil ana sayfada kullanıcılara planlı bakım duyuru kartı gösterir.',
        whenOn: 'Mobil ana sayfada modern "Sistem İyileştirmesi Yapılıyor" bakım kartı görünür.',
        whenOff: 'Bakım kartı gizlenir, uygulama normal akışında çalışır (önerilen).',
    },
    partner_mode_enabled: {
        title: 'Partner Modu Özelliği',
        summary: 'Ayarlar altındaki Partner Modu ekranını ve eşleştirme API servisini yönetir.',
        whenOn: 'Kullanıcılar Ayarlar → Partner Modu üzerinden davet kodu üretip eşleşebilir (önerilen).',
        whenOff: 'Partner Modu Ayarlar menüsünden gizlenir ve eşleştirme servisi devre dışı kalır.',
    },
    community_enabled: {
        title: 'Topluluk (Soru & Cevap) Modülü',
        summary: 'Alt menüdeki Topluluk sekmesini ve Ayarlar içindeki "Sorularım" kısayolunu yönetir.',
        whenOn: 'Topluluk sekmesi alt menüde görünür ve tüm soru/cevap akışı açıktır (önerilen).',
        whenOff: 'Topluluk sekmesi ve "Sorularım" kısayolu gizlenir; doğrudan açılırsa bilgilendirme kartı gösterilir.',
    },
    astrology_enabled: {
        title: 'Astroloji & Doğum Haritası Modülü',
        summary: 'Ana sayfa Astroloji kartını, Ayarlar burç rozetini ve "Haritam" kısayolunu yönetir.',
        whenOn: 'Astroloji kartı, burç rozeti ve doğum haritası modülü aktif olarak görünür (önerilen).',
        whenOff: 'Tüm Astroloji giriş noktaları mobilde gizlenir; doğrudan açılırsa bilgilendirme kartı gösterilir.',
    },
};

const PRESET_FLAGS = [
    { key: 'maintenance_mode', defaultValue: false, label: 'Bakım Modu' },
    { key: 'partner_mode_enabled', defaultValue: true, label: 'Partner Modu' },
    { key: 'community_enabled', defaultValue: true, label: 'Topluluk' },
    { key: 'astrology_enabled', defaultValue: true, label: 'Astroloji' },
];

export default function FeatureFlagsList() {
    const { tableProps } = useTable({
        resource: 'system/feature-flags',
        syncWithLocation: true,
    });
    const invalidate = useInvalidate();

    const handleCreatePreset = async (key: string, defaultValue: boolean) => {
        try {
            await apiClient.post('/feature-flags', { key, valueJson: defaultValue });
            message.success(`"${key}" bayrağı eklendi`);
            invalidate({ resource: 'system/feature-flags', invalidates: ['list'] });
        } catch (err: any) {
            message.error(err?.response?.data?.message || 'Bayrak zaten mevcut veya eklenemedi');
        }
    };

    const handleToggle = async (record: any) => {
        const currentValue = record.valueJson;
        const newValue = typeof currentValue === 'boolean' ? !currentValue : true;

        try {
            await apiClient.patch(`/feature-flags/${record.key}`, { valueJson: newValue });
            message.success(`"${record.key}" güncellendi`);
            invalidate({ resource: 'system/feature-flags', invalidates: ['list'] });
        } catch (err: any) {
            message.error(err.response?.data?.message || 'Bayrak güncellenemedi');
        }
    };

    const columns = [
        {
            title: 'Özellik Bayrağı & Açıklaması',
            dataIndex: 'key',
            key: 'key',
            render: (key: string) => {
                const doc = FLAG_DOCS[key];
                return (
                    <div style={{ maxWidth: 540 }}>
                        <Space wrap size={6} style={{ marginBottom: 4 }}>
                            <Text strong>{doc?.title || key}</Text>
                            <code style={{ fontSize: 12, color: '#6b7280' }}>{key}</code>
                            <Tag color="blue" icon={<CheckCircleOutlined />}>Canlı Kontrol</Tag>
                        </Space>
                        {doc ? (
                            <div style={{ fontSize: 12.5, color: '#4b5563', lineHeight: 1.55 }}>
                                <div>{doc.summary}</div>
                                <div style={{ marginTop: 4 }}>
                                    <Text type="success" style={{ fontSize: 12 }}>Açıkken: </Text>
                                    <span>{doc.whenOn}</span>
                                </div>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Kapalıyken: </Text>
                                    <span>{doc.whenOff}</span>
                                </div>
                            </div>
                        ) : (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Özel özellik bayrağı kaydı.
                            </Text>
                        )}
                    </div>
                );
            },
        },
        {
            title: 'Durum',
            dataIndex: 'valueJson',
            key: 'valueJson',
            width: 170,
            render: (value: any, record: any) => {
                if (typeof value === 'boolean') {
                    return (
                        <Space>
                            <Switch
                                checked={value}
                                size="small"
                                onChange={() => handleToggle(record)}
                            />
                            <Tag color={value ? 'green' : 'red'}>{value ? 'Açık' : 'Kapalı'}</Tag>
                        </Space>
                    );
                }
                return <code style={{ fontSize: 11 }}>{JSON.stringify(value)}</code>;
            },
        },
        {
            title: 'Son Güncelleme',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            width: 160,
            render: (date: string) => (date ? dayjs(date).format('DD.MM.YYYY HH:mm') : '-'),
        },
        {
            title: 'İşlemler',
            key: 'actions',
            width: 90,
            render: (_: any, record: any) => (
                <Space>
                    <EditButton hideText size="small" recordItemId={record.key} />
                </Space>
            ),
        },
    ];

    return (
        <List title="Özellik Bayrakları">
            <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                message="Canlı Mobil Özellik Kontrolleri"
                description={
                    <div>
                        <div>
                            Buradaki tüm anahtarlar mobil uygulamaya ve API&apos;ye doğrudan bağlıdır; değişiklikleriniz mağaza güncellemesi gerekmeden uygulamaya yansır.
                        </div>
                        <Space wrap style={{ marginTop: 8 }}>
                            <span>Eksik bayrak varsa ekle:</span>
                            {PRESET_FLAGS.map((p) => (
                                <Button
                                    key={p.key}
                                    size="small"
                                    icon={<PlusOutlined />}
                                    onClick={() => handleCreatePreset(p.key, p.defaultValue)}
                                >
                                    {p.label}
                                </Button>
                            ))}
                        </Space>
                    </div>
                }
            />
            <Table {...tableProps} columns={columns} rowKey="key" />
        </List>
    );
}
