'use client';

import {
  Card,
  Col,
  Row,
  Statistic,
  Progress,
  Tag,
  Space,
  Divider,
  Avatar,
  List,
  Badge,
  Button,
} from 'antd';
import {
  UserOutlined,
  CrownOutlined,
  QuestionCircleOutlined,
  FileTextOutlined,
  RiseOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  MessageOutlined,
  CustomerServiceOutlined,
  TrophyOutlined,
  BulbOutlined,
  StarOutlined,
  SettingOutlined,
  DatabaseOutlined,
  ReloadOutlined,
  CloudServerOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Column, Line } from '@ant-design/charts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/tr';
import { apiClient } from '@/providers/dataProvider';
import { useAdminTheme } from '@/providers/themeContext';

dayjs.extend(relativeTime);
dayjs.locale('tr');

export default function Dashboard() {
  const router = useRouter();
  const { isDark } = useAdminTheme();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalQuestions: 0,
    totalAnswers: 0,
    totalArticles: 0,
    totalConversations: 0,
    pendingReports: 0,
    openTickets: 0,
    revenue: 0,
    userGrowthPct: 0,
  });
  const [userGrowthData, setUserGrowthData] = useState<Array<{ date: string; count: number }>>([]);
  const [revenueData, setRevenueData] = useState<Array<{ date: string; revenue: number }>>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [pendingReports, setPendingReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSystemHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await apiClient.get('/admin/system/health');
      setSystemHealth(res.data);
      setHealthError(false);
    } catch {
      setHealthError(true);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const healthTimer = setInterval(() => {
      fetchSystemHealth();
    }, 15000);
    return () => clearInterval(healthTimer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        adminStatsRes,
        userGrowthRes,
        revenueRes,
        healthRes,
        questionsRes,
        reportsRes,
        ticketsRes,
      ] = await Promise.allSettled([
        apiClient.get('/admin/dashboard/stats'),
        apiClient.get('/admin/charts/user-growth', { params: { days: 14 } }),
        apiClient.get('/admin/charts/revenue', { params: { days: 14 } }),
        apiClient.get('/admin/system/health'),
        apiClient.get('/qna/questions', { params: { limit: 5 } }),
        apiClient.get('/qna/moderation/reports', { params: { status: 'PENDING', limit: 5 } }),
        apiClient.get('/support/admin/tickets', { params: { status: 'OPEN' } }),
      ]);

      const adminStats =
        adminStatsRes.status === 'fulfilled' ? adminStatsRes.value.data : null;

      const reportsCount =
        reportsRes.status === 'fulfilled'
          ? reportsRes.value.data.pagination?.total || 0
          : 0;
      const openTicketsCount =
        ticketsRes.status === 'fulfilled'
          ? (ticketsRes.value.data?.data || []).length
          : 0;

      setStats({
        totalUsers: adminStats?.users?.total || 0,
        activeSubscriptions: adminStats?.subscriptions?.active || 0,
        totalQuestions: adminStats?.content?.questions || 0,
        totalAnswers: adminStats?.content?.answers || 0,
        totalArticles: adminStats?.content?.articles || 0,
        totalConversations: adminStats?.content?.conversations || 0,
        pendingReports: reportsCount,
        openTickets: openTicketsCount,
        revenue: Math.round(adminStats?.subscriptions?.revenue || 0),
        userGrowthPct: Math.round(adminStats?.users?.growth || 0),
      });

      if (userGrowthRes.status === 'fulfilled') {
        const labels: string[] = userGrowthRes.value.data?.labels || [];
        const values: number[] = userGrowthRes.value.data?.datasets?.[0]?.data || [];
        setUserGrowthData(
          labels.map((label, idx) => ({
            date: dayjs(label).format('DD MMM'),
            count: values[idx] || 0,
          })),
        );
      }

      if (revenueRes.status === 'fulfilled') {
        const labels: string[] = revenueRes.value.data?.labels || [];
        const values: number[] = revenueRes.value.data?.datasets?.[0]?.data || [];
        setRevenueData(
          labels.map((label, idx) => ({
            date: dayjs(label).format('DD MMM'),
            revenue: Number((values[idx] || 0).toFixed(2)),
          })),
        );
      }

      if (healthRes.status === 'fulfilled') {
        setSystemHealth(healthRes.value.data);
        setHealthError(false);
      } else {
        setHealthError(true);
      }

      if (questionsRes.status === 'fulfilled') {
        const recentQuestions = questionsRes.value.data?.questions || [];
        setRecentActivity(recentQuestions.slice(0, 5));
      }

      if (reportsRes.status === 'fulfilled') {
        const reports = reportsRes.value.data?.reports || [];
        setPendingReports(reports.slice(0, 5));
      }
    } catch (error) {
      console.error('Dashboard verileri yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickLinks = [
    { title: 'Kullanıcılar', path: '/users', icon: <UserOutlined />, color: '#1890ff' },
    { title: 'Abonelikler', path: '/subscriptions', icon: <CrownOutlined />, color: '#faad14' },
    { title: 'Finansal', path: '/financial-dashboard', icon: <RiseOutlined />, color: '#52c41a' },
    { title: 'Topluluk', path: '/qna/overview', icon: <QuestionCircleOutlined />, color: '#13c2c2' },
    { title: 'Raporlar', path: '/qna/reports', icon: <WarningOutlined />, color: '#f5222d' },
    { title: 'Makaleler', path: '/content/articles', icon: <FileTextOutlined />, color: '#722ed1' },
    { title: 'Astroloji', path: '/astrology/cosmic', icon: <StarOutlined />, color: '#9254de' },
    { title: 'Rozetler', path: '/gamification/badges', icon: <TrophyOutlined />, color: '#fa8c16' },
    { title: 'İçgörüler', path: '/gamification/insights', icon: <BulbOutlined />, color: '#eb2f96' },
    { title: 'NOVA Limitleri', path: '/ai/quotas', icon: <TeamOutlined />, color: '#2f54eb' },
    { title: 'Destek', path: '/support', icon: <CustomerServiceOutlined />, color: '#10b981' },
    { title: 'Denetim & Sistem', path: '/system/feature-flags', icon: <SettingOutlined />, color: '#595959' },
  ];

  const conversionRate =
    stats.totalUsers > 0
      ? Math.round((stats.activeSubscriptions / stats.totalUsers) * 100)
      : 0;

  return (
    <div style={{ padding: 24, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          Kadın Atlası Yönetim Paneli
        </h1>
        <p style={{ color: '#8c8c8c', fontSize: 14 }}>
          Canlı kullanıcı, gelir, moderasyon ve sistem sağlığı özeti.
        </p>
      </div>

      {/* Main Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title={<span style={{ fontSize: 14, color: '#8c8c8c' }}>Toplam Kullanıcı</span>}
              value={stats.totalUsers}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              loading={loading}
              valueStyle={{ color: '#1890ff', fontSize: 28, fontWeight: 600 }}
            />
            <div style={{ marginTop: 12, fontSize: 12, color: '#52c41a' }}>
              <RiseOutlined /> Son 30 gün büyüme: {stats.userGrowthPct >= 0 ? `+${stats.userGrowthPct}%` : `${stats.userGrowthPct}%`}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title={<span style={{ fontSize: 14, color: '#8c8c8c' }}>Aktif Abonelik</span>}
              value={stats.activeSubscriptions}
              prefix={<CrownOutlined style={{ color: '#faad14' }} />}
              loading={loading}
              valueStyle={{ color: '#faad14', fontSize: 28, fontWeight: 600 }}
            />
            <div style={{ marginTop: 12, fontSize: 12 }}>
              <Progress
                percent={conversionRate}
                size="small"
                showInfo={false}
                strokeColor="#faad14"
              />
              <span style={{ color: '#8c8c8c' }}>
                %{conversionRate} dönüşüm • ₺{stats.revenue}/ay tahmini MRR
              </span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title={<span style={{ fontSize: 14, color: '#8c8c8c' }}>Topluluk & NOVA AI</span>}
              value={stats.totalQuestions}
              prefix={<QuestionCircleOutlined style={{ color: '#52c41a' }} />}
              loading={loading}
              valueStyle={{ color: '#52c41a', fontSize: 28, fontWeight: 600 }}
            />
            <div style={{ marginTop: 12, fontSize: 12, color: '#8c8c8c' }}>
              <MessageOutlined /> {stats.totalAnswers} cevap • {stats.totalConversations} AI sohbet
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Badge count={stats.pendingReports + stats.openTickets} offset={[-10, 10]}>
              <Statistic
                title={<span style={{ fontSize: 14, color: '#8c8c8c' }}>Bekleyen Rapor / Destek</span>}
                value={stats.pendingReports}
                suffix={`/ ${stats.openTickets} talep`}
                prefix={<WarningOutlined style={{ color: '#f5222d' }} />}
                loading={loading}
                valueStyle={{ color: '#f5222d', fontSize: 24, fontWeight: 600 }}
              />
            </Badge>
            <div style={{ marginTop: 12, fontSize: 12, color: '#8c8c8c' }}>
              <ClockCircleOutlined /> {stats.totalArticles} yayında makale
            </div>
          </Card>
        </Col>
      </Row>

      {/* Live Growth & Revenue Charts */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Son 14 Gün Yeni Kullanıcılar" bordered={false} style={{ borderRadius: 8 }}>
            {userGrowthData.length > 0 ? (
              <Column
                data={userGrowthData}
                xField="date"
                yField="count"
                height={220}
                theme={isDark ? 'classicDark' : 'classic'}
                style={{ fill: isDark ? '#9d7aff' : '#7C3AED', radiusTopLeft: 6, radiusTopRight: 6 }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 48, color: '#8c8c8c' }}>
                Grafik verisi bulunamadı
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Son 14 Gün Gelir Trendi (₺)" bordered={false} style={{ borderRadius: 8 }}>
            {revenueData.length > 0 ? (
              <Line
                data={revenueData}
                xField="date"
                yField="revenue"
                height={220}
                theme={isDark ? 'classicDark' : 'classic'}
                shapeField="smooth"
                style={{ stroke: '#10b981', lineWidth: 2 }}
                point={{ sizeField: 3, shapeField: 'circle' }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 48, color: '#8c8c8c' }}>
                Grafik verisi bulunamadı
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Quick Links */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card
            title={<span style={{ fontSize: 16, fontWeight: 600 }}>Hızlı Erişim</span>}
            bordered={false}
            style={{ borderRadius: 8 }}
          >
            <Row gutter={[16, 16]}>
              {quickLinks.map((link) => (
                <Col xs={12} sm={8} md={6} lg={4} key={link.path}>
                  <Card
                    hoverable
                    onClick={() => router.push(link.path)}
                    style={{
                      textAlign: 'center',
                      borderRadius: 8,
                      border: `1px solid ${link.color}20`,
                    }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <div style={{ fontSize: 32, color: link.color, marginBottom: 8 }}>
                      {link.icon}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{link.title}</div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity & Pending Reports */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined />
                <span style={{ fontSize: 16, fontWeight: 600 }}>Son Topluluk Soruları</span>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 8, height: '100%' }}
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>Yükleniyor...</div>
            ) : recentActivity.length > 0 ? (
              <List
                dataSource={recentActivity}
                renderItem={(item: any) => (
                  <List.Item
                    style={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/qna/questions/show/${item.id}`)}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          style={{ backgroundColor: '#1890ff' }}
                          icon={<QuestionCircleOutlined />}
                        />
                      }
                      title={
                        <Space>
                          <span>{item.title}</span>
                          {item.isPremium && <Tag color="gold">Premium</Tag>}
                        </Space>
                      }
                      description={
                        <Space split={<Divider type="vertical" />}>
                          <span>{item.user?.username || 'Anonim'}</span>
                          <span>{dayjs(item.createdAt).fromNow()}</span>
                          <span>{item._count?.answers || 0} cevap</span>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#8c8c8c' }}>
                Henüz aktivite yok
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <WarningOutlined style={{ color: '#f5222d' }} />
                <span style={{ fontSize: 16, fontWeight: 600 }}>Bekleyen Raporlar</span>
                {stats.pendingReports > 0 && (
                  <Badge count={stats.pendingReports} style={{ backgroundColor: '#f5222d' }} />
                )}
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 8, height: '100%' }}
            extra={
              stats.pendingReports > 0 && (
                <a onClick={() => router.push('/qna/reports')}>Tümünü Gör</a>
              )
            }
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>Yükleniyor...</div>
            ) : pendingReports.length > 0 ? (
              <List
                dataSource={pendingReports}
                renderItem={(item: any) => (
                  <List.Item
                    style={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/qna/reports/show/${item.id}`)}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          style={{ backgroundColor: '#f5222d' }}
                          icon={<WarningOutlined />}
                        />
                      }
                      title={
                        <Space>
                          <span>{item.reason}</span>
                          <Tag color="orange">Beklemede</Tag>
                        </Space>
                      }
                      description={
                        <Space split={<Divider type="vertical" />}>
                          <span>
                            {item.contentType === 'QUESTION'
                              ? 'Soru'
                              : item.contentType === 'ANSWER'
                                ? 'Cevap'
                                : 'Yorum'}
                          </span>
                          <span>{dayjs(item.createdAt).fromNow()}</span>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#52c41a' }}>
                <CheckCircleOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <div>Bekleyen rapor yok</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Real Live System Health Status */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card
            title={
              <Space wrap>
                <span style={{ fontSize: 16, fontWeight: 600 }}>Canlı Sistem Sağlığı</span>
                {healthError ? (
                  <Tag color="red">API Erişim Hatası</Tag>
                ) : systemHealth?.status === 'healthy' ? (
                  <Badge status="processing" color="green" text={<Tag color="green">Canlı · Sağlıklı (15sn)</Tag>} />
                ) : systemHealth?.status === 'maintenance' ? (
                  <Tag color="orange">Bakım Modu Aktif</Tag>
                ) : systemHealth?.status === 'degraded' ? (
                  <Tag color="gold">Kısmi Uyarı</Tag>
                ) : systemHealth?.status === 'unhealthy' ? (
                  <Tag color="red">Veritabanı Hatası</Tag>
                ) : (
                  <Badge status="processing" text="Bağlanıyor..." />
                )}
              </Space>
            }
            extra={
              <Space>
                {systemHealth?.timestamp && (
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                    Son kontrol: {dayjs(systemHealth.timestamp).format('HH:mm:ss')}
                  </span>
                )}
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  loading={healthLoading}
                  onClick={fetchSystemHealth}
                >
                  Yenile
                </Button>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 8 }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={8}>
                <Card bordered size="small" style={{ borderRadius: 8 }}>
                  <Statistic
                    title="Veritabanı (PostgreSQL)"
                    value={
                      healthError
                        ? 'Bağlantı Hatası'
                        : systemHealth?.database?.connected
                          ? 'Bağlı'
                          : systemHealth
                            ? 'Bağlı Değil'
                            : 'Kontrol Ediliyor'
                    }
                    suffix={
                      !healthError && systemHealth?.database?.responseTime !== undefined
                        ? `(${systemHealth.database.responseTime} ms)`
                        : undefined
                    }
                    valueStyle={{
                      color: healthError
                        ? '#ff4d4f'
                        : systemHealth?.database?.connected
                          ? '#52c41a'
                          : '#faad14',
                      fontSize: 20,
                    }}
                    prefix={<DatabaseOutlined />}
                  />
                  <div style={{ marginTop: 6, fontSize: 12, color: '#8c8c8c' }}>
                    {systemHealth?.database?.responseTime !== undefined
                      ? systemHealth.database.responseTime < 50
                        ? 'Yanıt hızı: Çok hızlı'
                        : systemHealth.database.responseTime < 200
                          ? 'Yanıt hızı: Normal'
                          : 'Yanıt hızı: Yavaş'
                      : 'Sorgu ölçülüyor...'}
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={8}>
                <Card bordered size="small" style={{ borderRadius: 8 }}>
                  <Statistic
                    title="API Sunucusu & Bellek"
                    value={
                      systemHealth?.server
                        ? `${systemHealth.server.memoryUsedMb} MB`
                        : '-'
                    }
                    suffix={
                      systemHealth?.server
                        ? `/ ${systemHealth.server.memoryRssMb} MB RSS`
                        : undefined
                    }
                    valueStyle={{ color: '#722ed1', fontSize: 20 }}
                    prefix={<CloudServerOutlined />}
                  />
                  <div style={{ marginTop: 6, fontSize: 12, color: '#8c8c8c' }}>
                    {systemHealth?.server
                      ? `Çalışma süresi: ${Math.floor(systemHealth.server.uptimeSeconds / 3600)} sa ${Math.floor((systemHealth.server.uptimeSeconds % 3600) / 60)} dk · ${systemHealth.server.nodeVersion}`
                      : 'Sunucu verisi bekleniyor...'}
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={8}>
                <Card
                  bordered
                  size="small"
                  hoverable
                  onClick={() => router.push('/users')}
                  style={{ borderRadius: 8 }}
                >
                  <Statistic
                    title="Anlık Aktif Kullanıcı (5 dk)"
                    value={systemHealth?.users?.active ?? 0}
                    suffix={`/ ${systemHealth?.users?.total ?? stats.totalUsers} toplam`}
                    valueStyle={{ color: '#1890ff', fontSize: 20 }}
                    prefix={<TeamOutlined />}
                  />
                  <div style={{ marginTop: 6, fontSize: 12, color: '#8c8c8c' }}>
                    Son 15 dk aktif: {systemHealth?.users?.active15Min ?? 0} kişi
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={8}>
                <Card
                  bordered
                  size="small"
                  hoverable
                  onClick={() => router.push('/system/audit-logs')}
                  style={{ borderRadius: 8 }}
                >
                  <Statistic
                    title="Hata Oranı (Son 1 Saat)"
                    value={
                      systemHealth?.errors
                        ? `%${(systemHealth.errors.rate * 100).toFixed(1)}`
                        : '%0.0'
                    }
                    valueStyle={{
                      color:
                        (systemHealth?.errors?.rate || 0) > 0.05
                          ? '#ff4d4f'
                          : '#52c41a',
                      fontSize: 20,
                    }}
                    prefix={<WarningOutlined />}
                  />
                  <div style={{ marginTop: 6, fontSize: 12, color: '#8c8c8c' }}>
                    {systemHealth?.errors
                      ? `${systemHealth.errors.errorCountLastHour || 0} hata / ${systemHealth.errors.requestsLastHour || 0} denetim işlemi`
                      : 'Denetim logu izleniyor'}
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={8}>
                <Card
                  bordered
                  size="small"
                  hoverable
                  onClick={() => router.push('/ai/providers')}
                  style={{ borderRadius: 8 }}
                >
                  <Statistic
                    title="NOVA AI Sağlayıcıları"
                    value={
                      systemHealth?.ai
                        ? systemHealth.ai.enabledCount > 0
                          ? `${systemHealth.ai.enabledCount} / ${systemHealth.ai.totalProviders} Aktif`
                          : systemHealth.ai.envFallback
                            ? 'Ortam Anahtarı Aktif'
                            : 'Yapılandırılmadı'
                        : '-'
                    }
                    valueStyle={{
                      color:
                        (systemHealth?.ai?.enabledCount || 0) > 0 || systemHealth?.ai?.envFallback
                          ? '#10b981'
                          : '#8c8c8c',
                      fontSize: 20,
                    }}
                    prefix={<RobotOutlined />}
                  />
                  <div style={{ marginTop: 6, fontSize: 12, color: '#8c8c8c' }}>
                    {systemHealth?.ai?.enabledProviders?.length
                      ? `Aktif: ${systemHealth.ai.enabledProviders.join(', ')}`
                      : systemHealth?.ai?.envFallback
                        ? 'Sunucu .env anahtarı kullanılıyor'
                        : 'AI sağlayıcı eklemek için tıklayın'}
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={8}>
                <Card
                  bordered
                  size="small"
                  hoverable
                  onClick={() => router.push('/support')}
                  style={{ borderRadius: 8 }}
                >
                  <Statistic
                    title="Destek & Bakım Modu"
                    value={`${systemHealth?.support?.openTickets ?? stats.openTickets} Açık Talep`}
                    valueStyle={{
                      color:
                        systemHealth?.maintenance?.enabled
                          ? '#fa8c16'
                          : (systemHealth?.support?.openTickets ?? stats.openTickets) > 0
                            ? '#faad14'
                            : '#52c41a',
                      fontSize: 20,
                    }}
                    prefix={<SafetyCertificateOutlined />}
                  />
                  <div style={{ marginTop: 6, fontSize: 12, color: '#8c8c8c' }}>
                    Bakım modu: {systemHealth?.maintenance?.enabled ? 'AÇIK' : 'Kapalı'} ·{' '}
                    {systemHealth?.support?.pendingReports ?? stats.pendingReports} rapor
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
