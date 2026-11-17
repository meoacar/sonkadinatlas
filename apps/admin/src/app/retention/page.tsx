'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  FireOutlined,
  GiftOutlined,
  HeartOutlined,
  PlusOutlined,
  ReloadOutlined,
  RiseOutlined,
  SendOutlined,
  TeamOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiClient } from '@/providers/dataProvider';

const { Title, Text } = Typography;

type TriggerType = 'inactivity' | 'onboarding_dropoff' | 'trial_ending';
type Incentive = 'none' | 'trial_offer' | 'nova_bonus' | 'quick_checkin';
type CtaScreen = 'home' | 'calendar' | 'chat' | 'premium';

interface FunnelStep {
  key: string;
  label: string;
  count: number;
  ratePct: number;
  stepRetentionPct: number;
}

interface CohortRow {
  label: string;
  registered: number;
  withCycle: number;
  activeLast7d: number;
  premium: number;
  retentionPct: number;
}

interface AtRiskUser {
  id: string;
  email: string;
  displayName: string;
  inactiveDays: number;
  riskReason: 'inactivity' | 'onboarding_dropoff';
  subscriptionStatus: string;
  cycleCount: number;
  hasPushToken: boolean;
  hasPendingBanner: boolean;
  lastWinbackDate: string | null;
}

interface WinbackTier {
  id: string;
  triggerType: TriggerType;
  inactiveDays: number;
  titleTr: string;
  bodyTr: string;
  sendPush: boolean;
  sendEmail: boolean;
  showInAppBanner: boolean;
  incentive: Incentive;
  ctaScreen: CtaScreen;
  active: boolean;
}

interface WinbackConfig {
  enabled: boolean;
  tiers: WinbackTier[];
  updatedAt: string;
}

const TRIGGER_LABELS: Record<TriggerType, { label: string; color: string }> = {
  inactivity: { label: 'Uygulamaya Girmeme', color: 'orange' },
  onboarding_dropoff: { label: 'Onboarding / Döngü Yarım', color: 'purple' },
  trial_ending: { label: 'Deneme Süresi Bitiyor', color: 'gold' },
};

const INCENTIVE_OPTIONS = [
  { value: 'none', label: 'Ödül Yok (Sadece Mesaj)' },
  { value: 'nova_bonus', label: '🎁 +10 NOVA Bonus Mesaj' },
  { value: 'trial_offer', label: '👑 7 Gün Ücretsiz Premium Teklifi' },
  { value: 'quick_checkin', label: '⚡ Hızlı Bugün Kaydı Çağrısı' },
];

const CTA_OPTIONS = [
  { value: 'home', label: 'Ana Sayfa' },
  { value: 'calendar', label: 'Takvim & Döngü Ekle' },
  { value: 'chat', label: 'NOVA AI Sohbet' },
  { value: 'premium', label: 'Premium Sayfası' },
];

