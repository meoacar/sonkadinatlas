'use client';

import {
  Card,
  Col,
  Row,
  Statistic,
  Table,
  Tag,
  Button,
  Select,
  DatePicker,
  Space,
  Input,
  Tooltip,
  Badge,
  Empty,
  Alert,
  message,
} from 'antd';
import type { TablePaginationConfig } from 'antd';
import {
  UserOutlined,
  CrownOutlined,
  FireOutlined,
  ClockCircleOutlined,
  HeartOutlined,
  CalendarOutlined,
  FilterOutlined,
  MailOutlined,
  BellOutlined,
  DownloadOutlined,
  SearchOutlined,
  RobotOutlined,
  ReloadOutlined,
  CheckSquareOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import { apiClient } from '@/providers/dataProvider';
import { BulkSendModal, type BulkSendMode } from '@/components/BulkSendModal';

const { RangePicker } = DatePicker;

type ActivityPreset =
  | 'ACTIVE_7'
  | 'ACTIVE_30'
  | 'INACTIVE_7'
  | 'INACTIVE_14'
  | 'INACTIVE_30'
  | undefined;

type CycleFilterMode = 'ACTIVE_ONLY' | 'NO_ACTIVE' | 'LOGGED_ANY' | 'NEVER_LOGGED' | undefined;

interface SegmentState {
  search: string;
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'ALL';
  subscriptionStatus: string[];
  subscriptionTier: string[];
  isPregnant: boolean | undefined;
  cycleMode: CycleFilterMode;
  hasUsedNova: boolean | undefined;
  activityPreset: ActivityPreset;
  dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
}

const DEFAULT_FILTER_STATE: SegmentState = {
  search: '',
  accountStatus: 'ACTIVE',
  subscriptionStatus: [],
  subscriptionTier: [],
  isPregnant: undefined,
  cycleMode: undefined,
  hasUsedNova: undefined,
  activityPreset: undefined,
  dateRange: null,
};

interface PredefinedStats {
  totalUsers: number;
  premiumUsers: number;
  freeUsers: number;
  trialUsers: number;
  churnedUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  pregnantUsers: number;
  cycleTrackingUsers: number;
  novaEngagedUsers: number;
  noCycleUsers: number;
  newUsers: number;
}

interface SegmentBreakdown {
  totalUsers: number;
  premiumUsers: number;
  trialUsers: number;
  freeUsers: number;
  activeLast7Days: number;
  pregnantUsers: number;
  cycleTrackingUsers: number;
  novaUsers: number;
}

export default function UserSegmentationPage() {
  const [statsLoading, setStatsLoading] = useState(true);
  const [queryLoading, setQueryLoading] = useState(false);
  const [selectingAllSegment, setSelectingAllSegment] = useState(false);

  const [predefinedStats, setPredefinedStats] = useState<PredefinedStats | null>(null);
  const [segmentStats, setSegmentStats] = useState<SegmentBreakdown | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'email'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [activePresetKey, setActivePresetKey] = useState<string | null>('all');
  const [bulkModal, setBulkModal] = useState<{ open: boolean; mode: BulkSendMode }>({
    open: false,
    mode: 'notification',
  });

  const [filtersState, setFiltersState] = useState<SegmentState>(DEFAULT_FILTER_STATE);
  const didInitialLoad = useRef(false);

  const buildApiFilters = useCallback((state: SegmentState) => {
    const apiFilters: Record<string, any> = {
      accountStatus: state.accountStatus,
    };

    if (state.search.trim()) {
      apiFilters.search = state.search.trim();
    }
    if (state.subscriptionStatus.length > 0) {
      apiFilters.subscriptionStatus = state.subscriptionStatus;
    }
    if (state.subscriptionTier.length > 0) {
      apiFilters.subscriptionTier = state.subscriptionTier;
    }
    if (state.isPregnant !== undefined) {
      apiFilters.isPregnant = state.isPregnant;
    }

    if (state.cycleMode === 'ACTIVE_ONLY') {
      apiFilters.hasActiveCycle = true;
    } else if (state.cycleMode === 'NO_ACTIVE') {
      apiFilters.hasActiveCycle = false;
    } else if (state.cycleMode === 'LOGGED_ANY') {
      apiFilters.hasLoggedCycle = true;
    } else if (state.cycleMode === 'NEVER_LOGGED') {
      apiFilters.hasLoggedCycle = false;
    }

    if (state.hasUsedNova !== undefined) {
      apiFilters.hasUsedNova = state.hasUsedNova;
    }

    if (state.activityPreset === 'ACTIVE_7') {
      apiFilters.activeDays = 7;
    } else if (state.activityPreset === 'ACTIVE_30') {
      apiFilters.activeDays = 30;
    } else if (state.activityPreset === 'INACTIVE_7') {
      apiFilters.inactiveDays = 7;
    } else if (state.activityPreset === 'INACTIVE_14') {
      apiFilters.inactiveDays = 14;
    } else if (state.activityPreset === 'INACTIVE_30') {
      apiFilters.inactiveDays = 30;
    }

    if (state.dateRange && state.dateRange[0] && state.dateRange[1]) {
      apiFilters.createdAfter = state.dateRange[0].startOf('day').toISOString();
      apiFilters.createdBefore = state.dateRange[1].endOf('day').toISOString();
    }

    return apiFilters;
  }, []);

  const fetchPredefinedStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await apiClient.get('/users/segmentation/predefined');
      setPredefinedStats(res.data);
    } catch (error) {
      console.error('Stats yüklenemedi:', error);
      message.error('Özet segment istatistikleri yüklenemedi');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const runQuery = useCallback(
    async (
      state: SegmentState,
      targetPage = 1,
      targetPageSize = pageSize,
      targetSortBy = sortBy,
      targetSortOrder = sortOrder,
      showToast = false,
    ) => {
      setQueryLoading(true);
      try {
        const apiFilters = buildApiFilters(state);
        const offset = (targetPage - 1) * targetPageSize;
        const res = await apiClient.post('/users/segmentation/query', {
          filters: apiFilters,
          limit: targetPageSize,
          offset,
          sortBy: targetSortBy,
          sortOrder: targetSortOrder,
        });

        setUsers(res.data.users || []);
        setTotalUsers(res.data.stats?.totalUsers ?? 0);
        setSegmentStats(res.data.stats || null);
        setPage(targetPage);
        setPageSize(targetPageSize);
        if (showToast) {
          message.success(`${res.data.stats?.totalUsers ?? 0} kullanıcı listelendi`);
        }
      } catch (error) {
        console.error('Filtreleme hatası:', error);
        message.error('Segment sorgusu başarısız oldu');
      } finally {
        setQueryLoading(false);
      }
    },
    [buildApiFilters, pageSize, sortBy, sortOrder],
  );

  useEffect(() => {
    if (didInitialLoad.current) return;
    didInitialLoad.current = true;
    fetchPredefinedStats();
    runQuery(DEFAULT_FILTER_STATE, 1, 50, 'createdAt', 'desc', false);
  }, [fetchPredefinedStats, runQuery]);

  const applyPreset = (presetKey: string, partialState: Partial<SegmentState>, showToast = true) => {
    const nextState: SegmentState = {
      ...DEFAULT_FILTER_STATE,
      ...partialState,
    };
    setFiltersState(nextState);
    setActivePresetKey(presetKey);
    setSelectedUsers([]);
    runQuery(nextState, 1, pageSize, sortBy, sortOrder, showToast);
  };

  const applyFilters = () => {
    setActivePresetKey('custom');
    setSelectedUsers([]);
    runQuery(filtersState, 1, pageSize, sortBy, sortOrder, true);
  };

  const clearFilters = () => {
    setFiltersState(DEFAULT_FILTER_STATE);
    setActivePresetKey('all');
    setSelectedUsers([]);
    runQuery(DEFAULT_FILTER_STATE, 1, pageSize, 'createdAt', 'desc', false);
  };

  const handleSelectAllSegment = async () => {
    if (totalUsers === 0) return;
    setSelectingAllSegment(true);
    try {
      const apiFilters = buildApiFilters(filtersState);
      const res = await apiClient.post('/users/segmentation/ids', {
        filters: apiFilters,
        maxIds: 5000,
      });
      const ids: string[] = res.data?.userIds || [];
      setSelectedUsers(ids);
      message.success(`Segmentteki ${ids.length} kullanıcının tamamı seçildi`);
    } catch (error) {
      console.error('Toplu seçim hatası:', error);
      message.error('Tüm kullanıcılar seçilemedi');
    } finally {
      setSelectingAllSegment(false);
    }
  };

  const handleExportCsv = async () => {
    if (totalUsers === 0) {
      message.warning('Dışa aktarılacak kullanıcı bulunamadı');
      return;
    }
    try {
      const apiFilters = buildApiFilters(filtersState);
      const res = await apiClient.post('/users/segmentation/query', {
        filters: apiFilters,
        limit: 500,
        offset: 0,
        sortBy,
        sortOrder,
      });
      const rows: any[] = res.data?.users || [];
      if (rows.length === 0) {
        message.warning('Dışa aktarılacak veri yok');
        return;
      }

      const headers = [
        'ID',
        'E-posta',
        'Kullanıcı Adı',
        'İsim',
        'Hesap Durumu',
        'Abonelik',
        'Plan',
        'Hamile',
        'Aktif Döngü',
        'Döngü Sayısı',
        'NOVA Sohbet',
        'Günlük Kayıt',
        'Kayıt Tarihi',
        'Son Aktivite',
      ];
      const escapeCsv = (val: unknown) => {
        const str = val === null || val === undefined ? '' : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      };

      const csvLines = [
        headers.map(escapeCsv).join(','),
        ...rows.map((u) =>
          [
            u.id,
            u.email,
            u.username || '',
            u.displayName,
            u.status,
            u.subscriptionStatus,
            u.subscriptionTier || '',
            u.isPregnant ? 'Evet' : 'Hayır',
            u.hasActiveCycle ? 'Evet' : 'Hayır',
            u.cycleCount,
            u.conversationCount,
            u.dailyLogCount,
            dayjs(u.createdAt).format('YYYY-MM-DD HH:mm'),
            u.lastActive ? dayjs(u.lastActive).format('YYYY-MM-DD HH:mm') : '',
          ]
            .map(escapeCsv)
            .join(','),
        ),
      ];

      const blob = new Blob(['\uFEFF' + csvLines.join('\n')], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kullanici-segmenti-${dayjs().format('YYYY-MM-DD')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      message.success(
        totalUsers > 500
          ? `İlk 500 kullanıcı CSV olarak indirildi (toplam ${totalUsers})`
          : `${rows.length} kullanıcı CSV olarak indirildi`,
      );
    } catch (error) {
      console.error('CSV dışa aktarma hatası:', error);
      message.error('CSV dışa aktarma başarısız');
    }
  };

  const openBulkModal = (mode: BulkSendMode) => {
    if (selectedUsers.length === 0) {
      message.warning('Lütfen önce en az bir kullanıcı seçin');
      return;
    }
    setBulkModal({ open: true, mode });
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: any,
    sorter: any,
  ) => {
    const nextPage = pagination.current || 1;
    const nextSize = pagination.pageSize || pageSize;
    let nextSortBy = sortBy;
    let nextSortOrder = sortOrder;

    if (sorter && sorter.field && ['createdAt', 'updatedAt', 'email'].includes(sorter.field)) {
      nextSortBy = sorter.field;
      nextSortOrder = sorter.order === 'ascend' ? 'asc' : 'desc';
      setSortBy(nextSortBy);
      setSortOrder(nextSortOrder);
    }

    runQuery(filtersState, nextPage, nextSize, nextSortBy, nextSortOrder, false);
  };

  const kpiCards = [
    {
      key: 'all',
      title: 'Toplam Aktif Kullanıcı',
      value: predefinedStats?.totalUsers || 0,
      icon: <UserOutlined style={{ color: '#1890ff' }} />,
      preset: {},
    },
    {
      key: 'premium',
      title: 'Premium Abone',
      value: predefinedStats?.premiumUsers || 0,
      icon: <CrownOutlined style={{ color: '#faad14' }} />,
      preset: { subscriptionStatus: ['ACTIVE'] },
    },
    {
      key: 'trial',
      title: 'Deneme (Trial)',
      value: predefinedStats?.trialUsers || 0,
      icon: <ThunderboltOutlined style={{ color: '#1677ff' }} />,
      preset: { subscriptionStatus: ['TRIAL'] },
    },
    {
      key: 'churned',
      title: 'İptal / Süresi Dolmuş',
      value: predefinedStats?.churnedUsers || 0,
      icon: <ClockCircleOutlined style={{ color: '#eb2f96' }} />,
      preset: { subscriptionStatus: ['EXPIRED', 'CANCELLED'] },
    },
    {
      key: 'active7',
      title: 'Aktif Kullanıcı (7 gün)',
      value: predefinedStats?.activeUsers || 0,
      icon: <FireOutlined style={{ color: '#52c41a' }} />,
      preset: { activityPreset: 'ACTIVE_7' as ActivityPreset },
    },
    {
      key: 'inactive30',
      title: 'Pasif Kullanıcı (30+ gün)',
      value: predefinedStats?.inactiveUsers || 0,
      icon: <ClockCircleOutlined style={{ color: '#f5222d' }} />,
      preset: { activityPreset: 'INACTIVE_30' as ActivityPreset },
    },
    {
      key: 'pregnant',
      title: 'Hamile Kullanıcı',
      value: predefinedStats?.pregnantUsers || 0,
      icon: <HeartOutlined style={{ color: '#ff4d4f' }} />,
      preset: { isPregnant: true },
    },
    {
      key: 'cycle',
      title: 'Aktif Döngü Takibi',
      value: predefinedStats?.cycleTrackingUsers || 0,
      icon: <CalendarOutlined style={{ color: '#722ed1' }} />,
      preset: { cycleMode: 'ACTIVE_ONLY' as CycleFilterMode },
    },
    {
      key: 'nova',
      title: 'NOVA AI Kullanan',
      value: predefinedStats?.novaEngagedUsers || 0,
      icon: <RobotOutlined style={{ color: '#9254de' }} />,
      preset: { hasUsedNova: true },
    },
    {
      key: 'nocycle',
      title: 'Hiç Döngü Girmemiş',
      value: predefinedStats?.noCycleUsers || 0,
      icon: <CalendarOutlined style={{ color: '#8c8c8c' }} />,
      preset: { cycleMode: 'NEVER_LOGGED' as CycleFilterMode },
    },
    {
      key: 'free',
      title: 'Ücretsiz Kullanıcı',
      value: predefinedStats?.freeUsers || 0,
      icon: <UserOutlined style={{ color: '#595959' }} />,
      preset: { subscriptionStatus: ['FREE'] },
    },
    {
      key: 'new7',
      title: 'Yeni Kayıt (Son 7 gün)',
      value: predefinedStats?.newUsers || 0,
      icon: <ClockCircleOutlined style={{ color: '#13c2c2' }} />,
      preset: {
        dateRange: [dayjs().subtract(7, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs],
      },
    },
  ];

  const columns = [
    {
      title: 'Kullanıcı',
      dataIndex: 'email',
      key: 'email',
      sorter: true,
      render: (_: any, record: any) => (
        <div>
          <div style={{ fontWeight: 600 }}>
            {record.displayName}{' '}
            {record.username && (
              <span style={{ color: '#8c8c8c', fontWeight: 400 }}>@{record.username}</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.email}</div>
        </div>
      ),
    },
    {
      title: 'Abonelik',
      dataIndex: 'subscriptionStatus',
      key: 'subscriptionStatus',
      render: (status: string, record: any) => {
        const colors: Record<string, string> = {
          ACTIVE: 'gold',
          FREE: 'default',
          TRIAL: 'blue',
          EXPIRED: 'red',
          CANCELLED: 'volcano',
          GRACE_PERIOD: 'orange',
        };
        return (
          <Space size={4} wrap>
            <Tag color={colors[status] || 'default'}>{status}</Tag>
            {record.subscriptionTier && <Tag color="purple">{record.subscriptionTier}</Tag>}
          </Space>
        );
      },
    },
    {
      title: 'Profil & Takip',
      key: 'tracking',
      render: (_: any, record: any) => (
        <Space size={4} wrap>
          {record.status !== 'ACTIVE' && <Tag color="red">{record.status}</Tag>}
          {record.isPregnant && <Tag color="magenta">Hamile</Tag>}
          {record.hasActiveCycle && <Tag color="purple">Aktif Döngü</Tag>}
          {!record.isPregnant && !record.hasActiveCycle && record.status === 'ACTIVE' && (
            <span style={{ color: '#bfbfbf', fontSize: 12 }}>Standart</span>
          )}
        </Space>
      ),
    },
    {
      title: 'Etkileşim',
      key: 'engagement',
      render: (_: any, record: any) => (
        <div style={{ fontSize: 12, color: '#595959' }}>
          <span>{record.cycleCount} döngü</span>
          {' · '}
          <span>{record.conversationCount} NOVA</span>
          {' · '}
          <span>{record.dailyLogCount} günlük</span>
        </div>
      ),
    },
    {
      title: 'Kayıt Tarihi',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: true,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Son Aktivite',
      dataIndex: 'lastActive',
      key: 'lastActive',
      render: (date: string) =>
        date ? (
          <Tooltip title={dayjs(date).format('DD/MM/YYYY HH:mm')}>
            <span>{dayjs(date).format('DD/MM/YYYY HH:mm')}</span>
          </Tooltip>
        ) : (
          '-'
        ),
    },
    {
      title: 'İşlem',
      key: 'actions',
      width: 90,
      render: (_: any, record: any) => (
        <Link href={`/users/show/${record.id}`}>
          <Button size="small" icon={<EyeOutlined />}>
            Detay
          </Button>
        </Link>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys: selectedUsers,
    onChange: (selectedRowKeys: any) => {
      setSelectedUsers(selectedRowKeys.map(String));
    },
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
            👥 Kullanıcı Segmentasyonu
          </h1>
          <p style={{ color: '#8c8c8c', fontSize: 14, margin: 0 }}>
            Hazır segment kartlarına tıkla veya çoklu filtre ile hedef kitle oluştur; CSV indir ya da
            tüm segmente toplu bildirim / e-posta gönder
          </p>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            fetchPredefinedStats();
            runQuery(filtersState, page, pageSize, sortBy, sortOrder, false);
          }}
          loading={statsLoading || queryLoading}
        >
          Verileri Yenile
        </Button>
      </div>

      {/* Clickable Predefined Segment KPI Cards */}
      <Row gutter={[12, 12]}>
        {kpiCards.map((card) => {
          const isSelected = activePresetKey === card.key;
          return (
            <Col xs={12} sm={8} lg={4} key={card.key}>
              <Card
                hoverable
                size="small"
                onClick={() => applyPreset(card.key, card.preset, true)}
                style={{
                  cursor: 'pointer',
                  borderColor: isSelected ? '#1677ff' : undefined,
                  boxShadow: isSelected ? '0 0 0 2px rgba(22,119,255,0.18)' : undefined,
                  background: isSelected ? 'rgba(22,119,255,0.04)' : undefined,
                }}
              >
                <Statistic
                  title={
                    <span style={{ fontSize: 12 }}>
                      {card.title}
                      {isSelected && (
                        <Badge status="processing" style={{ marginLeft: 6 }} />
                      )}
                    </span>
                  }
                  value={card.value}
                  prefix={card.icon}
                  loading={statsLoading}
                />
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Quick Campaign Scenarios */}
      <Card
        size="small"
        style={{ marginTop: 16 }}
        title={
          <span>
            <ThunderboltOutlined style={{ color: '#faad14', marginRight: 8 }} />
            Hızlı Kampanya & Dönüşüm Senaryoları
          </span>
        }
      >
        <Space wrap>
          <Button
            size="small"
            type={activePresetKey === 'preset_upsell' ? 'primary' : 'default'}
            onClick={() =>
              applyPreset('preset_upsell', {
                subscriptionStatus: ['FREE'],
                activityPreset: 'ACTIVE_7',
                hasUsedNova: true,
              })
            }
          >
            Aktif Ücretsiz + NOVA Kullananlar (Premium Upsell)
          </Button>
          <Button
            size="small"
            type={activePresetKey === 'preset_winback' ? 'primary' : 'default'}
            onClick={() =>
              applyPreset('preset_winback', {
                subscriptionStatus: ['EXPIRED', 'CANCELLED'],
              })
            }
          >
            Eski Premiumlar (Win-Back)
          </Button>
          <Button
            size="small"
            type={activePresetKey === 'preset_dormant14' ? 'primary' : 'default'}
            onClick={() =>
              applyPreset('preset_dormant14', {
                activityPreset: 'INACTIVE_14',
              })
            }
          >
            14+ Gün Pasif Kullanıcılar
          </Button>
          <Button
            size="small"
            type={activePresetKey === 'preset_onboarding' ? 'primary' : 'default'}
            onClick={() =>
              applyPreset('preset_onboarding', {
                cycleMode: 'NEVER_LOGGED',
                hasUsedNova: false,
              })
            }
          >
            Henüz Döngü & NOVA Başlamamışlar
          </Button>
          <Button
            size="small"
            type={activePresetKey === 'preset_annual' ? 'primary' : 'default'}
            onClick={() =>
              applyPreset('preset_annual', {
                subscriptionStatus: ['ACTIVE'],
                subscriptionTier: ['MONTHLY'],
              })
            }
          >
            Aylık Premiumlar (Yıllığa Yükseltme)
          </Button>
        </Space>
      </Card>

      {/* Advanced Filters */}
      <Card
        title={
          <span>
            <FilterOutlined style={{ marginRight: 8 }} />
            Özel Segment Filtreleri
          </span>
        }
        style={{ marginTop: 16 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12} lg={6}>
            <div style={{ marginBottom: 6, fontWeight: 500 }}>Arama (E-posta / İsim)</div>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="ornek@mail.com veya @kullanici"
              value={filtersState.search}
              onChange={(e) =>
                setFiltersState((prev) => ({ ...prev, search: e.target.value }))
              }
              onPressEnter={applyFilters}
            />
          </Col>

          <Col xs={24} md={12} lg={6}>
            <div style={{ marginBottom: 6, fontWeight: 500 }}>Abonelik Durumu</div>
            <Select
              mode="multiple"
              allowClear
              style={{ width: '100%' }}
              placeholder="Tümü"
              value={filtersState.subscriptionStatus}
              onChange={(val) =>
                setFiltersState((prev) => ({ ...prev, subscriptionStatus: val }))
              }
              options={[
                { label: 'Ücretsiz (FREE)', value: 'FREE' },
                { label: 'Premium (ACTIVE)', value: 'ACTIVE' },
                { label: 'Deneme (TRIAL)', value: 'TRIAL' },
                { label: 'Süresi Dolmuş (EXPIRED)', value: 'EXPIRED' },
                { label: 'İptal Edilmiş (CANCELLED)', value: 'CANCELLED' },
                { label: 'Ek Süre (GRACE_PERIOD)', value: 'GRACE_PERIOD' },
              ]}
            />
          </Col>

          <Col xs={24} md={12} lg={6}>
            <div style={{ marginBottom: 6, fontWeight: 500 }}>Abonelik Planı</div>
            <Select
              mode="multiple"
              allowClear
              style={{ width: '100%' }}
              placeholder="Tümü"
              value={filtersState.subscriptionTier}
              onChange={(val) =>
                setFiltersState((prev) => ({ ...prev, subscriptionTier: val }))
              }
              options={[
                { label: 'Aylık (MONTHLY)', value: 'MONTHLY' },
                { label: 'Yıllık (YEARLY)', value: 'YEARLY' },
              ]}
            />
          </Col>

          <Col xs={24} md={12} lg={6}>
            <div style={{ marginBottom: 6, fontWeight: 500 }}>Aktivite / Pasiflik</div>
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="Tümü"
              value={filtersState.activityPreset}
              onChange={(val) =>
                setFiltersState((prev) => ({ ...prev, activityPreset: val }))
              }
              options={[
                { label: 'Aktif (Son 7 gün)', value: 'ACTIVE_7' },
                { label: 'Aktif (Son 30 gün)', value: 'ACTIVE_30' },
                { label: 'Pasif (7+ gün işlem yok)', value: 'INACTIVE_7' },
                { label: 'Pasif (14+ gün işlem yok)', value: 'INACTIVE_14' },
                { label: 'Pasif (30+ gün işlem yok)', value: 'INACTIVE_30' },
              ]}
            />
          </Col>

          <Col xs={24} md={12} lg={6}>
            <div style={{ marginBottom: 6, fontWeight: 500 }}>Gebelik Durumu</div>
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="Tümü"
              value={filtersState.isPregnant}
              onChange={(val) =>
                setFiltersState((prev) => ({ ...prev, isPregnant: val }))
              }
              options={[
                { label: 'Sadece Hamile Kullanıcılar', value: true },
                { label: 'Hamile Olmayanlar', value: false },
              ]}
            />
          </Col>

          <Col xs={24} md={12} lg={6}>
            <div style={{ marginBottom: 6, fontWeight: 500 }}>Adet Döngüsü Takibi</div>
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="Tümü"
              value={filtersState.cycleMode}
              onChange={(val) =>
                setFiltersState((prev) => ({ ...prev, cycleMode: val }))
              }
              options={[
                { label: 'Aktif Döngüsü Devam Edenler', value: 'ACTIVE_ONLY' },
                { label: 'Aktif Döngüsü Olmayanlar', value: 'NO_ACTIVE' },
                { label: 'En Az 1 Döngü Girenler', value: 'LOGGED_ANY' },
                { label: 'Hiç Döngü Girmemişler', value: 'NEVER_LOGGED' },
              ]}
            />
          </Col>

          <Col xs={24} md={12} lg={6}>
            <div style={{ marginBottom: 6, fontWeight: 500 }}>NOVA AI Kullanımı</div>
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="Tümü"
              value={filtersState.hasUsedNova}
              onChange={(val) =>
                setFiltersState((prev) => ({ ...prev, hasUsedNova: val }))
              }
              options={[
                { label: 'NOVA İle Sohbet Etmiş', value: true },
                { label: 'NOVA Hiç Kullanmamış', value: false },
              ]}
            />
          </Col>

          <Col xs={24} md={12} lg={6}>
            <div style={{ marginBottom: 6, fontWeight: 500 }}>Hesap & Kayıt Tarihi</div>
            <Space.Compact style={{ width: '100%' }}>
              <Select
                style={{ width: '38%' }}
                value={filtersState.accountStatus}
                onChange={(val) =>
                  setFiltersState((prev) => ({ ...prev, accountStatus: val }))
                }
                options={[
                  { label: 'Aktif', value: 'ACTIVE' },
                  { label: 'Askıda', value: 'SUSPENDED' },
                  { label: 'Tümü', value: 'ALL' },
                ]}
              />
              <RangePicker
                style={{ width: '62%' }}
                value={filtersState.dateRange}
                onChange={(dates: any) =>
                  setFiltersState((prev) => ({ ...prev, dateRange: dates }))
                }
              />
            </Space.Compact>
          </Col>
        </Row>

        <Row style={{ marginTop: 16 }}>
          <Col span={24}>
            <Space wrap>
              <Button
                type="primary"
                icon={<FilterOutlined />}
                onClick={applyFilters}
                loading={queryLoading}
              >
                Segmenti Filtrele
              </Button>
              <Button icon={<ClearOutlined />} onClick={clearFilters}>
                Sıfırla
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Matched Segment Summary Breakdown */}
      {segmentStats && (
        <Alert
          style={{ marginTop: 16 }}
          type="info"
          showIcon
          message={
            <Space wrap size={12}>
              <strong>Eşleşen Segment Özeti:</strong>
              <Tag color="blue">Toplam: {segmentStats.totalUsers}</Tag>
              <Tag color="gold">Premium: {segmentStats.premiumUsers}</Tag>
              <Tag color="cyan">Deneme: {segmentStats.trialUsers}</Tag>
              <Tag>Ücretsiz: {segmentStats.freeUsers}</Tag>
              <Tag color="green">Son 7 Gün Aktif: {segmentStats.activeLast7Days}</Tag>
              <Tag color="magenta">Hamile: {segmentStats.pregnantUsers}</Tag>
              <Tag color="purple">NOVA Kullanan: {segmentStats.novaUsers}</Tag>
            </Space>
          }
        />
      )}

      {/* Results Table */}
      <Card
        title={`Segment Kullanıcıları (${totalUsers} eşleşme)`}
        style={{ marginTop: 16 }}
        extra={
          <Space wrap>
            <Button
              icon={<CheckSquareOutlined />}
              onClick={handleSelectAllSegment}
              loading={selectingAllSegment}
              disabled={totalUsers === 0}
            >
              Tüm Segmenti Seç ({totalUsers})
            </Button>
            {selectedUsers.length > 0 && (
              <Button onClick={() => setSelectedUsers([])}>
                Seçimi Temizle ({selectedUsers.length})
              </Button>
            )}
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportCsv}
              disabled={totalUsers === 0}
            >
              CSV İndir
            </Button>
            <Button
              icon={<MailOutlined />}
              onClick={() => openBulkModal('email')}
              disabled={selectedUsers.length === 0}
            >
              Toplu E-posta ({selectedUsers.length})
            </Button>
            <Button
              type="primary"
              icon={<BellOutlined />}
              onClick={() => openBulkModal('notification')}
              disabled={selectedUsers.length === 0}
            >
              Toplu Bildirim ({selectedUsers.length})
            </Button>
          </Space>
        }
      >
        <Table
          rowSelection={rowSelection}
          dataSource={users}
          columns={columns}
          rowKey="id"
          loading={queryLoading}
          onChange={handleTableChange}
          locale={{
            emptyText: (
              <Empty description="Bu filtre kriterlerine uyan kullanıcı bulunamadı" />
            ),
          }}
          pagination={{
            current: page,
            pageSize,
            total: totalUsers,
            showSizeChanger: true,
            pageSizeOptions: ['20', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} kullanıcı`,
          }}
          scroll={{ x: 900 }}
        />
      </Card>

      <BulkSendModal
        open={bulkModal.open}
        mode={bulkModal.mode}
        userIds={selectedUsers}
        onClose={() => setBulkModal((prev) => ({ ...prev, open: false }))}
        onSuccess={() => setSelectedUsers([])}
      />
    </div>
  );
}
