'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Tabs,
  Form,
  Input,
  InputNumber,
  Switch,
  Select,
  Button,
  Space,
  Table,
  Tag,
  Modal,
  Popconfirm,
  Typography,
  Spin,
  Divider,
  message,
} from 'antd';
import {
  CrownOutlined,
  SaveOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UndoOutlined,
  CheckCircleOutlined,
  MobileOutlined,
} from '@ant-design/icons';
import { apiClient } from '@/providers/dataProvider';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ICON_OPTIONS = [
  { value: 'sparkles', label: 'Yıldızlar (sparkles)' },
  { value: 'hardware-chip-outline', label: 'Akıllı Hafıza (chip)' },
  { value: 'flash-outline', label: 'Hız (flash)' },
  { value: 'bulb-outline', label: 'İçgörü (bulb)' },
  { value: 'planet-outline', label: 'Astroloji (planet)' },
  { value: 'analytics-outline', label: 'Analiz (analytics)' },
  { value: 'chatbubbles-outline', label: 'Sohbet (chatbubbles)' },
  { value: 'heart-outline', label: 'Sağlık (heart)' },
  { value: 'shield-checkmark-outline', label: 'Güvenlik (shield)' },
];

const COLOR_OPTIONS = [
  { value: '#8B5CF6', label: 'Mor (#8B5CF6)' },
  { value: '#EC4899', label: 'Pembe (#EC4899)' },
  { value: '#F59E0B', label: 'Altın (#F59E0B)' },
  { value: '#10B981', label: 'Yeşil (#10B981)' },
  { value: '#3B82F6', label: 'Mavi (#3B82F6)' },
  { value: '#6366F1', label: 'İndigo (#6366F1)' },
];

