'use client';

import { useState } from 'react';
import { useTable, List } from '@refinedev/antd';
import { Table, Tag, Space, Button, Modal, Form, Select, InputNumber, message } from 'antd';
import { CrownOutlined, EditOutlined, SettingOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { apiClient } from '@/providers/dataProvider';

export default function SubscriptionsList() {
  const router = useRouter();
  const { tableProps, tableQueryResult } = useTable({
    resource: 'subscriptions',
    syncWithLocation: true,
  });

  const [editingSub, setEditingSub] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const openEditModal = (record: any) => {
    setEditingSub(record);
    form.setFieldsValue({
      status: record.status,
      tier: record.tier || undefined,
      aiMessagesLimit: record.aiMessagesLimit ?? 100,
    });
  };

  const handleSaveUserSub = async (values: any) => {
    if (!editingSub) return;
    setSaving(true);
    try {
      await apiClient.patch(`/subscription/admin/${editingSub.id}`, values);
      message.success('Kullanıcı aboneliği güncellendi');
      setEditingSub(null);
      tableQueryResult.refetch();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Abonelik güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: 'Kullanıcı E-postası',
      dataIndex: ['user', 'email'],
      key: 'email',
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          FREE: 'default',
          TRIAL: 'blue',
          ACTIVE: 'green',
          EXPIRED: 'red',
          CANCELLED: 'orange',
          GRACE_PERIOD: 'gold',
        };
        const labels: Record<string, string> = {
          FREE: 'Ücretsiz',
          TRIAL: 'Deneme',
          ACTIVE: 'Aktif',
          EXPIRED: 'Süresi Doldu',
          CANCELLED: 'İptal Edildi',
          GRACE_PERIOD: 'Ek Süre',
        };
        return <Tag color={colors[status] || 'default'}>{labels[status] || status}</Tag>;
      },
    },
    {
      title: 'Plan',
      dataIndex: 'tier',
      key: 'tier',
      render: (tier: string) => {
        if (!tier) return 'Yok';
        return tier === 'MONTHLY' ? 'Aylık' : tier === 'YEARLY' ? 'Yıllık' : tier;
      },
    },
    {
      title: 'Sağlayıcı',
      dataIndex: 'provider',
      key: 'provider',
      render: (provider: string) => {
        if (!provider) return 'Yok';
        return provider === 'APPLE' ? 'Apple' : provider === 'GOOGLE' ? 'Google' : provider;
      },
    },
    {
      title: 'Başlangıç',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date: string) => (date ? dayjs(date).format('DD.MM.YYYY') : 'Yok'),
    },
    {
      title: 'Bitiş',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date: string) => (date ? dayjs(date).format('DD.MM.YYYY') : 'Yok'),
    },
    {
      title: 'AI Mesajları',
      key: 'aiMessages',
      render: (_: any, record: any) =>
        `${record.aiMessagesUsed || 0} / ${record.aiMessagesLimit || 0}`,
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_: any, record: any) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
          Düzenle
        </Button>
      ),
    },
  ];

  return (
    <List
      title={
        <Space>
          <CrownOutlined style={{ color: '#faad14' }} />
          <span>Kullanıcı Abonelikleri</span>
        </Space>
      }
      headerButtons={({ defaultButtons }) => (
        <>
          {defaultButtons}
          <Button
            type="primary"
            icon={<SettingOutlined />}
            onClick={() => router.push('/subscriptions/paywall')}
          >
            Premium Sayfası & Fiyatları Yönet
          </Button>
        </>
      )}
    >
      <Table {...tableProps} columns={columns} rowKey="id" />

      <Modal
        title={`Abonelik Düzenle: ${editingSub?.user?.email || ''}`}
        open={!!editingSub}
        onCancel={() => setEditingSub(null)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        okText="Kaydet"
        cancelText="İptal"
      >
        <Form form={form} layout="vertical" onFinish={handleSaveUserSub}>
          <Form.Item label="Durum" name="status">
            <Select
              options={[
                { value: 'FREE', label: 'Ücretsiz' },
                { value: 'TRIAL', label: 'Deneme' },
                { value: 'ACTIVE', label: 'Aktif Premium' },
                { value: 'GRACE_PERIOD', label: 'Ek Süre' },
                { value: 'CANCELLED', label: 'İptal Edildi' },
                { value: 'EXPIRED', label: 'Süresi Doldu' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Plan Tipi" name="tier">
            <Select
              allowClear
              placeholder="Plan seçin"
              options={[
                { value: 'MONTHLY', label: 'Aylık' },
                { value: 'YEARLY', label: 'Yıllık' },
              ]}
            />
          </Form.Item>
          <Form.Item label="AI Mesaj Limiti" name="aiMessagesLimit">
            <InputNumber min={0} step={50} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </List>
  );
}
