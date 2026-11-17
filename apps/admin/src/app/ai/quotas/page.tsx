'use client';

import { useTable } from '@refinedev/antd';
import {
  Table,
  Progress,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Form,
  InputNumber,
  Input,
  Switch,
  Button,
  Space,
  Modal,
  Popconfirm,
  Typography,
  message,
} from 'antd';
import {
  SaveOutlined,
  ReloadOutlined,
  EditOutlined,
  ThunderboltOutlined,
  UserOutlined,
  WarningOutlined,
  MessageOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useEffect, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import { apiClient } from '@/providers/dataProvider';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function NovaLimitsAndQuotasPage() {
  const [form] = Form.useForm();
  const [summary, setSummary] = useState<any>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Per-user edit modal state
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [customLimit, setCustomLimit] = useState<number>(100);
  const [updatingUser, setUpdatingUser] = useState(false);

  const { tableProps, setFilters, tableQueryResult } = useTable({
    resource: 'ai/quotas',
    syncWithLocation: false,
    pagination: { pageSize: 15 },
  });

  const loadConfig = useCallback(async () => {
    try {
      const res = await apiClient.get('/quotas/config');
      setSummary(res.data);
      if (res.data?.config) {
        form.setFieldsValue(res.data.config);
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || 'NOVA ayarları yüklenemedi');
    }
  }, [form]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSaveConfig = async (values: any) => {
    setSavingConfig(true);
    try {
      await apiClient.put('/quotas/config', { ...values, syncExisting: true });
      message.success('NOVA limitleri kaydedildi ve aktif kullanıcılara uygulandı');
      loadConfig();
      tableQueryResult.refetch();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Ayarlar kaydedilemedi');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleUpdateUserLimit = async () => {
    if (!editingRecord?.userId) return;
    setUpdatingUser(true);
    try {
      await apiClient.patch(`/quotas/user/${editingRecord.userId}/limit`, {
        limit: customLimit,
      });
      message.success('Kullanıcı limiti güncellendi');
      setEditingRecord(null);
      tableQueryResult.refetch();
      loadConfig();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Limit güncellenemedi');
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleResetUserQuota = async (userId: string) => {
    try {
      await apiClient.post(`/quotas/user/${userId}/reset`, {});
      message.success('Kullanıcının aylık kullanımı sıfırlandı');
      tableQueryResult.refetch();
      loadConfig();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Sıfırlanamadı');
    }
  };

  const columns = [
    {
      title: 'Kullanıcı',
      key: 'user',
      render: (_: any, record: any) => (
        <div>
          <Text strong>{record.user?.email || record.userId}</Text>
          {record.user?.username && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                @{record.user.username}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Plan',
      key: 'plan',
      width: 110,
      render: (_: any, record: any) => {
        const status = record.user?.subscription?.status;
        const isPrem = status === 'ACTIVE' || status === 'TRIAL';
        return (
          <Tag color={isPrem ? 'gold' : 'default'}>
            {isPrem ? 'Premium' : 'Ücretsiz'}
          </Tag>
        );
      },
    },
    {
      title: 'Kullanım',
      key: 'requests',
      width: 120,
      render: (_: any, record: any) => (
        <Text strong>
          {record.aiRequests} / {record.limit}
        </Text>
      ),
    },
    {
      title: 'Kota Doluluk',
      key: 'usage',
      width: 170,
      render: (_: any, record: any) => {
        const percent = record.limit > 0 ? Math.round((record.aiRequests / record.limit) * 100) : 100;
        return (
          <Progress
            percent={Math.min(100, percent)}
            size="small"
            status={percent >= 100 ? 'exception' : 'normal'}
          />
        );
      },
    },
    {
      title: 'Durum',
      key: 'status',
      width: 100,
      render: (_: any, record: any) => {
        const percent = record.limit > 0 ? (record.aiRequests / record.limit) * 100 : 100;
        if (percent >= 100) return <Tag color="red">Aşıldı</Tag>;
        if (percent >= 80) return <Tag color="orange">Yüksek</Tag>;
        return <Tag color="green">Normal</Tag>;
      },
    },
    {
      title: 'Yenilenme',
      dataIndex: 'resetsAt',
      key: 'resetsAt',
      width: 120,
      render: (val: string) => (val ? dayjs(val).format('DD.MM.YYYY') : '-'),
    },
    {
      title: 'İşlemler',
      key: 'actions',
      width: 170,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingRecord(record);
              setCustomLimit(record.limit);
            }}
          >
            Limit
          </Button>
          <Popconfirm
            title="Bu kullanıcının aylık NOVA kullanımını sıfırlamak istiyor musunuz?"
            onConfirm={() => handleResetUserQuota(record.userId)}
            okText="Sıfırla"
            cancelText="İptal"
          >
            <Button size="small" icon={<ReloadOutlined />}>
              Sıfırla
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0 }}>
            NOVA Limitleri ve Kota Yönetimi
          </Title>
          <Text type="secondary">
            Plan bazlı aylık mesaj limitlerini, mesaj karakter sınırını, bakım modunu ve kullanıcı kotalarını yönetin
          </Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            loadConfig();
            tableQueryResult.refetch();
          }}
        >
          Yenile
        </Button>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Aktif Kota Kullanıcısı"
              value={summary?.activeQuotaUsers ?? 0}
              prefix={<UserOutlined style={{ color: '#ec4899' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Bu Ay NOVA Mesajı"
              value={summary?.totalMessagesThisMonth ?? 0}
              prefix={<MessageOutlined style={{ color: '#8b5cf6' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Kotası Dolanlar"
              value={summary?.exhaustedUsers ?? 0}
              prefix={<WarningOutlined style={{ color: '#ef4444' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Dönem"
              value={summary?.monthKey || dayjs().format('YYYY-MM')}
              prefix={<ThunderboltOutlined style={{ color: '#10b981' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Global Plan Limits Config */}
      <Card title="Genel NOVA Limit ve Durum Ayarları" style={{ marginBottom: 20 }}>
        <Form form={form} layout="vertical" onFinish={handleSaveConfig}>
          <Row gutter={16}>
            <Col xs={24} sm={8} md={6}>
              <Form.Item
                label="Ücretsiz Aylık Limit"
                name="freeMonthlyLimit"
                rules={[{ required: true, message: 'Zorunlu' }]}
              >
                <InputNumber min={1} max={100000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8} md={6}>
              <Form.Item
                label="Premium Aylık Limit"
                name="premiumMonthlyLimit"
                rules={[{ required: true, message: 'Zorunlu' }]}
              >
                <InputNumber min={1} max={1000000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={8} md={6}>
              <Form.Item
                label="Maks. Mesaj Karakteri"
                name="maxMessageLength"
                rules={[{ required: true, message: 'Zorunlu' }]}
              >
                <InputNumber min={50} max={4000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="NOVA Durumu (Aktif)"
                name="isNovaEnabled"
                valuePropName="checked"
              >
                <Switch checkedChildren="Aktif" unCheckedChildren="Bakımda" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Bakım Modu Mesajı" name="maintenanceMessage">
                <Input placeholder="NOVA kapalıyken gösterilecek mesaj" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Karşılama Mesajı (Boş Sohbet)" name="systemGreeting">
                <TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>

          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={savingConfig}
          >
            Limitleri Kaydet ve Tüm Aktif Kullanıcılara Uygula
          </Button>
        </Form>
      </Card>

      {/* Per-User Quotas Table */}
      <Card
        title="Kullanıcı Bazlı Kotalar"
        extra={
          <Input
            placeholder="E-posta veya kullanıcı adı ara..."
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: 250 }}
            value={searchText}
            onChange={(e) => {
              const val = e.target.value;
              setSearchText(val);
              setFilters(
                val.trim()
                  ? [{ field: 'search', operator: 'contains', value: val.trim() }]
                  : [],
                'replace'
              );
            }}
          />
        }
      >
        <Table
          {...tableProps}
          columns={columns}
          rowKey="id"
          scroll={{ x: 850 }}
        />
      </Card>

      {/* Custom User Limit Modal */}
      <Modal
        title="Kullanıcı Limitini Düzenle"
        open={editingRecord !== null}
        onCancel={() => setEditingRecord(null)}
        onOk={handleUpdateUserLimit}
        confirmLoading={updatingUser}
        okText="Kaydet"
        cancelText="İptal"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>
            Kullanıcı: <strong>{editingRecord?.user?.email}</strong>
          </Text>
          <Text type="secondary">
            Mevcut kullanım: {editingRecord?.aiRequests ?? 0} mesaj
          </Text>
          <InputNumber
            min={1}
            max={1000000}
            value={customLimit}
            onChange={(val) => setCustomLimit(Number(val) || 1)}
            style={{ width: '100%', marginTop: 8 }}
          />
        </Space>
      </Modal>
    </div>
  );
}
