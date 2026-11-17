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
  CheckCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/providers/dataProvider';

const { Title, Text } = Typography;

export default function PregnancyList() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [stats, setStats] = useState({
    total: 0,
    activeCount: 0,
    trimester1: 0,
    trimester2: 0,
    trimester3: 0,
  });

  const fetchPregnancies = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: pageSize };
      if (search.trim()) params.search = search.trim();
      if (activeFilter !== 'ALL') params.isActive = activeFilter;
      const { data } = await apiClient.get('/pregnancy/admin/all', { params });
      setRecords(data?.data || []);
      setTotal(data?.total || 0);
      if (data?.stats) setStats(data.stats);
    } catch {
      message.error('Hamilelik kayıtları yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, activeFilter]);

  useEffect(() => {
    fetchPregnancies();
  }, [fetchPregnancies]);

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
      title: 'Durum',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? 'Aktif' : 'Pasif'}
        </Tag>
      ),
    },
    {
      title: 'Hafta',
      dataIndex: 'weekCache',
      key: 'weekCache',
      render: (week: number) =>
        week != null ? <Tag color="purple">{week}. Hafta</Tag> : 'Hesaplanmadı',
    },
    {
      title: 'Trimester',
      dataIndex: 'trimester',
      key: 'trimester',
      render: (trimester: number) =>
        trimester ? `${trimester}. Trimester` : '-',
    },
    {
      title: 'Tahmini Doğum',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string) =>
        date ? dayjs(date).format('DD.MM.YYYY') : '-',
    },
    {
      title: 'Kayıt Özeti',
      key: 'counts',
      render: (_: any, record: any) => (
        <Space size={4} wrap>
          <Tag color="blue">{record._count?.appointments || 0} Randevu</Tag>
          <Tag color="cyan">{record._count?.kickCounts || 0} Tekme</Tag>
          <Tag color="orange">{record._count?.contractions || 0} Kasılma</Tag>
        </Space>
      ),
    },
    {
      title: 'Anonim',
      dataIndex: 'anonymousMode',
      key: 'anonymousMode',
      render: (anonymous: boolean) => (anonymous ? 'Evet' : 'Hayır'),
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_: any, record: any) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => router.push(`/health/pregnancy/show/${record.id}`)}
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
            <HeartOutlined style={{ marginRight: 8, color: '#8B5CF6' }} />
            Hamilelik Takibi Kayıtları
          </Title>
          <Text type="secondary">
            Uygulamadaki aktif/geçmiş gebelik profilleri, tekme, kasılma ve randevu verileri.
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
              value={activeFilter}
              onChange={(val) => {
                setPage(1);
                setActiveFilter(val);
              }}
              style={{ width: 150 }}
              options={[
                { value: 'ALL', label: 'Tümü' },
                { value: 'true', label: 'Aktif Gebelik' },
                { value: 'false', label: 'Pasif' },
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchPregnancies} loading={loading}>
              Yenile
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Toplam Kayıt"
              value={stats.total}
              prefix={<CalendarOutlined style={{ color: '#8B5CF6' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Aktif Gebelik"
              value={stats.activeCount}
              prefix={<CheckCircleOutlined style={{ color: '#10B981' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={4}>
          <Card>
            <Statistic title="1. Trimester" value={stats.trimester1} />
          </Card>
        </Col>
        <Col xs={24} sm={4}>
          <Card>
            <Statistic title="2. Trimester" value={stats.trimester2} />
          </Card>
        </Col>
        <Col xs={24} sm={4}>
          <Card>
            <Statistic title="3. Trimester" value={stats.trimester3} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          dataSource={records}
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