export default function RetentionPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [funnel, setFunnel] = useState<{
    totalUsers: number;
    steps: FunnelStep[];
    cohorts: CohortRow[];
    atRiskUsers: AtRiskUser[];
    activity: {
      dau: number;
      wau: number;
      mau: number;
      stickinessPct: number;
      activeLast7Days: number;
      activeLast30Days: number;
      inactive3dCount: number;
      inactive7dRisk: number;
      recoveredCount: number;
    };
  } | null>(null);
  const [winback, setWinback] = useState<WinbackConfig | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [riskFilter, setRiskFilter] = useState<'all' | 'inactivity' | 'onboarding_dropoff'>('all');

  // Nudge single user modal
  const [nudgeTarget, setNudgeTarget] = useState<AtRiskUser | null>(null);
  const [nudgeTitle, setNudgeTitle] = useState('Seni tekrar görmek harika olur 🌸');
  const [nudgeBody, setNudgeBody] = useState(
    'Döngü tahminlerin ve bugünkü kişisel önerilerin seni bekliyor. +10 NOVA bonus mesaj hediyen hazır!',
  );
  const [nudgeIncentive, setNudgeIncentive] = useState<Incentive>('nova_bonus');
  const [nudgeScreen, setNudgeScreen] = useState<CtaScreen>('chat');
  const [nudgePush, setNudgePush] = useState(true);
  const [nudgeEmail, setNudgeEmail] = useState(false);
  const [nudgeBanner, setNudgeBanner] = useState(true);
  const [nudging, setNudging] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [funnelRes, winbackRes] = await Promise.all([
        apiClient.get('/admin/retention/funnel'),
        apiClient.get('/admin/retention/winback'),
      ]);
      setFunnel(funnelRes.data);
      setWinback(winbackRes.data.config);
      setLogs(winbackRes.data.logs || []);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Retention verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const saveWinback = async (next: WinbackConfig, msgText?: string) => {
    setSaving(true);
    try {
      const res = await apiClient.put('/admin/retention/winback', next);
      setWinback(res.data.config);
      setLogs(res.data.logs || []);
      if (msgText) message.success(msgText);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Ayarlar kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleDispatchNow = async () => {
    setDispatching(true);
    try {
      const res = await apiClient.post('/admin/retention/winback/dispatch');
      setLogs(res.data.logs || []);
      const s = res.data.summary;
      message.success(
        `Win-Back tamamlandı: ${s.targetedUsers} kullanıcı hedeflendi (${s.sentPush} push, ${s.sentEmail} e-posta, ${s.queuedBanners} mobil ana sayfa kartı).`,
      );
      fetchAll();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Win-Back kampanyası çalıştırılamadı');
    } finally {
      setDispatching(false);
    }
  };

  const handleSendNudge = async () => {
    if (!nudgeTarget) return;
    setNudging(true);
    try {
      const res = await apiClient.post(`/admin/retention/nudge-user/${nudgeTarget.id}`, {
        titleTr: nudgeTitle,
        bodyTr: nudgeBody,
        incentive: nudgeIncentive,
        ctaScreen: nudgeScreen,
        sendPush: nudgePush,
        sendEmail: nudgeEmail,
        showInAppBanner: nudgeBanner,
      });
      message.success(
        `${nudgeTarget.email} kullanıcısına hatırlatma iletildi (Push: ${res.data.pushed ? 'Evet' : 'Token Yok'}, Mobil Kart: ${res.data.bannerQueued ? 'Hazır' : 'Hayır'}).`,
      );
      setNudgeTarget(null);
      fetchAll();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Hatırlatma gönderilemedi');
    } finally {
      setNudging(false);
    }
  };

  const updateTier = (tierId: string, patch: Partial<WinbackTier>) => {
    if (!winback) return;
    setWinback({
      ...winback,
      tiers: winback.tiers.map((t) => (t.id === tierId ? { ...t, ...patch } : t)),
    });
  };

  const handleAddRule = () => {
    if (!winback) return;
    const newRule: WinbackTier = {
      id: `rule_${Date.now()}`,
      triggerType: 'inactivity',
      inactiveDays: 5,
      titleTr: 'Yeni Geri Kazanım Mesajı 🌸',
      bodyTr: 'Kendine zaman ayırmayı unutma. Kadın Atlası’nda bugünkü özetin seni bekliyor!',
      sendPush: true,
      sendEmail: false,
      showInAppBanner: true,
      incentive: 'none',
      ctaScreen: 'home',
      active: true,
    };
    setWinback({ ...winback, tiers: [...winback.tiers, newRule] });
  };

  const handleDeleteRule = (tierId: string) => {
    if (!winback) return;
    setWinback({
      ...winback,
      tiers: winback.tiers.filter((t) => t.id !== tierId),
    });
  };

  const filteredRiskUsers = (funnel?.atRiskUsers || []).filter((u) =>
    riskFilter === 'all' ? true : u.riskReason === riskFilter,
  );

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
            <RiseOutlined style={{ color: '#7C3AED', marginRight: 10 }} />
            Retention Funnel & Win-Back Otomasyonu
          </Title>
          <Text type="secondary">
            DAU/WAU/MAU bağlılık oranlarını, haftalık kohortları ve riskli kullanıcıları takip
            edip otomatik/bireysel geri kazanım kampanyaları yönetin.
          </Text>
        </div>

        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={fetchAll} loading={loading}>
            Yenile
          </Button>
          <Popconfirm
            title="Win-Back ve Onboarding kurtarma kuralları şimdi çalıştırılsın mı?"
            description="Eşiği aşan kullanıcılara Push, E-posta ve Mobil Ana Sayfa Geri Dönüş Kartı tanımlanır."
            onConfirm={handleDispatchNow}
            okText="Çalıştır"
            cancelText="İptal"
          >
            <Button type="primary" icon={<SendOutlined />} loading={dispatching}>
              Şimdi Win-Back Çalıştır
            </Button>
          </Popconfirm>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} md={4}>
          <Card loading={loading} size="small">
            <Statistic
              title="DAU (24 Saat)"
              value={funnel?.activity.dau || 0}
              prefix={<FireOutlined style={{ color: '#10B981' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card loading={loading} size="small">
            <Statistic
              title="WAU (7 Gün)"
              value={funnel?.activity.wau || 0}
              prefix={<TeamOutlined style={{ color: '#3B82F6' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card loading={loading} size="small">
            <Statistic
              title="MAU (30 Gün)"
              value={funnel?.activity.mau || 0}
              prefix={<UserOutlined style={{ color: '#6366F1' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card loading={loading} size="small">
            <Statistic
              title="Stickiness (DAU/MAU)"
              value={funnel?.activity.stickinessPct || 0}
              suffix="%"
              valueStyle={{ color: '#7C3AED' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card loading={loading} size="small">
            <Statistic
              title="7+ Gün İnaktif Riski"
              value={funnel?.activity.inactive7dRisk || 0}
              valueStyle={{ color: '#EF4444' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card loading={loading} size="small">
            <Statistic
              title="Geri Kazanılan"
              value={funnel?.activity.recoveredCount || 0}
              valueStyle={{ color: '#EC4899' }}
              prefix={<HeartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Tabs
        defaultActiveKey="funnel"
        items={[
          {
            key: 'funnel',
            label: 'Huni & Haftalık Kohortlar',
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size={20}>
                <Card title="8 Adımlı Kullanıcı Dönüşüm Hunisi" loading={loading}>
                  <Space direction="vertical" style={{ width: '100%' }} size={14}>
                    {(funnel?.steps || []).map((step, idx) => (
                      <div key={step.key}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: 4,
                            flexWrap: 'wrap',
                            gap: 8,
                          }}
                        >
                          <Text strong>
                            {idx + 1}. {step.label}
                          </Text>
                          <Space size={6}>
                            <Text strong>{step.count} kullanıcı</Text>
                            <Tag color={step.ratePct >= 50 ? 'green' : step.ratePct >= 20 ? 'blue' : 'orange'}>
                              Toplam %{step.ratePct}
                            </Tag>
                            {idx > 0 && (
                              <Tag color="purple">Adım Geçişi %{step.stepRetentionPct}</Tag>
                            )}
                          </Space>
                        </div>
                        <Progress
                          percent={step.ratePct}
                          showInfo={false}
                          strokeColor={idx === 7 ? '#F59E0B' : '#7C3AED'}
                        />
                      </div>
                    ))}
                  </Space>
                </Card>

                <Card title="Son 4 Hafta Kayıt Kohortları" loading={loading}>
                  <Table
                    rowKey="label"
                    dataSource={funnel?.cohorts || []}
                    pagination={false}
                    columns={[
                      { title: 'Kayıt Dönemi', dataIndex: 'label' },
                      { title: 'Kayıt Sayısı', dataIndex: 'registered' },
                      { title: 'Döngü Başlatan', dataIndex: 'withCycle' },
                      { title: 'Son 7 Günde Aktif', dataIndex: 'activeLast7d' },
                      { title: 'Premium', dataIndex: 'premium' },
                      {
                        title: '7 Günlük Tutma',
                        dataIndex: 'retentionPct',
                        render: (pct: number) => (
                          <Tag color={pct >= 50 ? 'green' : pct >= 20 ? 'blue' : 'red'}>
                            %{pct}
                          </Tag>
                        ),
                      },
                    ]}
                  />
                </Card>
              </Space>
            ),
          },
          {
            key: 'risk',
            label: `Churn Riskindeki Kullanıcılar (${funnel?.atRiskUsers?.length || 0})`,
            children: (
              <Card
                title="İnaktif veya Onboarding'i Yarım Bırakan Kullanıcılar"
                extra={
                  <Select
                    value={riskFilter}
                    onChange={setRiskFilter}
                    style={{ width: 220 }}
                    options={[
                      { value: 'all', label: 'Tüm Riskli Kullanıcılar' },
                      { value: 'inactivity', label: '3+ Gündür İnaktif' },
                      { value: 'onboarding_dropoff', label: 'Döngü Kaydı Eksik' },
                    ]}
                  />
                }
              >
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={filteredRiskUsers}
                  pagination={{ pageSize: 10 }}
                  locale={{ emptyText: 'Şu anda risk grubunda kullanıcı bulunmuyor' }}
                  columns={[
                    {
                      title: 'Kullanıcı',
                      key: 'user',
                      render: (_: any, r: AtRiskUser) => (
                        <div>
                          <Text strong>{r.displayName}</Text>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>{r.email}</div>
                        </div>
                      ),
                    },
                    {
                      title: 'Risk Nedeni',
                      dataIndex: 'riskReason',
                      render: (reason: AtRiskUser['riskReason']) => (
                        <Tag color={reason === 'inactivity' ? 'red' : 'purple'}>
                          {reason === 'inactivity' ? 'Uygulamaya Girmedi' : 'İlk Döngü Yok'}
                        </Tag>
                      ),
                    },
                    {
                      title: 'İnaktif Gün',
                      dataIndex: 'inactiveDays',
                      render: (d: number) => <Tag color={d >= 7 ? 'volcano' : 'orange'}>{d} gün</Tag>,
                    },
                    {
                      title: 'Plan / Döngü',
                      key: 'meta',
                      render: (_: any, r: AtRiskUser) => (
                        <Space>
                          <Tag>{r.subscriptionStatus}</Tag>
                          <Text type="secondary">{r.cycleCount} döngü</Text>
                        </Space>
                      ),
                    },
                    {
                      title: 'Kanallar',
                      key: 'channels',
                      render: (_: any, r: AtRiskUser) => (
                        <Space size={4}>
                          <Tag color={r.hasPushToken ? 'green' : 'default'}>
                            {r.hasPushToken ? 'Push Hazır' : 'Token Yok'}
                          </Tag>
                          {r.hasPendingBanner && <Tag color="pink">Mobil Kart Bekliyor</Tag>}
                        </Space>
                      ),
                    },
                    {
                      title: 'Aksiyon',
                      key: 'action',
                      render: (_: any, r: AtRiskUser) => (
                        <Button
                          size="small"
                          type="primary"
                          icon={<GiftOutlined />}
                          onClick={() => setNudgeTarget(r)}
                        >
                          Hatırlat / Ödül Ver
                        </Button>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'rules',
            label: 'Otomasyon Kuralları',
            children: winback && (
              <Card
                title="Çok Kanallı Win-Back & Onboarding Kurtarma Kuralları"
                extra={
                  <Space wrap>
                    <Text>Günlük 11:00 Cron:</Text>
                    <Switch
                      checked={winback.enabled}
                      checkedChildren="Açık"
                      unCheckedChildren="Kapalı"
                      loading={saving}
                      onChange={(enabled) =>
                        saveWinback(
                          { ...winback, enabled },
                          enabled ? 'Win-back otomasyonu açıldı' : 'Win-back otomasyonu duraklatıldı',
                        )
                      }
                    />
                    <Button icon={<PlusOutlined />} onClick={handleAddRule}>
                      Yeni Kural Ekle
                    </Button>
                    <Button
                      type="primary"
                      loading={saving}
                      icon={<CheckCircleOutlined />}
                      onClick={() => saveWinback(winback, 'Otomasyon kuralları kaydedildi')}
                    >
                      Tümünü Kaydet
                    </Button>
                  </Space>
                }
              >
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="Push + E-posta + Mobil Ana Sayfa Geri Dönüş Kartı"
                  description="Expo Push tokenı olmayan cihazlarda bile 'Mobil Kart' seçeneği sayesinde kullanıcı uygulamayı açtığında kişiselleştirilmiş dönüş teklifi (+10 NOVA Mesaj veya 7 Gün Premium) ana sayfada görünür."
                />

                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                  {winback.tiers.map((tier) => (
                    <Card
                      key={tier.id}
                      size="small"
                      type="inner"
                      title={
                        <Space>
                          <Tag color={TRIGGER_LABELS[tier.triggerType]?.color || 'blue'}>
                            {TRIGGER_LABELS[tier.triggerType]?.label || tier.triggerType}
                          </Tag>
                          <Text type="secondary">{tier.inactiveDays} gün eşiği</Text>
                        </Space>
                      }
                      extra={
                        <Space>
                          <Switch
                            size="small"
                            checked={tier.active}
                            checkedChildren="Aktif"
                            unCheckedChildren="Pasif"
                            onChange={(active) => updateTier(tier.id, { active })}
                          />
                          <Popconfirm
                            title="Bu kural silinsin mi?"
                            onConfirm={() => handleDeleteRule(tier.id)}
                            okText="Sil"
                            cancelText="İptal"
                          >
                            <Button size="small" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        </Space>
                      }
                    >
                      <Row gutter={[12, 12]}>
                        <Col xs={24} md={5}>
                          <Text strong style={{ display: 'block', marginBottom: 4 }}>
                            Tetikleyici & Gün
                          </Text>
                          <Space direction="vertical" style={{ width: '100%' }} size={6}>
                            <Select
                              style={{ width: '100%' }}
                              value={tier.triggerType}
                              onChange={(val) => updateTier(tier.id, { triggerType: val })}
                              options={Object.entries(TRIGGER_LABELS).map(([k, v]) => ({
                                value: k,
                                label: v.label,
                              }))}
                            />
                            <InputNumber
                              min={1}
                              max={90}
                              addonAfter="gün"
                              style={{ width: '100%' }}
                              value={tier.inactiveDays}
                              onChange={(v) => updateTier(tier.id, { inactiveDays: Number(v) || 3 })}
                            />
                          </Space>
                        </Col>

                        <Col xs={24} md={8}>
                          <Text strong style={{ display: 'block', marginBottom: 4 }}>
                            Başlık & Mesaj
                          </Text>
                          <Space direction="vertical" style={{ width: '100%' }} size={6}>
                            <Input
                              value={tier.titleTr}
                              onChange={(e) => updateTier(tier.id, { titleTr: e.target.value })}
                              placeholder="Bildirim / Kart başlığı"
                            />
                            <Input.TextArea
                              rows={2}
                              value={tier.bodyTr}
                              onChange={(e) => updateTier(tier.id, { bodyTr: e.target.value })}
                              placeholder="Mesaj içeriği"
                            />
                          </Space>
                        </Col>

                        <Col xs={24} md={6}>
                          <Text strong style={{ display: 'block', marginBottom: 4 }}>
                            Teşvik & Hedef Ekran
                          </Text>
                          <Space direction="vertical" style={{ width: '100%' }} size={6}>
                            <Select
                              style={{ width: '100%' }}
                              value={tier.incentive}
                              onChange={(val) => updateTier(tier.id, { incentive: val })}
                              options={INCENTIVE_OPTIONS}
                            />
                            <Select
                              style={{ width: '100%' }}
                              value={tier.ctaScreen}
                              onChange={(val) => updateTier(tier.id, { ctaScreen: val })}
                              options={CTA_OPTIONS}
                            />
                          </Space>
                        </Col>

                        <Col xs={24} md={5}>
                          <Text strong style={{ display: 'block', marginBottom: 4 }}>
                            Teslim Kanalları
                          </Text>
                          <Space direction="vertical" size={6}>
                            <Space>
                              <Switch
                                size="small"
                                checked={tier.sendPush}
                                onChange={(sendPush) => updateTier(tier.id, { sendPush })}
                              />
                              <Text><BellOutlined /> Push</Text>
                            </Space>
                            <Space>
                              <Switch
                                size="small"
                                checked={tier.sendEmail}
                                onChange={(sendEmail) => updateTier(tier.id, { sendEmail })}
                              />
                              <Text>E-posta</Text>
                            </Space>
                            <Space>
                              <Switch
                                size="small"
                                checked={tier.showInAppBanner}
                                onChange={(showInAppBanner) =>
                                  updateTier(tier.id, { showInAppBanner })
                                }
                              />
                              <Text>Mobil Ana Sayfa Kartı</Text>
                            </Space>
                          </Space>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                </Space>
              </Card>
            ),
          },
          {
            key: 'logs',
            label: 'Kampanya Geçmişi',
            children: (
              <Card title="Son Win-Back Gönderim Kayıtları">
                <Table
                  rowKey={(r) => `${r.timestamp}-${r.trigger}`}
                  dataSource={logs}
                  pagination={{ pageSize: 8 }}
                  locale={{ emptyText: 'Henüz win-back gönderimi yapılmadı' }}
                  columns={[
                    {
                      title: 'Tarih',
                      dataIndex: 'timestamp',
                      render: (v: string) => dayjs(v).format('DD.MM.YYYY HH:mm'),
                    },
                    {
                      title: 'Tetikleyici',
                      dataIndex: 'trigger',
                      render: (v: string) => (
                        <Tag color={v === 'manual' ? 'purple' : 'blue'}>
                          {v === 'manual' ? 'Manuel' : 'Otomatik Cron'}
                        </Tag>
                      ),
                    },
                    { title: 'Hedeflenen', dataIndex: 'targetedUsers' },
                    {
                      title: 'Push',
                      dataIndex: 'sentPush',
                      render: (v: number) => <Tag color="green">{v}</Tag>,
                    },
                    {
                      title: 'E-posta',
                      dataIndex: 'sentEmail',
                      render: (v: number) => <Tag color="cyan">{v}</Tag>,
                    },
                    {
                      title: 'Mobil Kart',
                      dataIndex: 'queuedBanners',
                      render: (v: number) => <Tag color="magenta">{v || 0}</Tag>,
                    },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />

      <Modal
        title={`Özel Geri Kazanım / Ödül Gönder: ${nudgeTarget?.email || ''}`}
        open={Boolean(nudgeTarget)}
        onCancel={() => setNudgeTarget(null)}
        onOk={handleSendNudge}
        confirmLoading={nudging}
        okText="Gönder"
        cancelText="İptal"
        width={580}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Input
            placeholder="Başlık"
            value={nudgeTitle}
            onChange={(e) => setNudgeTitle(e.target.value)}
          />
          <Input.TextArea
            rows={3}
            placeholder="Mesaj içeriği"
            value={nudgeBody}
            onChange={(e) => setNudgeBody(e.target.value)}
          />
          <Row gutter={12}>
            <Col span={12}>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>Teşvik / Ödül</Text>
              <Select
                style={{ width: '100%' }}
                value={nudgeIncentive}
                onChange={setNudgeIncentive}
                options={INCENTIVE_OPTIONS}
              />
            </Col>
            <Col span={12}>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>Yönlendirilecek Ekran</Text>
              <Select
                style={{ width: '100%' }}
                value={nudgeScreen}
                onChange={setNudgeScreen}
                options={CTA_OPTIONS}
              />
            </Col>
          </Row>
          <Space wrap>
            <Switch size="small" checked={nudgePush} onChange={setNudgePush} />
            <Text>Push</Text>
            <Switch size="small" checked={nudgeEmail} onChange={setNudgeEmail} />
            <Text>E-posta</Text>
            <Switch size="small" checked={nudgeBanner} onChange={setNudgeBanner} />
            <Text>Mobil Ana Sayfa Kartı</Text>
          </Space>
        </Space>
      </Modal>
    </div>
  );
}
