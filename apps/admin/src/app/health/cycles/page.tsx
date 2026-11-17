'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Row,
  Col,
  Statistic,
  Input,
  Select,
  Space,
  Typography,
  message,
} from 'antd';
import {
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  HeartOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/providers/dataProvider';

const { Title, Text } = Typography;

export default function CyclesList() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cycles, setCycles] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [stats, setStats] = useState({
    totalCycles: 0,
    ongoingCycles: 0,
    completedCycles: 0,
    avgDurationDays: 0,
    totalDailyLogs: 0,
  });

  const fetchCycles = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: pageSize };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const { data } = await apiClient.get('/cycles/admin/all', { params });
      setCycles(data?.data || []);
      setTotal(data?.total || 0);
      if (data?.stats) setStats(data.stats);
    } catch {
      message.error('Regl döngüsü kayıtları yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => {
    fetchCycles();
  }, [fetchCycles]);

  const columns = [
    {
      title: 'Kullanıcı',
      key: 'user',
      render: (_: any, record: any) =>
        record.user ? (
          <Button
            type="link"
            style={{ padding: 0 }}
            onClick={() => router.push(`/users/show/${record.user.id}`)}
          >
            {record.user.email}
            {record.user.username ? ` (@${record.user.username})` : ''}
          </Button>
        ) : (
          record.userId
        ),
    },
    {
      title: 'Başlangıç',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
    },
    {
      title: 'Bitiş',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date: string) =>
        date ? (
          dayjs(date).format('DD.MM.YYYY')
        ) : (
          <Tag color="magenta">Devam Ediyor</Tag>
        ),
    },
    {
      title: 'Süre',
      key: 'duration',
      render: (_: any, record: any) => {
        if (!record.endDate) return <Tag color="processing">Devam Ediyor</Tag>;
        const days = Math.max(1, dayjs(record.endDate).diff(dayjs(record.startDate), 'day') + 1);
        return <Tag color="blue">{days} gün</Tag>;
      },
    },
    {
      title: 'Semptom / Not',
      key: 'notes',
      render: (_: any, record: any) => {
        const hasSymptoms =
          record.symptomsJson && Object.keys(record.symptomsJson).length > 0;
        return (
          <Space size={4}>
            {hasSymptoms && <Tag color="purple">Semptom Var</Tag>}
            {record.notes ? <Tag color="cyan">Not Var</Tag> : <Text type="secondary">-</Text>}
          </Space>
        );
      },
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_: any, record: any) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => router.push(`/health/cycles/show/${record.id}`)}
        >
          Detay
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <HeartOutlined style={{ marginRight: 8, color: '#EC4899' }} />
            Regl Döngüleri Takibi
          </Title>
          <Text type="secondary">
            Mobil uygulamadan kaydedilen tüm regl döngüsü ve günlük belirti kayıtları.
          </Text>
        </Col>
        <Col>
          <Space wrap>
            <Input
              placeholder="E-posta veya kullanıcı adı ara..."
              prefix={<SearchOutlined />}
              allowClear
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              style={{ width: 240 }}
            />
            <Select
              value={statusFilter}
              onChange={(val) => {
                setPage(1);
                setStatusFilter(val);
              }}
              style={{ width: 160 }}
              options={[
                { value: 'ALL', label: 'Tüm Döngüler' },
                { value: 'ongoing', label: 'Devam Eden' },
                { value: 'completed', label: 'Tamamlanan' },
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchCycles} loading={loading}>
              Yenile
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Toplam Döngü Kaydı"
              value={stats.totalCycles}
              prefix={<CalendarOutlined style={{ color: '#EC4899' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Devam Eden Döngü"
              value={stats.ongoingCycles}
              prefix={<ClockCircleOutlined style={{ color: '#8B5CF6' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Ortalama Süre (Gün)"
              value={stats.avgDurationDays}
              suffix="gün"
              prefix={<CheckCircleOutlined style={{ color: '#10B981' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Günlük Check-in & Log"
              value={stats.totalDailyLogs}
              prefix={<HeartOutlined style={{ color: '#F59E0B' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          dataSource={cycles}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>
    </div>
  );
}
