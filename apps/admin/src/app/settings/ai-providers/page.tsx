'use client';

import { useTable, List, EditButton, DeleteButton, CreateButton } from '@refinedev/antd';
import { Table, Tag, Space, Switch, Tooltip, Button, Alert, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ApiOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { HttpError } from '@refinedev/core';
import { apiClient } from '@/providers/dataProvider';

interface AIProvider {
    id: string;
    provider: 'google' | 'openai' | 'anthropic' | 'deepseek';
    apiKey: string;
    modelName: string;
    displayName: string;
    description?: string;
    isActive: boolean;
    priority: number;
    createdAt: string;
    updatedAt: string;
}

const providerInfo = {
    google: { name: 'Google Gemini', icon: '🔷', color: '#4285F4' },
    openai: { name: 'OpenAI', icon: '🤖', color: '#10A37F' },
    anthropic: { name: 'Anthropic', icon: '🧠', color: '#D97757' },
    deepseek: { name: 'DeepSeek', icon: '⚡', color: '#7C3AED' },
};

export default function AIProvidersList() {
    const router = useRouter();
    const [testingProvider, setTestingProvider] = useState<string | null>(null);
    const { tableProps, tableQueryResult } = useTable<AIProvider, HttpError>({
        resource: 'ai-providers',
        syncWithLocation: true,
        meta: {
            // Use provider as ID instead of id
            idField: 'provider',
        },
    });

    const handleToggleActive = async (provider: string) => {
        try {
            await apiClient.post(`/ai-providers/${provider}/toggle`);
            message.success(`"${provider}" durumu güncellendi`);
            tableQueryResult?.refetch();
        } catch (err: any) {
            message.error(err?.response?.data?.message || 'Durum güncellenemedi');
        }
    };

    const handleTestConnection = async (provider: string) => {
        setTestingProvider(provider);
        try {
            const res = await apiClient.post(`/ai-providers/${provider}/test`);
            if (res.data?.ok) {
                message.success(`${provider} bağlantısı başarılı (${res.data.latencyMs}ms)`);
            } else {
                message.error(`${provider} test hatası: ${res.data?.error || 'Bağlanılamadı'}`);
            }
        } catch (err: any) {
            message.error(err?.response?.data?.message || 'Test çalıştırılamadı');
        } finally {
            setTestingProvider(null);
        }
    };

    const columns = [
        {
            title: 'Sağlayıcı',
            dataIndex: 'provider',
            key: 'provider',
            render: (provider: keyof typeof providerInfo) => {
                const info = providerInfo[provider];
                return (
                    <Space>
                        <span style={{ fontSize: 20 }}>{info?.icon}</span>
                        <span>{info?.name || provider}</span>
                    </Space>
                );
            },
        },
        {
            title: 'Görünen Ad',
            dataIndex: 'displayName',
            key: 'displayName',
        },
        {
            title: 'Model',
            dataIndex: 'modelName',
            key: 'modelName',
            render: (text: string) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: 'API Anahtarı',
            dataIndex: 'apiKey',
            key: 'apiKey',
            render: (key: string) => (
                <Tooltip title="Güvenlik için maskelenmiştir">
                    <code style={{ fontSize: 12 }}>{key}</code>
                </Tooltip>
            ),
        },
        {
            title: 'Durum',
            dataIndex: 'isActive',
            key: 'isActive',
            align: 'center' as const,
            render: (isActive: boolean, record: AIProvider) => (
                <Space>
                    <Switch
                        checked={isActive}
                        size="small"
                        onChange={() => handleToggleActive(record.provider)}
                    />
                    <Tag
                        icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                        color={isActive ? 'success' : 'default'}
                    >
                        {isActive ? 'Aktif' : 'Pasif'}
                    </Tag>
                </Space>
            ),
        },
        {
            title: 'Öncelik',
            dataIndex: 'priority',
            key: 'priority',
            align: 'center' as const,
            render: (priority: number) => (
                <Tag color={priority > 50 ? 'gold' : 'default'}>{priority}</Tag>
            ),
        },
        {
            title: 'İşlemler',
            key: 'actions',
            align: 'center' as const,
            render: (_: any, record: AIProvider) => (
                <Space>
                    <Tooltip title="Bağlantıyı Test Et">
                        <Button
                            size="small"
                            icon={<ThunderboltOutlined />}
                            loading={testingProvider === record.provider}
                            onClick={() => handleTestConnection(record.provider)}
                        />
                    </Tooltip>
                    <EditButton
                        hideText
                        size="small"
                        recordItemId={record.provider}
                        onClick={() => router.push(`/settings/ai-providers/edit/${record.provider}`)}
                    />
                    <DeleteButton hideText size="small" recordItemId={record.provider} />
                </Space>
            ),
        },
    ];

    return (
        <List
            title="AI Sağlayıcı Yönetimi"
            headerButtons={
                <CreateButton
                    onClick={() => router.push('/settings/ai-providers/create')}
                />
            }
        >
            <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                message="Çalışma Mantığı"
                description="Burada aktif bir sağlayıcı tanımlıysa NOVA öncelikle buradaki API anahtarını ve modeli kullanır. Tablo boşsa sistem otomatik olarak sunucudaki (.env) yedek Google Gemini anahtarıyla çalışmaya devam eder."
            />
            <Table {...tableProps} columns={columns} rowKey="provider" />
        </List>
    );
}
