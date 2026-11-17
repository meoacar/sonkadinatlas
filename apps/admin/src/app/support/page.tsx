'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Select,
  Modal,
  Input,
  Typography,
  Row,
  Col,
  Statistic,
  message,
  theme as antdTheme,
} from 'antd';
import {
  CustomerServiceOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiClient } from '@/providers/dataProvider';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface SupportTicket {
  id: string;
  userId: string;
  userEmail?: string;
  category: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  adminNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_META: Record<SupportTicket['status'], { label: string; color: string }> = {
  OPEN: { label: 'Açık', color: 'red' },
  IN_PROGRESS: { label: 'İnceleniyor', color: 'gold' },
  RESOLVED: { label: 'Çözüldü', color: 'green' },
};

export default function SupportTicketsPage() {
  const { token } = antdTheme.useToken();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [modalStatus, setModalStatus] = useState<SupportTicket['status']>('OPEN');
  const [modalNote, setModalNote] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const query = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const res = await apiClient.get(`/support/admin/tickets${query}`);
      setTickets(res.data?.data || []);
    } catch {
      message.error('Destek talepleri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const openManageModal = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setModalStatus(ticket.status);
    setModalNote(ticket.adminNote || '');
  };

  const handleSaveTicket = async () => {
    if (!selectedTicket) return;
    setSaving(true);
    try {
      await apiClient.patch(`/support/admin/tickets/${selectedTicket.id}`, {
        status: modalStatus,
        adminNote: modalNote,
      });
      message.success('Destek talebi güncellendi.');
      setSelectedTicket(null);
      fetchTickets();
    } catch {
      message.error('Talep güncellenirken hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED').length;

  const columns = [
    {
      title: 'Durum',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: SupportTicket['status']) => {
        const meta = STATUS_META[status] || { label: status, color: 'default' };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: 'Kategori',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (cat: string) => <Tag color="purple">{cat || 'Genel'}</Tag>,
    },
    {
      title: 'Konu & Mesaj',
      key: 'subject',
      render: (_: any, record: SupportTicket) => (
        <div>
          <Text strong>{record.subject}</Text>
          <div style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>
            {record.message.length > 90 ? `${record.message.slice(0, 90)}...` : record.message}
          </div>
        </div>
      ),
    },
    {
      title: 'Kullanıcı',
      dataIndex: 'userEmail',
      key: 'userEmail',
      width: 200,
      render: (email: string, record: SupportTicket) => email || record.userId,
    },
    {
      title: 'Tarih',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'İşlem',
      key: 'actions',
      width: 120,
      render: (_: any, record: SupportTicket) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => openManageModal(record)}>
          Yanıtla
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <CustomerServiceOutlined style={{ marginRight: 8, color: '#7C3AED' }} />
            Destek & Geri Bildirim Talepleri
          </Title>
          <Text type="secondary">
            Mobil uygulama Yardım Merkezi üzerinden gönderilen talepleri yönetin ve yanıtlayın.
          </Text>
        </Col>
        <Col>
          <Space>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 160 }}
              options={[
                { value: 'ALL', label: 'Tüm Talepler' },
                { value: 'OPEN', label: 'Açık' },
                { value: 'IN_PROGRESS', label: 'İnceleniyor' },
                { value: 'RESOLVED', label: 'Çözüldü' },
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchTickets} loading={loading}>
              Yenile
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Açık Talepler"
              value={openCount}
              prefix={<ExclamationCircleOutlined style={{ color: '#EF4444' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="İnceleniyor"
              value={inProgressCount}
              prefix={<ClockCircleOutlined style={{ color: '#F59E0B' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Çözüldü"
              value={resolvedCount}
              prefix={<CheckCircleOutlined style={{ color: '#10B981' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          dataSource={tickets}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15 }}
        />
      </Card>

      <Modal
        title="Destek Talebini Yönet"
        open={Boolean(selectedTicket)}
        onCancel={() => setSelectedTicket(null)}
        onOk={handleSaveTicket}
        confirmLoading={saving}
        okText="Kaydet"
        cancelText="İptal"
      >
        {selectedTicket && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <Tag color="purple">{selectedTicket.category}</Tag>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                {selectedTicket.userEmail || selectedTicket.userId}
              </Text>
            </div>
            <div>
              <Text strong>Konu:</Text>
              <Paragraph style={{ marginTop: 4 }}>{selectedTicket.subject}</Paragraph>
              <Text strong>Kullanıcı Mesajı:</Text>
              <Paragraph
                style={{
                  marginTop: 4,
                  padding: 12,
                  background: token.colorFillQuaternary,
                  borderRadius: 8,
                  border: `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                {selectedTicket.message}
              </Paragraph>
            </div>
            <div>
              <Text strong>Durum</Text>
              <Select
                value={modalStatus}
                onChange={setModalStatus}
                style={{ width: '100%', marginTop: 6 }}
                options={[
                  { value: 'OPEN', label: 'Açık' },
                  { value: 'IN_PROGRESS', label: 'İnceleniyor' },
                  { value: 'RESOLVED', label: 'Çözüldü' },
                ]}
              />
            </div>
            <div>
              <Text strong>Admin Notu / Kullanıcıya Yanıt</Text>
              <TextArea
                rows={4}
                value={modalNote}
                onChange={(e) => setModalNote(e.target.value)}
                placeholder="Kullanıcının Yardım Merkezi ekranında göreceği yanıtı yazın..."
                style={{ marginTop: 6 }}
              />
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
}
