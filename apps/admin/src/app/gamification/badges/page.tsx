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
  Switch,
  Modal,
  Form,
  InputNumber,
  Popconfirm,
  Tabs,
  Typography,
  Badge,
  message,
} from 'antd';
import {
  TrophyOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  GiftOutlined,
  FireOutlined,
  SearchOutlined,
  SyncOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import { apiClient } from '@/providers/dataProvider';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CATEGORY_OPTIONS = [
  { value: 'STREAK', label: 'Seri (Streak)', color: 'orange' },
  { value: 'DATA_ENTRY', label: 'Veri Girişi', color: 'blue' },
  { value: 'WELLNESS', label: 'Wellness & Su', color: 'cyan' },
  { value: 'COMMUNITY', label: 'Topluluk', color: 'magenta' },
  { value: 'MILESTONE', label: 'Seviye & Dönüm Noktası', color: 'purple' },
  { value: 'SPECIAL', label: 'Özel Rozet', color: 'gold' },
];

const RARITY_OPTIONS = [
  { value: 'COMMON', label: 'Yaygın', color: 'default' },
  { value: 'RARE', label: 'Nadir', color: 'blue' },
  { value: 'EPIC', label: 'Epik', color: 'purple' },
  { value: 'LEGENDARY', label: 'Efsanevi', color: 'gold' },
];

const REQUIREMENT_TYPES = [
  { value: 'streak', label: 'Günlük Seri (Gün)' },
  { value: 'data_entry', label: 'Toplam Veri Girişi (Adet)' },
  { value: 'water_logs', label: 'Su Takibi Kaydı (Adet)' },
  { value: 'wellness', label: 'Wellness Kaydı (Adet)' },
  { value: 'symptoms', label: 'Semptom Kaydı (Adet)' },
  { value: 'cycles', label: 'Döngü Kaydı (Adet)' },
  { value: 'community_answers', label: 'Topluluk Cevabı (Adet)' },
  { value: 'community_questions', label: 'Topluluk Sorusu (Adet)' },
  { value: 'level', label: 'Kullanıcı Seviyesi (Sv.)' },
  { value: 'manual', label: 'Manuel (Admin Verir)' },
];

const EMOJI_PRESETS = ['🏆', '🔥', '⭐', '💎', '🌱', '💧', '💪', '📊', '🎯', '🔍', '🤝', '🌟', '✨', '👑', '🌸', '🧘'];

function formatRequirement(req: any): string {
  if (!req || !req.type) return '-';
  const val = req.days ?? req.count ?? req.level ?? 1;
  switch (req.type) {
    case 'streak':
      return `${val} gün seri`;
    case 'data_entry':
      return `${val} veri girişi`;
    case 'water_logs':
      return `${val} su kaydı`;
    case 'wellness':
      return `${val} wellness kaydı`;
    case 'symptoms':
      return `${val} semptom`;
    case 'cycles':
      return `${val} döngü`;
    case 'community_answers':
      return `${val} cevap`;
    case 'community_questions':
      return `${val} soru`;
    case 'level':
      return `Seviye ${val}`;
    case 'manual':
      return 'Admin tarafından verilir';
    default:
      return `${req.type}: ${val}`;
  }
}

export default function BadgesAdminPage() {
  const [overview, setOverview] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [rarityFilter, setRarityFilter] = useState('ALL');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');

  // Badge create/edit modal
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<any>(null);
  const [savingBadge, setSavingBadge] = useState(false);
  const [form] = Form.useForm();

  // Award badge modal
  const [awardModalOpen, setAwardModalOpen] = useState(false);
  const [awardTargetBadge, setAwardTargetBadge] = useState<any>(null);
  const [awardUserId, setAwardUserId] = useState<string | undefined>(undefined);
  const [awarding, setAwarding] = useState(false);

  // Edit user gamification modal
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [savingUser, setSavingUser] = useState(false);
  const [userForm] = Form.useForm();

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, badgesRes] = await Promise.all([
        apiClient.get('/gamification/admin/overview'),
        apiClient.get('/gamification/admin/achievements', {
          params: {
            category: categoryFilter,
            rarity: rarityFilter,
            isActive: activeFilter === 'ALL' ? undefined : activeFilter,
            search: search || undefined,
          },
        }),
      ]);
      setOverview(overviewRes.data);
      setBadges(badgesRes.data?.data || []);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Rozet verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, rarityFilter, activeFilter, search]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await apiClient.get('/gamification/admin/users', {
        params: { search: userSearch || undefined },
      });
      setUsers(res.data?.data || []);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Kullanıcı ilerlemeleri yüklenemedi');
    } finally {
      setUsersLoading(false);
    }
  }, [userSearch]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openCreateModal = () => {
    setEditingBadge(null);
    form.resetFields();
    form.setFieldsValue({
      iconEmoji: '🏆',
      color: '#8B5CF6',
      category: 'SPECIAL',
      rarity: 'COMMON',
      requirementType: 'data_entry',
      requirementValue: 10,
      points: 50,
      isActive: true,
      sortOrder: badges.length + 1,
    });
    setBadgeModalOpen(true);
  };

  const openEditModal = (record: any) => {
    setEditingBadge(record);
    const req = record.requirementJson || {};
    form.setFieldsValue({
      key: record.key,
      nameTr: record.nameTr,
      nameEn: record.nameEn,
      descriptionTr: record.descriptionTr,
      descriptionEn: record.descriptionEn,
      iconEmoji: record.iconEmoji || '🏆',
      color: record.color || '#8B5CF6',
      category: record.category,
      rarity: record.rarity,
      requirementType: req.type || 'data_entry',
      requirementValue: req.days ?? req.count ?? req.level ?? 1,
      points: record.points,
      isActive: record.isActive,
      sortOrder: record.sortOrder ?? 0,
    });
    setBadgeModalOpen(true);
  };

  const handleSaveBadge = async (values: any) => {
    setSavingBadge(true);
    try {
      if (editingBadge) {
        await apiClient.patch(
          `/gamification/admin/achievements/${editingBadge.id}`,
          values,
        );
        message.success('Rozet güncellendi');
      } else {
        await apiClient.post('/gamification/admin/achievements', values);
        message.success('Yeni rozet oluşturuldu');
      }
      setBadgeModalOpen(false);
      loadAll();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Rozet kaydedilemedi');
    } finally {
      setSavingBadge(false);
    }
  };

  const handleToggleActive = async (record: any, checked: boolean) => {
    try {
      await apiClient.patch(`/gamification/admin/achievements/${record.id}`, {
        isActive: checked,
      });
      message.success(checked ? 'Rozet aktifleştirildi' : 'Rozet pasife alındı');
      loadAll();
    } catch {
      message.error('Durum güncellenemedi');
    }
  };

  const handleDeleteBadge = async (id: string) => {
    try {
      await apiClient.delete(`/gamification/admin/achievements/${id}`);
      message.success('Rozet silindi');
      loadAll();
    } catch {
      message.error('Rozet silinemedi');
    }
  };

  const handleSeedDefaults = async () => {
    try {
      const res = await apiClient.post('/gamification/admin/achievements/seed', {});
      message.success(`${res.data?.count || 0} varsayılan rozet senkronize edildi`);
      loadAll();
    } catch {
      message.error('Varsayılan rozetler yüklenemedi');
    }
  };

  const openAwardModal = (badge?: any, presetUserId?: string) => {
    setAwardTargetBadge(badge || badges[0] || null);
    setAwardUserId(presetUserId);
    setAwardModalOpen(true);
  };

  const handleAwardBadge = async () => {
    if (!awardTargetBadge?.id || !awardUserId) {
      message.warning('Rozet ve kullanıcı seçin');
      return;
    }
    setAwarding(true);
    try {
      const res = await apiClient.post(
        `/gamification/admin/achievements/${awardTargetBadge.id}/award`,
        { userId: awardUserId },
      );
      if (res.data?.alreadyAwarded) {
        message.info('Kullanıcı bu rozete zaten sahip');
      } else {
        message.success('Rozet ve XP kullanıcıya verildi');
      }
      setAwardModalOpen(false);
      loadAll();
      loadUsers();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Rozet verilemedi');
    } finally {
      setAwarding(false);
    }
  };

  const openUserProgressModal = (record: any) => {
    setEditingUser(record);
    userForm.setFieldsValue({
      addXp: 0,
      currentStreak: record.currentStreak,
      longestStreak: record.longestStreak,
      streakFreezeLimit: record.streakFreezeLimit,
      recheckAchievements: true,
      generateInsights: false,
    });
    setUserModalOpen(true);
  };

  const handleSaveUserProgress = async (values: any) => {
    if (!editingUser) return;
    setSavingUser(true);
    try {
      await apiClient.patch(`/gamification/admin/users/${editingUser.userId}`, values);
      message.success('Kullanıcı ilerlemesi güncellendi');
      setUserModalOpen(false);
      loadUsers();
      loadAll();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Kullanıcı güncellenemedi');
    } finally {
      setSavingUser(false);
    }
  };

  const badgeColumns = [
    {
      title: 'Rozet',
      key: 'badge',
      render: (_: any, r: any) => (
        <Space size={12}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: r.color ? `${r.color}22` : '#f3e8ff',
              border: `1px solid ${r.color || '#8B5CF6'}44`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            {r.iconEmoji || '🏆'}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{r.nameTr}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {r.key}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Açıklama',
      dataIndex: 'descriptionTr',
      key: 'descriptionTr',
      ellipsis: true,
      width: 240,
    },
    {
      title: 'Kategori',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => {
        const meta = CATEGORY_OPTIONS.find((c) => c.value === cat);
        return <Tag color={meta?.color || 'default'}>{meta?.label || cat}</Tag>;
      },
    },
    {
      title: 'Nadirlik',
      dataIndex: 'rarity',
      key: 'rarity',
      render: (rarity: string) => {
        const meta = RARITY_OPTIONS.find((c) => c.value === rarity);
        return <Tag color={meta?.color || 'default'}>{meta?.label || rarity}</Tag>;
      },
    },
    {
      title: 'Koşul',
      dataIndex: 'requirementJson',
      key: 'requirementJson',
      render: (req: any) => <Tag>{formatRequirement(req)}</Tag>,
    },
    {
      title: 'XP',
      dataIndex: 'points',
      key: 'points',
      render: (pts: number) => <Tag color="purple">+{pts} XP</Tag>,
    },
    {
      title: 'Kazanan',
      dataIndex: 'earnedCount',
      key: 'earnedCount',
      render: (cnt: number) => <Badge count={cnt} showZero color="#52c41a" />,
    },
    {
      title: 'Aktif',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (val: boolean, record: any) => (
        <Switch size="small" checked={val} onChange={(c) => handleToggleActive(record, c)} />
      ),
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            size="small"
            icon={<GiftOutlined />}
            onClick={() => openAwardModal(record)}
            title="Kullanıcıya Rozet Ver"
          />
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          <Popconfirm
            title="Bu rozeti silmek istediğinize emin misiniz?"
            onConfirm={() => handleDeleteBadge(record.id)}
            okText="Sil"
            cancelText="İptal"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const userColumns = [
    {
      title: 'Kullanıcı',
      key: 'user',
      render: (_: any, r: any) => (
        <div>
          <div style={{ fontWeight: 600 }}>
            {r.displayName}{' '}
            {r.isPremium && (
              <Tag color="gold" style={{ marginLeft: 4 }}>
                <CrownOutlined /> Premium
              </Tag>
            )}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {r.email}
          </Text>
        </div>
      ),
    },
    {
      title: 'Seviye & XP',
      key: 'level',
      render: (_: any, r: any) => (
        <Space>
          <Tag color="purple">Sv. {r.level}</Tag>
          <Text strong>{r.totalXp} XP</Text>
        </Space>
      ),
    },
    {
      title: 'Seri (Streak)',
      key: 'streak',
      render: (_: any, r: any) => (
        <Space>
          <Tag color="orange" icon={<FireOutlined />}>
            {r.currentStreak} gün
          </Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>
            (Rekor: {r.longestStreak})
          </Text>
        </Space>
      ),
    },
    {
      title: 'Kazanılan Rozet',
      dataIndex: 'completedBadges',
      key: 'completedBadges',
      render: (cnt: number) => <Tag color="green">{cnt} Rozet</Tag>,
    },
    {
      title: 'İçgörüler',
      dataIndex: 'insightsCount',
      key: 'insightsCount',
      render: (cnt: number) => <Tag color="blue">{cnt} İçgörü</Tag>,
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_: any, r: any) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => openUserProgressModal(r)}>
            Yönet
          </Button>
          <Button
            size="small"
            type="primary"
            ghost
            icon={<GiftOutlined />}
            onClick={() => openAwardModal(undefined, r.userId)}
          >
            Rozet Ver
          </Button>
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
            <TrophyOutlined style={{ color: '#faad14', marginRight: 8 }} />
            Başarımlar, Rozetler & İlerleme Yönetimi
          </Title>
          <Text type="secondary">
            Rozet kurallarını yönetin, kullanıcılara özel rozet/XP tanımlayın ve ilerlemeleri takip edin.
          </Text>
        </div>
        <Space>
          <Button icon={<SyncOutlined />} onClick={handleSeedDefaults}>
            Varsayılanları Yükle
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => { loadAll(); loadUsers(); }}>
            Yenile
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Yeni Rozet Ekle
          </Button>
        </Space>
      </div>

      {/* KPI Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless">
            <Statistic
              title="Toplam Rozet"
              value={overview?.totalAchievements ?? 0}
              suffix={`/ ${overview?.activeAchievements ?? 0} aktif`}
              prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless">
            <Statistic
              title="Toplam Kazanılan Rozet"
              value={overview?.totalUnlocks ?? 0}
              prefix={<GiftOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless">
            <Statistic
              title="Ortalama Seviye"
              value={overview?.avgLevel ?? 1}
              suffix={`(Max ${overview?.maxLevel ?? 1})`}
              prefix={<CrownOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless">
            <Statistic
              title="En Uzun Seri"
              value={overview?.maxStreak ?? 0}
              suffix="gün"
              prefix={<FireOutlined style={{ color: '#fa541c' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card variant="borderless">
        <Tabs
          defaultActiveKey="badges"
          items={[
            {
              key: 'badges',
              label: `Rozet Kataloğu (${badges.length})`,
              children: (
                <>
                  <Space wrap style={{ marginBottom: 16 }}>
                    <Input
                      placeholder="Rozet adı, key veya açıklama ara..."
                      prefix={<SearchOutlined />}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{ width: 250 }}
                      allowClear
                    />
                    <Select
                      value={categoryFilter}
                      onChange={setCategoryFilter}
                      style={{ width: 180 }}
                      options={[
                        { value: 'ALL', label: 'Tüm Kategoriler' },
                        ...CATEGORY_OPTIONS.map((c) => ({ value: c.value, label: c.label })),
                      ]}
                    />
                    <Select
                      value={rarityFilter}
                      onChange={setRarityFilter}
                      style={{ width: 150 }}
                      options={[
                        { value: 'ALL', label: 'Tüm Nadirlikler' },
                        ...RARITY_OPTIONS.map((r) => ({ value: r.value, label: r.label })),
                      ]}
                    />
                    <Select
                      value={activeFilter}
                      onChange={setActiveFilter}
                      style={{ width: 140 }}
                      options={[
                        { value: 'ALL', label: 'Tüm Durumlar' },
                        { value: 'true', label: 'Aktif' },
                        { value: 'false', label: 'Pasif' },
                      ]}
                    />
                  </Space>

                  <Table
                    rowKey="id"
                    columns={badgeColumns}
                    dataSource={badges}
                    loading={loading}
                    pagination={{ pageSize: 12 }}
                    scroll={{ x: 960 }}
                  />
                </>
              ),
            },
            {
              key: 'users',
              label: `Kullanıcı İlerlemesi (${users.length})`,
              children: (
                <>
                  <Space style={{ marginBottom: 16 }}>
                    <Input
                      placeholder="E-posta, kullanıcı adı veya isim ara..."
                      prefix={<SearchOutlined />}
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      style={{ width: 280 }}
                      allowClear
                    />
                  </Space>
                  <Table
                    rowKey="userId"
                    columns={userColumns}
                    dataSource={users}
                    loading={usersLoading}
                    pagination={{ pageSize: 12 }}
                  />
                </>
              ),
            },
          ]}
        />
      </Card>

      {/* Create/Edit Badge Modal */}
      <Modal
        title={editingBadge ? 'Rozet Düzenle' : 'Yeni Rozet Oluştur'}
        open={badgeModalOpen}
        onCancel={() => setBadgeModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={savingBadge}
        width={680}
        okText="Kaydet"
        cancelText="İptal"
      >
        <Form form={form} layout="vertical" onFinish={handleSaveBadge}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label="Benzersiz Anahtar (key)"
                name="key"
                rules={[{ required: true, message: 'Anahtar zorunludur' }]}
              >
                <Input placeholder="ornek_rozet" disabled={!!editingBadge} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="İkon Emoji" name="iconEmoji">
                <Select
                  showSearch
                  options={EMOJI_PRESETS.map((e) => ({ value: e, label: `${e} ${e}` }))}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Sıra" name="sortOrder">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label="Rozet Adı (TR)"
                name="nameTr"
                rules={[{ required: true, message: 'Türkçe ad zorunludur' }]}
              >
                <Input placeholder="Örn: Su Şampiyonu" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Rozet Adı (EN)" name="nameEn">
                <Input placeholder="Hydration Champion" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Açıklama (TR)"
            name="descriptionTr"
            rules={[{ required: true, message: 'Açıklama zorunludur' }]}
          >
            <TextArea rows={2} placeholder="Kullanıcıya gösterilecek kazanım açıklaması" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={8}>
              <Form.Item label="Kategori" name="category">
                <Select options={CATEGORY_OPTIONS.map((c) => ({ value: c.value, label: c.label }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Nadirlik" name="rarity">
                <Select options={RARITY_OPTIONS.map((r) => ({ value: r.value, label: r.label }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Ödül XP" name="points">
                <InputNumber min={0} step={10} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Kazanım Koşul Tipi" name="requirementType">
                <Select options={REQUIREMENT_TYPES} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Hedef Değer" name="requirementValue">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Aktif mi?" name="isActive" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Award Badge Modal */}
      <Modal
        title="Kullanıcıya Manuel Rozet Ver"
        open={awardModalOpen}
        onCancel={() => setAwardModalOpen(false)}
        onOk={handleAwardBadge}
        confirmLoading={awarding}
        okText="Rozeti Ver"
        cancelText="İptal"
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong>Rozet</Text>
            <Select
              style={{ width: '100%', marginTop: 6 }}
              value={awardTargetBadge?.id}
              onChange={(id) => setAwardTargetBadge(badges.find((b) => b.id === id))}
              options={badges.map((b) => ({
                value: b.id,
                label: `${b.iconEmoji || '🏆'} ${b.nameTr} (+${b.points} XP)`,
              }))}
            />
          </div>
          <div>
            <Text strong>Kullanıcı</Text>
            <Select
              showSearch
              optionFilterProp="label"
              style={{ width: '100%', marginTop: 6 }}
              placeholder="Kullanıcı seçin"
              value={awardUserId}
              onChange={setAwardUserId}
              options={users.map((u) => ({
                value: u.userId,
                label: `${u.displayName} (${u.email})`,
              }))}
            />
          </div>
        </Space>
      </Modal>

      {/* Edit User Gamification Progress Modal */}
      <Modal
        title={`Kullanıcı İlerlemesi: ${editingUser?.displayName || ''}`}
        open={userModalOpen}
        onCancel={() => setUserModalOpen(false)}
        onOk={() => userForm.submit()}
        confirmLoading={savingUser}
        okText="Uygula"
        cancelText="İptal"
      >
        <Form form={userForm} layout="vertical" onFinish={handleSaveUserProgress}>
          <Form.Item label="Ek XP Ekle (+ veya -)" name="addXp">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item label="Güncel Seri" name="currentStreak">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="En Uzun Seri" name="longestStreak">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Seri Koruma Hakkı" name="streakFreezeLimit">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Rozetleri Yeniden Kontrol Et" name="recheckAchievements" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Yeni İçgörü Üret" name="generateInsights" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
