'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Progress,
  Button,
  Space,
  Typography,
  Spin,
  Alert,
} from 'antd';
import {
  QuestionCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  MessageOutlined,
  HeartOutlined,
  TrophyOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { QNA_CATEGORY_MAP } from '@/lib/community';
import { apiClient } from '@/providers/dataProvider';

const { Title, Text } = Typography;

export default function CommunityOverviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [engagement, setEngagement] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ovRes, catRes, usersRes, engRes] = await Promise.all([
        apiClient.get('/qna/analytics/overview'),
        apiClient.get('/qna/analytics/categories'),
        apiClient.get('/qna/analytics/top-users?limit=5'),
        apiClient.get('/qna/analytics/engagement'),
      ]);

      setOverview(ovRes.data);
      setCategories(catRes.data || []);
      setTopUsers(usersRes.data || []);
      setEngagement(engRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Topluluk verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Topluluk Genel Bakış
          </Title>
          <Text type="secondary">
            Soru-cevap aktivitesi, kategori dağılımı ve moderasyon durumu
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData}>
            Yenile
          </Button>
          <Button
            icon={<WarningOutlined />}
            onClick={() => router.push('/qna/reports')}
          >
            Raporlar ({overview?.pendingReports ?? 0})
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push('/qna/questions/create')}
          >
            Yeni Soru / Duyuru
          </Button>
        </Space>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Primary KPIs */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => router.push('/qna/questions')}>
            <Statistic
              title="Toplam Soru"
              value={overview?.totalQuestions ?? 0}
              prefix={<QuestionCircleOutlined style={{ color: '#ec4899' }} />}
              suffix={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  (+{overview?.questionsThisWeek ?? 0} bu hafta)
                </Text>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => router.push('/qna/questions')}>
            <Statistic
              title="Cevapsız Sorular"
              value={overview?.unansweredQuestions ?? 0}
              prefix={<ClockCircleOutlined style={{ color: '#f59e0b' }} />}
              valueStyle={{
                color: (overview?.unansweredQuestions ?? 0) > 0 ? '#d97706' : '#10b981',
              }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => router.push('/qna/answers')}>
            <Statistic
              title="Toplam Cevap"
              value={overview?.totalAnswers ?? 0}
              prefix={<MessageOutlined style={{ color: '#3b82f6' }} />}
              suffix={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  (ort {overview?.averageAnswersPerQuestion ?? 0}/soru)
                </Text>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => router.push('/qna/reports')}>
            <Statistic
              title="Bekleyen Raporlar"
              value={overview?.pendingReports ?? 0}
              prefix={<WarningOutlined style={{ color: '#ef4444' }} />}
              valueStyle={{
                color: (overview?.pendingReports ?? 0) > 0 ? '#ef4444' : '#10b981',
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Engagement Strip */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="En İyi Cevap Oranı"
              value={overview?.bestAnswerRate ?? 0}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Toplam Favori"
              value={engagement?.totalFavorites ?? overview?.totalFavorites ?? 0}
              prefix={<HeartOutlined style={{ color: '#ec4899' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Toplam Yorum"
              value={engagement?.totalComments ?? overview?.totalComments ?? 0}
              prefix={<MessageOutlined style={{ color: '#8b5cf6' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Aktif Katılımcı (7g)"
              value={overview?.activeUsers ?? 0}
              prefix={<TrophyOutlined style={{ color: '#f59e0b' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Category Distribution */}
        <Col xs={24} lg={12}>
          <Card
            title="Kategori Dağılımı"
            extra={
              <Button type="link" onClick={() => router.push('/qna/questions')}>
                Tüm Sorular
              </Button>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {categories
                .filter((c) => c.count > 0)
                .map((cat) => {
                  const meta = QNA_CATEGORY_MAP[cat.category];
                  return (
                    <div key={cat.category}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 4,
                        }}
                      >
                        <Tag color={meta?.color || 'default'}>
                          {meta?.label || cat.category}
                        </Tag>
                        <Text strong>
                          {cat.count} soru ({cat.percentage}%)
                        </Text>
                      </div>
                      <Progress
                        percent={Math.round(cat.percentage)}
                        showInfo={false}
                        strokeColor="#ec4899"
                        size="small"
                      />
                    </div>
                  );
                })}
              {categories.every((c) => c.count === 0) && (
                <Text type="secondary">Henüz soru bulunmuyor.</Text>
              )}
            </Space>
          </Card>
        </Col>

        {/* Top Contributors */}
        <Col xs={24} lg={12}>
          <Card title="En Aktif Topluluk Üyeleri">
            <Table
              dataSource={topUsers}
              rowKey="userId"
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Kullanıcı',
                  dataIndex: 'username',
                  key: 'username',
                  render: (name: string) => <Text strong>{name}</Text>,
                },
                {
                  title: 'Cevap',
                  dataIndex: 'answersGiven',
                  key: 'answersGiven',
                  align: 'center' as const,
                },
                {
                  title: 'En İyi Cevap',
                  dataIndex: 'bestAnswers',
                  key: 'bestAnswers',
                  align: 'center' as const,
                  render: (val: number) =>
                    val > 0 ? <Tag color="gold">{val}</Tag> : <span>0</span>,
                },
                {
                  title: 'İtibar Puanı',
                  dataIndex: 'reputation',
                  key: 'reputation',
                  align: 'right' as const,
                  render: (pts: number) => <Tag color="purple">{pts} puan</Tag>,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