export default function PaywallAdminPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);

  // Modals for Benefits, Comparison, FAQ
  const [benefitModal, setBenefitModal] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  const [compModal, setCompModal] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  const [faqModal, setFaqModal] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });

  const [benefitForm] = Form.useForm();
  const [compForm] = Form.useForm();
  const [faqForm] = Form.useForm();

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/subscription/admin/paywall-config');
      setConfig(res.data?.config);
      setSummary(res.data?.summary);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Premium yapılandırması yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSaveAll = async (customConfig?: any) => {
    const payload = customConfig || config;
    if (!payload) return;
    setSaving(true);
    try {
      const res = await apiClient.put('/subscription/admin/paywall-config', payload);
      setConfig(res.data?.config || payload);
      message.success('Premium sayfası ayarları kaydedildi ve mobil uygulamaya yansıtıldı');
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      const res = await apiClient.post('/subscription/admin/paywall-config/reset', {});
      setConfig(res.data?.config);
      message.success('Varsayılan ayarlara dönüldü');
    } catch {
      message.error('Sıfırlama başarısız');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
  };

  const updatePlanField = (tier: 'MONTHLY' | 'YEARLY', key: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      plans: {
        ...prev.plans,
        [tier]: {
          ...prev.plans[tier],
          [key]: value,
        },
      },
    }));
  };

  // Benefit CRUD
  const openBenefitModal = (item: any = null) => {
    setBenefitModal({ open: true, item });
    benefitForm.setFieldsValue(
      item || {
        icon: 'sparkles',
        color: '#8B5CF6',
        title: '',
        description: '',
        isActive: true,
      },
    );
  };

  const saveBenefit = (values: any) => {
    const list = [...(config?.benefits || [])];
    if (benefitModal.item) {
      const idx = list.findIndex((x) => x.id === benefitModal.item.id);
      if (idx >= 0) list[idx] = { ...benefitModal.item, ...values };
    } else {
      list.push({ id: `b_${Date.now()}`, ...values });
    }
    const next = { ...config, benefits: list };
    setConfig(next);
    setBenefitModal({ open: false, item: null });
    handleSaveAll(next);
  };

  const deleteBenefit = (id: string) => {
    const next = { ...config, benefits: (config?.benefits || []).filter((x: any) => x.id !== id) };
    setConfig(next);
    handleSaveAll(next);
  };

  // Comparison CRUD
  const openCompModal = (item: any = null) => {
    setCompModal({ open: true, item });
    if (item) {
      compForm.setFieldsValue({
        ...item,
        freeMode: typeof item.freeValue === 'boolean' ? 'bool' : 'text',
        freeBool: typeof item.freeValue === 'boolean' ? item.freeValue : false,
        freeText: typeof item.freeValue === 'string' ? item.freeValue : '',
        premiumMode: typeof item.premiumValue === 'boolean' ? 'bool' : 'text',
        premiumBool: typeof item.premiumValue === 'boolean' ? item.premiumValue : true,
        premiumText: typeof item.premiumValue === 'string' ? item.premiumValue : '',
      });
    } else {
      compForm.setFieldsValue({
        icon: 'sparkles',
        color: '#8B5CF6',
        title: '',
        freeMode: 'bool',
        freeBool: false,
        freeText: '',
        premiumMode: 'bool',
        premiumBool: true,
        premiumText: '',
        isActive: true,
      });
    }
  };

  const saveComp = (values: any) => {
    const row = {
      id: compModal.item?.id || `c_${Date.now()}`,
      icon: values.icon,
      color: values.color,
      title: values.title,
      freeValue: values.freeMode === 'bool' ? Boolean(values.freeBool) : values.freeText || '—',
      premiumValue: values.premiumMode === 'bool' ? Boolean(values.premiumBool) : values.premiumText || '✓',
      isActive: values.isActive ?? true,
    };
    const list = [...(config?.comparisonRows || [])];
    if (compModal.item) {
      const idx = list.findIndex((x) => x.id === compModal.item.id);
      if (idx >= 0) list[idx] = row;
    } else {
      list.push(row);
    }
    const next = { ...config, comparisonRows: list };
    setConfig(next);
    setCompModal({ open: false, item: null });
    handleSaveAll(next);
  };

  const deleteComp = (id: string) => {
    const next = { ...config, comparisonRows: (config?.comparisonRows || []).filter((x: any) => x.id !== id) };
    setConfig(next);
    handleSaveAll(next);
  };

  // FAQ CRUD
  const openFaqModal = (item: any = null) => {
    setFaqModal({ open: true, item });
    faqForm.setFieldsValue(item || { question: '', answer: '', isActive: true });
  };

  const saveFaq = (values: any) => {
    const list = [...(config?.faqs || [])];
    if (faqModal.item) {
      const idx = list.findIndex((x) => x.id === faqModal.item.id);
      if (idx >= 0) list[idx] = { ...faqModal.item, ...values };
    } else {
      list.push({ id: `f_${Date.now()}`, ...values });
    }
    const next = { ...config, faqs: list };
    setConfig(next);
    setFaqModal({ open: false, item: null });
    handleSaveAll(next);
  };

  const deleteFaq = (id: string) => {
    const next = { ...config, faqs: (config?.faqs || []).filter((x: any) => x.id !== id) };
    setConfig(next);
    handleSaveAll(next);
  };

  const freeMode = Form.useWatch('freeMode', compForm);
  const premiumMode = Form.useWatch('premiumMode', compForm);

  if (loading || !config) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <Spin size="large" tip="Premium yapılandırması yükleniyor..." />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
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
            <CrownOutlined style={{ color: '#faad14', marginRight: 8 }} />
            Premium Sayfası & Fiyatlandırma Yönetimi
          </Title>
          <Text type="secondary">
            Mobil uygulamadaki Premium&apos;a Geç ekranının fiyatlarını, deneme süresini, avantaj kartlarını ve SSS içeriğini canlı düzenleyin.
          </Text>
        </div>
        <Space>
          <Popconfirm
            title="Tüm paywall ayarlarını varsayılana sıfırlamak istediğinize emin misiniz?"
            onConfirm={handleReset}
            okText="Sıfırla"
            cancelText="İptal"
          >
            <Button icon={<UndoOutlined />}>Varsayılana Dön</Button>
          </Popconfirm>
          <Button icon={<ReloadOutlined />} onClick={loadConfig}>
            Yenile
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={() => handleSaveAll()}
          >
            Kaydet ve Yayınla
          </Button>
        </Space>
      </div>

      {/* KPI Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless">
            <Statistic
              title="Aktif Premium Üye"
              value={summary?.activeCount ?? 0}
              suffix={`(${summary?.trialCount ?? 0} deneme)`}
              prefix={<CrownOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless">
            <Statistic
              title="Yıllık Plan Fiyatı"
              value={config.plans.YEARLY.price}
              prefix={config.plans.YEARLY.currencySymbol}
              suffix={`(${summary?.yearlyCount ?? 0} üye)`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless">
            <Statistic
              title="Aylık Plan Fiyatı"
              value={config.plans.MONTHLY.price}
              prefix={config.plans.MONTHLY.currencySymbol}
              suffix={`(${summary?.monthlyCount ?? 0} üye)`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless">
            <Statistic
              title="Ücretsiz Deneme"
              value={config.trialEnabled ? `${config.plans.YEARLY.trialDays} Gün Aktif` : 'Kapalı'}
              valueStyle={{ color: config.trialEnabled ? '#52c41a' : '#8c8c8c' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        {/* Main Editor */}
        <Col xs={24} xl={16}>
          <Card variant="borderless">
            <Tabs
              defaultActiveKey="plans"
              items={[
                {
                  key: 'plans',
                  label: 'Planlar & Fiyatlandırma',
                  children: (
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <Row gutter={16}>
                        {(['YEARLY', 'MONTHLY'] as const).map((tier) => {
                          const plan = config.plans[tier];
                          return (
                            <Col xs={24} md={12} key={tier}>
                              <Card
                                size="small"
                                title={
                                  <Space>
                                    <Tag color={tier === 'YEARLY' ? 'purple' : 'blue'}>
                                      {tier === 'YEARLY' ? 'YILLIK' : 'AYLIK'}
                                    </Tag>
                                    <span>{plan.title}</span>
                                  </Space>
                                }
                                extra={
                                  <Switch
                                    checked={plan.isActive}
                                    onChange={(c) => updatePlanField(tier, 'isActive', c)}
                                    checkedChildren="Aktif"
                                    unCheckedChildren="Pasif"
                                  />
                                }
                              >
                                <Form layout="vertical" size="middle">
                                  <Form.Item label="Plan Başlığı">
                                    <Input
                                      value={plan.title}
                                      onChange={(e) => updatePlanField(tier, 'title', e.target.value)}
                                    />
                                  </Form.Item>
                                  <Form.Item label="Alt Açıklama">
                                    <Input
                                      value={plan.subtitle}
                                      onChange={(e) => updatePlanField(tier, 'subtitle', e.target.value)}
                                    />
                                  </Form.Item>
                                  <Row gutter={10}>
                                    <Col span={10}>
                                      <Form.Item label="Fiyat">
                                        <InputNumber
                                          min={1}
                                          style={{ width: '100%' }}
                                          value={plan.price}
                                          onChange={(val) => updatePlanField(tier, 'price', val || 0)}
                                        />
                                      </Form.Item>
                                    </Col>
                                    <Col span={7}>
                                      <Form.Item label="Sembol">
                                        <Input
                                          value={plan.currencySymbol}
                                          onChange={(e) =>
                                            updatePlanField(tier, 'currencySymbol', e.target.value)
                                          }
                                        />
                                      </Form.Item>
                                    </Col>
                                    <Col span={7}>
                                      <Form.Item label="Deneme (Gün)">
                                        <InputNumber
                                          min={0}
                                          max={90}
                                          style={{ width: '100%' }}
                                          value={plan.trialDays}
                                          onChange={(val) =>
                                            updatePlanField(tier, 'trialDays', val ?? 0)
                                          }
                                        />
                                      </Form.Item>
                                    </Col>
                                  </Row>
                                  <Row gutter={10}>
                                    <Col span={12}>
                                      <Form.Item label="Rozet (Örn: EN POPÜLER)">
                                        <Input
                                          value={plan.badgeText || ''}
                                          onChange={(e) =>
                                            updatePlanField(tier, 'badgeText', e.target.value)
                                          }
                                        />
                                      </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                      <Form.Item label="Tasarruf Etiketi">
                                        <Input
                                          value={plan.savingsText || ''}
                                          onChange={(e) =>
                                            updatePlanField(tier, 'savingsText', e.target.value)
                                          }
                                        />
                                      </Form.Item>
                                    </Col>
                                  </Row>
                                  <Form.Item label="iOS Product ID">
                                    <Input
                                      value={plan.iosProductId}
                                      onChange={(e) =>
                                        updatePlanField(tier, 'iosProductId', e.target.value)
                                      }
                                    />
                                  </Form.Item>
                                  <Form.Item label="Android Product ID">
                                    <Input
                                      value={plan.androidProductId}
                                      onChange={(e) =>
                                        updatePlanField(tier, 'androidProductId', e.target.value)
                                      }
                                    />
                                  </Form.Item>
                                </Form>
                              </Card>
                            </Col>
                          );
                        })}
                      </Row>

                      <Card size="small" title="Genel Plan Ayarları">
                        <Row gutter={16}>
                          <Col xs={24} md={8}>
                            <Form.Item label="Varsayılan Seçili Plan">
                              <Select
                                value={config.defaultSelectedTier}
                                onChange={(val) => updateField('defaultSelectedTier', val)}
                                options={[
                                  { value: 'YEARLY', label: 'Yıllık Plan' },
                                  { value: 'MONTHLY', label: 'Aylık Plan' },
                                ]}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item label="Premium AI Mesaj Kotası">
                              <InputNumber
                                min={100}
                                step={100}
                                style={{ width: '100%' }}
                                value={config.premiumAiMessageLimit}
                                onChange={(val) => updateField('premiumAiMessageLimit', val || 1000)}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item label="Standart AI Mesaj Kotası">
                              <InputNumber
                                min={10}
                                step={10}
                                style={{ width: '100%' }}
                                value={config.freeAiMessageLimit}
                                onChange={(val) => updateField('freeAiMessageLimit', val || 100)}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>
                    </Space>
                  ),
                },
                {
                  key: 'hero',
                  label: 'Hero, Deneme & CTA',
                  children: (
                    <Form layout="vertical">
                      <Row gutter={16}>
                        <Col xs={24} md={10}>
                          <Form.Item label="Hero Üst Etiket">
                            <Input
                              value={config.heroEyebrow}
                              onChange={(e) => updateField('heroEyebrow', e.target.value)}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={14}>
                          <Form.Item label="Hero Başlık">
                            <Input
                              value={config.heroTitle}
                              onChange={(e) => updateField('heroTitle', e.target.value)}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item label="Hero Alt Başlık">
                        <TextArea
                          rows={2}
                          value={config.heroSubtitle}
                          onChange={(e) => updateField('heroSubtitle', e.target.value)}
                        />
                      </Form.Item>

                      <Form.Item label="Hero Vurgu Rozetleri (3 adet önerilir)">
                        <Select
                          mode="tags"
                          value={config.heroHighlights || []}
                          onChange={(vals) => updateField('heroHighlights', vals)}
                        />
                      </Form.Item>

                      <Divider />

                      <Row gutter={16} align="middle">
                        <Col span={8}>
                          <Form.Item label="Ücretsiz Deneme Kartı Göster">
                            <Switch
                              checked={config.trialEnabled}
                              onChange={(val) => updateField('trialEnabled', val)}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={16}>
                          <Form.Item label="Deneme Başlığı">
                            <Input
                              value={config.trialTitle}
                              onChange={(e) => updateField('trialTitle', e.target.value)}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item label="Deneme Açıklaması">
                        <Input
                          value={config.trialDescription}
                          onChange={(e) => updateField('trialDescription', e.target.value)}
                        />
                      </Form.Item>

                      <Row gutter={16}>
                        <Col xs={24} md={12}>
                          <Form.Item label="Standart CTA Buton Metni">
                            <Input
                              value={config.ctaButtonText}
                              onChange={(e) => updateField('ctaButtonText', e.target.value)}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item label="Deneme CTA Buton Metni">
                            <Input
                              value={config.ctaTrialButtonText}
                              onChange={(e) => updateField('ctaTrialButtonText', e.target.value)}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item label="Alt Bilgi Notu">
                        <Input
                          value={config.ctaFooterNote}
                          onChange={(e) => updateField('ctaFooterNote', e.target.value)}
                        />
                      </Form.Item>
                    </Form>
                  ),
                },
                {
                  key: 'benefits',
                  label: `Avantaj Kartları (${config.benefits?.length || 0})`,
                  children: (
                    <>
                      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => openBenefitModal()}>
                          Yeni Avantaj Ekle
                        </Button>
                      </div>
                      <Table
                        rowKey="id"
                        size="small"
                        pagination={false}
                        dataSource={config.benefits || []}
                        columns={[
                          {
                            title: 'Başlık',
                            key: 'title',
                            render: (_: any, r: any) => (
                              <Space>
                                <Tag color={r.color}>{r.icon}</Tag>
                                <Text strong>{r.title}</Text>
                              </Space>
                            ),
                          },
                          { title: 'Açıklama', dataIndex: 'description', ellipsis: true },
                          {
                            title: 'Durum',
                            dataIndex: 'isActive',
                            render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Aktif' : 'Pasif'}</Tag>,
                          },
                          {
                            title: 'İşlem',
                            render: (_: any, r: any) => (
                              <Space size="small">
                                <Button size="small" icon={<EditOutlined />} onClick={() => openBenefitModal(r)} />
                                <Popconfirm title="Silinsin mi?" onConfirm={() => deleteBenefit(r.id)}>
                                  <Button size="small" danger icon={<DeleteOutlined />} />
                                </Popconfirm>
                              </Space>
                            ),
                          },
                        ]}
                      />
                    </>
                  ),
                },
                {
                  key: 'comparison',
                  label: `Karşılaştırma (${config.comparisonRows?.length || 0})`,
                  children: (
                    <>
                      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => openCompModal()}>
                          Yeni Satır Ekle
                        </Button>
                      </div>
                      <Table
                        rowKey="id"
                        size="small"
                        pagination={false}
                        dataSource={config.comparisonRows || []}
                        columns={[
                          { title: 'Özellik', dataIndex: 'title' },
                          {
                            title: 'Standart',
                            dataIndex: 'freeValue',
                            render: (v: any) => (typeof v === 'boolean' ? (v ? '✓' : '—') : v),
                          },
                          {
                            title: 'Premium',
                            dataIndex: 'premiumValue',
                            render: (v: any) => (
                              <Tag color="purple">{typeof v === 'boolean' ? (v ? '✓' : '—') : v}</Tag>
                            ),
                          },
                          {
                            title: 'Durum',
                            dataIndex: 'isActive',
                            render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Aktif' : 'Pasif'}</Tag>,
                          },
                          {
                            title: 'İşlem',
                            render: (_: any, r: any) => (
                              <Space size="small">
                                <Button size="small" icon={<EditOutlined />} onClick={() => openCompModal(r)} />
                                <Popconfirm title="Silinsin mi?" onConfirm={() => deleteComp(r.id)}>
                                  <Button size="small" danger icon={<DeleteOutlined />} />
                                </Popconfirm>
                              </Space>
                            ),
                          },
                        ]}
                      />
                    </>
                  ),
                },
                {
                  key: 'faqs',
                  label: `SSS (${config.faqs?.length || 0})`,
                  children: (
                    <>
                      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => openFaqModal()}>
                          Yeni Soru Ekle
                        </Button>
                      </div>
                      <Table
                        rowKey="id"
                        size="small"
                        pagination={false}
                        dataSource={config.faqs || []}
                        columns={[
                          { title: 'Soru', dataIndex: 'question', width: 220 },
                          { title: 'Yanıt', dataIndex: 'answer', ellipsis: true },
                          {
                            title: 'Durum',
                            dataIndex: 'isActive',
                            render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Aktif' : 'Pasif'}</Tag>,
                          },
                          {
                            title: 'İşlem',
                            render: (_: any, r: any) => (
                              <Space size="small">
                                <Button size="small" icon={<EditOutlined />} onClick={() => openFaqModal(r)} />
                                <Popconfirm title="Silinsin mi?" onConfirm={() => deleteFaq(r.id)}>
                                  <Button size="small" danger icon={<DeleteOutlined />} />
                                </Popconfirm>
                              </Space>
                            ),
                          },
                        ]}
                      />
                    </>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        {/* Live Mobile Paywall Preview */}
        <Col xs={24} xl={8}>
          <Card
            variant="borderless"
            title={
              <Space>
                <MobileOutlined style={{ color: '#7C3AED' }} />
                <span>Canlı Mobil Önizleme</span>
              </Space>
            }
          >
            <div
              style={{
                background: '#f8fafc',
                color: '#0f172a',
                borderRadius: 24,
                padding: 16,
                border: '6px solid #1e293b',
              }}
            >
              {/* Hero Preview */}
              <div
                style={{
                  borderRadius: 18,
                  padding: 16,
                  background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 55%, #EC4899 100%)',
                  color: '#fff',
                  marginBottom: 12,
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.85, marginBottom: 4 }}>
                  ✨ {config.heroEyebrow}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{config.heroTitle}</div>
                <div style={{ fontSize: 11.5, opacity: 0.9, lineHeight: 1.4, marginBottom: 10 }}>
                  {config.heroSubtitle}
                </div>
                <Space wrap size={6}>
                  {(config.heroHighlights || []).slice(0, 3).map((h: string) => (
                    <span
                      key={h}
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '3px 8px',
                        borderRadius: 10,
                        fontSize: 10.5,
                        fontWeight: 600,
                      }}
                    >
                      {h}
                    </span>
                  ))}
                </Space>
              </div>

              {/* Plans Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {(['YEARLY', 'MONTHLY'] as const)
                  .filter((t) => config.plans[t].isActive)
                  .map((t) => {
                    const p = config.plans[t];
                    const isDef = config.defaultSelectedTier === t;
                    return (
                      <div
                        key={t}
                        style={{
                          background: isDef ? '#f5f3ff' : '#fff',
                          border: isDef ? '2px solid #7C3AED' : '1px solid #e2e8f0',
                          borderRadius: 14,
                          padding: '10px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>
                            {p.title}{' '}
                            {p.savingsText && (
                              <Tag color="green" style={{ fontSize: 10, marginLeft: 4 }}>
                                {p.savingsText}
                              </Tag>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{p.subtitle}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, fontSize: 15, color: isDef ? '#7C3AED' : '#0f172a' }}>
                            {p.currencySymbol}
                            {p.price}
                          </div>
                          <div style={{ fontSize: 10, color: '#64748b' }}>
                            /{t === 'YEARLY' ? 'yıl' : 'ay'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Trial Preview */}
              {config.trialEnabled && (
                <div
                  style={{
                    background: '#f5f3ff',
                    borderRadius: 12,
                    padding: '8px 10px',
                    marginBottom: 12,
                    fontSize: 11,
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#5b21b6' }}>{config.trialTitle}</div>
                  <div style={{ color: '#64748b' }}>{config.trialDescription}</div>
                </div>
              )}

              {/* CTA Preview */}
              <div
                style={{
                  background: '#7C3AED',
                  color: '#fff',
                  borderRadius: 12,
                  padding: '10px 12px',
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {config.trialEnabled ? config.ctaTrialButtonText : config.ctaButtonText}
              </div>
              <div style={{ textAlign: 'center', fontSize: 10, color: '#94a3b8', marginTop: 6 }}>
                {config.ctaFooterNote}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Benefit Modal */}
      <Modal
        title={benefitModal.item ? 'Avantajı Düzenle' : 'Yeni Avantaj Ekle'}
        open={benefitModal.open}
        onCancel={() => setBenefitModal({ open: false, item: null })}
        onOk={() => benefitForm.submit()}
        okText="Kaydet"
        cancelText="İptal"
      >
        <Form form={benefitForm} layout="vertical" onFinish={saveBenefit}>
          <Form.Item label="Başlık" name="title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Açıklama" name="description" rules={[{ required: true }]}>
            <TextArea rows={2} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="İkon" name="icon">
                <Select options={ICON_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Renk" name="color">
                <Select options={COLOR_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Aktif" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Comparison Modal */}
      <Modal
        title={compModal.item ? 'Satırı Düzenle' : 'Yeni Karşılaştırma Satırı'}
        open={compModal.open}
        onCancel={() => setCompModal({ open: false, item: null })}
        onOk={() => compForm.submit()}
        okText="Kaydet"
        cancelText="İptal"
      >
        <Form form={compForm} layout="vertical" onFinish={saveComp}>
          <Form.Item label="Özellik Adı" name="title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="İkon" name="icon">
                <Select options={ICON_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Renk" name="color">
                <Select options={COLOR_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Standart Tipi" name="freeMode">
                <Select options={[{ value: 'bool', label: 'Var/Yok' }, { value: 'text', label: 'Metin' }]} />
              </Form.Item>
              {freeMode === 'bool' ? (
                <Form.Item label="Standart Durum" name="freeBool" valuePropName="checked">
                  <Switch checkedChildren="Var" unCheckedChildren="Yok" />
                </Form.Item>
              ) : (
                <Form.Item label="Standart Değer" name="freeText">
                  <Input placeholder="Örn: Temel / 100" />
                </Form.Item>
              )}
            </Col>
            <Col span={12}>
              <Form.Item label="Premium Tipi" name="premiumMode">
                <Select options={[{ value: 'bool', label: 'Var/Yok' }, { value: 'text', label: 'Metin' }]} />
              </Form.Item>
              {premiumMode === 'bool' ? (
                <Form.Item label="Premium Durum" name="premiumBool" valuePropName="checked">
                  <Switch checkedChildren="Var" unCheckedChildren="Yok" />
                </Form.Item>
              ) : (
                <Form.Item label="Premium Değer" name="premiumText">
                  <Input placeholder="Örn: Gelişmiş / 1000+" />
                </Form.Item>
              )}
            </Col>
          </Row>
          <Form.Item label="Aktif" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* FAQ Modal */}
      <Modal
        title={faqModal.item ? 'Soruyu Düzenle' : 'Yeni SSS Ekle'}
        open={faqModal.open}
        onCancel={() => setFaqModal({ open: false, item: null })}
        onOk={() => faqForm.submit()}
        okText="Kaydet"
        cancelText="İptal"
      >
        <Form form={faqForm} layout="vertical" onFinish={saveFaq}>
          <Form.Item label="Soru" name="question" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Yanıt" name="answer" rules={[{ required: true }]}>
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Aktif" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
