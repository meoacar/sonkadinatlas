'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  Popconfirm,
  Typography,
  Switch,
  message,
} from 'antd';
import {
  BulbOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  SendOutlined,
  CheckCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiClient } from '@/providers/dataProvider';

const { Title, Text } = Typography;
const { TextArea } = Input;

const TYPE_OPTIONS = [
  { value: 'positive', label: 'Pozitif Gelişme', color: 'green' },
  { value: 'tip', label: 'Öneri & İpucu', color: 'purple' },
  { value: 'achievement', label: 'Başarım Kutlaması', color: 'gold' },
  { value: 'neutral', label: 'Analiz / Bilgi', color: 'blue' },
  { value: 'warning', label: 'Dikkat / Hatırlatma', color: 'red' },
];

const CATEGORY_OPTIONS = [
  { value: 'wellness', label: 'Wellness & Su', color: 'cyan' },
  { value: 'cycle', label: 'Adet Döngüsü', color: 'magenta' },
  { value: 'mood', label: 'Ruh Hali', color: 'purple' },
  { value: 'symptoms', label: 'Semptomlar', color: 'orange' },
  { value: 'streak', label: 'Seri & Alışkanlık', color: 'gold' },
  { value: 'general', label: 'Genel', color: 'default' },
];

export default function InsightsAdminPage() {
  const [overview, setOverview] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [readFilter, setReadFilter] = useState('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingInsight, setEditingInsight] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const targetValue = Form.useWatch('target', form);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, insightsRes, usersRes] = await Promise.all([
        apiClient.get('/gamification/admin/overview'),
        apiClient.get('/gamification/admin/insights', {
          params: {
            type: typeFilter,
            category: categoryFilter,
            isRead: readFilter === 'ALL' ? undefined : readFilter,
            search: search || undefined,
          },
        }),
        apiClient.get('/gamification/admin/users'),
      ]);
      setOverview(overviewRes.data);
      setInsights(insightsRes.data?.data || []);
      setUsers(usersRes.data?.data || []);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'İçgörüler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, categoryFilter, readFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setEditingInsight(null);
    form.resetFields();
    form.setFieldsValue({
      target: 'all',
      type: 'tip',
      category: 'wellness',
      expiresInDays: 14,
    });
    setModalOpen(true);
  };

  const openEditModal = (record: any) => {
    setEditingInsight(record);
    form.setFieldsValue({
      titleTr: record.titleTr,
      titleEn: record.titleEn,
      messageTr: record.messageTr,
      messageEn: record.messageEn,
      type: record.type,
      category: record.category,
      isRead: record.isRead,
    });
    setModalOpen(true);
  };

  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      if (editingInsight) {
        await apiClient.patch(
          `/gamification/admin/insights/${editingInsight.id}`,
          values,
        );
        message.success('İçgörü güncellendi');
      } else {
        const res = await apiClient.post('/gamification/admin/insights', values);
        message.success(`${res.data?.count || 1} kullanıcıya içgörü gönderildi`);
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/gamification/admin/insights/${id}`);
      message.success('İçgörü silindi');
      loadData();
    } catch {
      message.error('İçgörü silinemedi');
    }
  };

  const columns = [
    {
      title: 'Kullanıcı',
      key: 'user',
      render: (_: any, r: any) => {
        const name =
          r.user?.profile?.firstName && r.user?.profile?.lastName
            ? `${r.user.profile.firstName} ${r.user.profile.lastName}`
            : r.user?.profile?.displayName || r.user?.username || r.user?.email || '-';
        return (
          <div>
            <div style={{ fontWeight: 600 }}>{name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {r.user?.email}
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Başlık & Mesaj',
      key: 'content',
      width: 340,
      render: (_: any, r: any) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.titleTr}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {r.messageTr}
          </Text>
        </div>
      ),
    },
    {
      title: 'Tip',
      dataIndex: 'type',
      key: 'type',
      render: (t: string) => {
        const meta = TYPE_OPTIONS.find((o) => o.value === t);
        return <Tag color={meta?.color || 'default'}>{meta?.label || t}</Tag>;
      },
    },
    {
      title: 'Kategori',
      dataIndex: 'category',
      key: 'category',
      render: (c: string) => {
        const meta = CATEGORY_OPTIONS.find((o) => o.value === c);
        return <Tag color={meta?.color || 'default'}>{meta?.label || c}</Tag>;
      },
    },
    {
      title: 'Durum',
      dataIndex: 'isRead',
      key: 'isRead',
      render: (isRead: boolean) => (
        <Tag color={isRead ? 'green' : 'gold'}>
          {isRead ? 'Okundu' : 'Okunmadı'}
        </Tag>
      ),
    },
    {
      title: 'Tarih',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d: string, r: any) => (
        <div>
          <div>{dayjs(d).format('DD.MM.YYYY HH:mm')}</div>
          {r.expiresAt && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              Son: {dayjs(r.expiresAt).format('DD.MM.YYYY')}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_: any, r: any) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(r)} />
          <Popconfirm
            title="Bu içgörüyü silmek istiyor musunuz?"
            onConfirm={() => handleDelete(r.id)}
            okText="Sil"
            cancelText="İptal"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
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
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0 }}>
            <BulbOutlined style={{ color: '#eb2f96', marginRight: 8 }} />
            İçgörüler & Kişisel İpuçları Yönetimi
          </Title>
          <Text type="secondary">
            Kullanıcılara özel sağlık içgörüleri, hatırlatıcı analizler ve toplu bilgilendirmeler yayınlayın.
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData}>
            Yenile
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Yeni İçgörü Gönder
          </Button>
        </Space>
      </div>

      {/* KPI Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <Card variant="borderless">
            <Statistic
              title="Toplam İçgörü"
              value={overview?.totalInsights ?? 0}
              prefix={<BulbOutlined style={{ color: '#eb2f96' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless">
            <Statistic
              title="Okunmamış İçgörü"
              value={overview?.unreadInsights ?? 0}
              prefix={<EyeOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless">
            <Statistic
              title="Okunma Oranı"
              value={overview?.readRate ?? 0}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card variant="borderless">
        <Space wrap style={{ marginBottom: 16 }}>
          <Input
            placeholder="Başlık, mesaj veya kullanıcı e-postası ara..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 280 }}
            allowClear
          />
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 170 }}
            options={[
              { value: 'ALL', label: 'Tüm Tipler' },
              ...TYPE_OPTIONS.map((t) => ({ value: t.value, label: t.label })),
            ]}
          />
          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 170 }}
            options={[
              { value: 'ALL', label: 'Tüm Kategoriler' },
              ...CATEGORY_OPTIONS.map((c) => ({ value: c.value, label: c.label })),
            ]}
          />
          <Select
            value={readFilter}
            onChange={setReadFilter}
            style={{ width: 150 }}
            options={[
              { value: 'ALL', label: 'Tüm Durumlar' },
              { value: 'false', label: 'Okunmamış' },
              { value: 'true', label: 'Okunmuş' },
            ]}
          />
        </Space>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={insights}
          loading={loading}
          pagination={{ pageSize: 12 }}
          scroll={{ x: 960 }}
        />
      </Card>

      <Modal
        title={editingInsight ? 'İçgörü Düzenle' : 'Yeni İçgörü / İpucu Gönder'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        width={620}
        okText={editingInsight ? 'Kaydet' : 'Yayınla'}
        okButtonProps={{ icon: editingInsight ? undefined : <SendOutlined /> }}
        cancelText="İptal"
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          {!editingInsight && (
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="Hedef Kitle" name="target" rules={[{ required: true }]}>
                  <Select
                    options={[
                      { value: 'all', label: 'Tüm Aktif Kullanıcılar' },
                      { value: 'premium', label: 'Yalnızca Premium Üyeler' },
                      { value: 'free', label: 'Ücretsiz Üyeler' },
                      { value: 'user', label: 'Tek Kullanıcı Seç' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Geçerlilik Süresi (Gün)" name="expiresInDays">
                  <InputNumber min={1} max={365} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          )}

          {!editingInsight && targetValue === 'user' && (
            <Form.Item
              label="Kullanıcı"
              name="userId"
              rules={[{ required: true, message: 'Kullanıcı seçin' }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Kullanıcı ara..."
                options={users.map((u) => ({
                  value: u.userId,
                  label: `${u.displayName} (${u.email})`,
                }))}
              />
            </Form.Item>
          )}

          <Form.Item
            label="Başlık (TR)"
            name="titleTr"
            rules={[{ required: true, message: 'Başlık zorunludur' }]}
          >
            <Input placeholder="Örn: Su Tüketimini Artırmanın Tam Zamanı!" />
          </Form.Item>

          <Form.Item
            label="Mesaj (TR)"
            name="messageTr"
            rules={[{ required: true, message: 'Mesaj zorunludur' }]}
          >
            <TextArea rows={3} placeholder="Kullanıcıya gösterilecek içgörü veya öneri metni..." />
          </Form.Item>

          <Row gutter={12}>
            <Col span={editingInsight ? 8 : 12}>
              <Form.Item label="Tip" name="type">
                <Select options={TYPE_OPTIONS.map((t) => ({ value: t.value, label: t.label }))} />
              </Form.Item>
            </Col>
            <Col span={editingInsight ? 8 : 12}>
              <Form.Item label="Kategori" name="category">
                <Select options={CATEGORY_OPTIONS.map((c) => ({ value: c.value, label: c.label }))} />
              </Form.Item>
            </Col>
            {editingInsight && (
              <Col span={8}>
                <Form.Item label="Okundu" name="isRead" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            )}
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
