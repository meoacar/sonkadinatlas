'use client';

import { Show } from '@refinedev/antd';
import { useShow } from '@refinedev/core';
import {
  Typography,
  Tag,
  Descriptions,
  Card,
  Tabs,
  Button,
  Space,
  Modal,
  Input,
  List,
  Row,
  Col,
  Statistic,
  Popconfirm,
  Form,
  Select,
  DatePicker,
  InputNumber,
  Alert,
  message,
} from 'antd';
import {
  BellOutlined,
  StopOutlined,
  CheckCircleOutlined,
  KeyOutlined,
  UnlockOutlined,
  DownloadOutlined,
  UserSwitchOutlined,
  CrownOutlined,
  SaveOutlined,
  ReloadOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiClient } from '@/providers/dataProvider';

const { Title, Text } = Typography;

export default function UserShow() {
  const router = useRouter();
  const { queryResult } = useShow();
  const { data, isLoading, refetch } = queryResult;

  const record = data?.data as any;
  const [overview, setOverview] = useState<any>(null);
  const [pushModalOpen, setPushModalOpen] = useState(false);
  const [pushTitle, setPushTitle] = useState('');
  const [pushBody, setPushBody] = useState('');
  const [sendingPush, setSendingPush] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [impersonateData, setImpersonateData] = useState<any>(null);
  const [subForm] = Form.useForm();
  const [subSaving, setSubSaving] = useState(false);

  useEffect(() => {
    if (!record?.id) return;
    apiClient
      .get(`/admin/users/${record.id}/overview`)
      .then((res) => setOverview(res.data))
      .catch(() => {});

    subForm.setFieldsValue({
      status: record.subscription?.status || 'FREE',
      tier: record.subscription?.tier || undefined,
      endDate: record.subscription?.endDate ? dayjs(record.subscription.endDate) : null,
      aiMessagesLimit: record.subscription?.aiMessagesLimit ?? 100,
    });
  }, [record, subForm]);

  const handleToggleStatus = async () => {
    if (!record?.id) return;
    const nextStatus = record.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    setActionLoading(true);
    try {
      await apiClient.patch(`/users/${record.id}`, { status: nextStatus });
      message.success(
        nextStatus === 'SUSPENDED'
          ? 'Kullanıcı askıya alındı ve mobil oturumu geçersiz kılındı.'
          : 'Kullanıcı hesabı tekrar aktifleştirildi.',
      );
      await refetch();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Durum güncellenemedi');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearPin = async () => {
    if (!record?.id) return;
    setActionLoading(true);
    try {
      await apiClient.patch(`/users/${record.id}`, { pinEnabled: false });
      message.success('Kullanıcının PIN kilidi kaldırıldı (mobil uygulama senkronize edilecek).');
      await refetch();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'PIN kaldırılamadı');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!record?.id || newPassword.trim().length < 6) {
      message.warning('Şifre en az 6 karakter olmalıdır.');
      return;
    }
    setSavingPassword(true);
    try {
      await apiClient.patch(`/users/${record.id}`, {
        newPassword: newPassword.trim(),
        confirmPassword: newPassword.trim(),
      });
      message.success('Kullanıcı şifresi güncellendi.');
      setPasswordModalOpen(false);
      setNewPassword('');
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Şifre güncellenemedi');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleExportKvkk = async () => {
    if (!record?.id) return;
    setActionLoading(true);
    try {
      const res = await apiClient.get(`/users/${record.id}/export`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: 'application/json;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kvkk-export-${record.username || record.id}-${dayjs().format('YYYY-MM-DD')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      message.success('KVKK veri paketi JSON olarak indirildi');
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Veri dışa aktarılamadı');
    } finally {
      setActionLoading(false);
    }
  };

  const handleImpersonate = async () => {
    if (!record?.id) return;
    setActionLoading(true);
    try {
      const res = await apiClient.post(`/admin/impersonate/${record.id}`);
      setImpersonateData(res.data);
      message.success('Geçici destek erişim tokenı üretildi');
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Impersonate başlatılamadı');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSubscription = async (resetUsage = false) => {
    if (!record?.id) return;
    setSubSaving(true);
    try {
      const vals = await subForm.validateFields();
      await apiClient.patch(`/users/${record.id}/subscription`, {
        status: vals.status,
        tier: vals.tier || null,
        endDate: vals.endDate ? vals.endDate.toISOString() : null,
        aiMessagesLimit: vals.aiMessagesLimit,
        resetAiUsage: resetUsage,
      });
      message.success(
        resetUsage
          ? 'Abonelik güncellendi ve AI sayacı sıfırlandı'
          : 'Abonelik bilgileri güncellendi',
      );
      await refetch();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Abonelik güncellenemedi');
    } finally {
      setSubSaving(false);
    }
  };

  const handleSendDirectPush = async () => {
    if (!record?.id || !pushTitle.trim() || !pushBody.trim()) {
      message.warning('Başlık ve mesaj giriniz.');
      return;
    }
    setSendingPush(true);
    try {
      const res = await apiClient.post(`/admin/users/${record.id}/send-push`, {
        title: pushTitle.trim(),
        body: pushBody.trim(),
      });
      if (res.data?.receipt?.status === 'ok') {
        message.success('Push bildirimi kullanıcıya gönderildi');
      } else {
        message.info(
          res.data?.receipt?.message ||
            'Kullanıcının kayıtlı Push Token bilgisi bulunamadı.',
        );
      }
      setPushModalOpen(false);
      setPushTitle('');
      setPushBody('');
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Push gönderilemedi');
    } finally {
      setSendingPush(false);
    }
  };

  const isSuspended = record?.status === 'SUSPENDED';

  return (
    <Show isLoading={isLoading}>
      {/* Quick Operations Bar */}
      {record && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space wrap>
            <Popconfirm
              title={
                isSuspended
                  ? 'Kullanıcı hesabı tekrar aktifleştirilsin mi?'
                  : 'Kullanıcı askıya alınsın mı?'
              }
              description={
                isSuspended
                  ? 'Kullanıcı mobil uygulamaya tekrar giriş yapabilecek.'
                  : 'Kullanıcının aktif mobil oturumu kapatılır ve yeniden giriş yapamaz.'
              }
              onConfirm={handleToggleStatus}
              okText={isSuspended ? 'Aktifleştir' : 'Askıya Al'}
              cancelText="İptal"
            >
              <Button
                type={isSuspended ? 'primary' : 'default'}
                danger={!isSuspended}
                loading={actionLoading}
                icon={isSuspended ? <CheckCircleOutlined /> : <StopOutlined />}
              >
                {isSuspended ? 'Hesabı Aktifleştir' : 'Kullanıcıyı Askıya Al'}
              </Button>
            </Popconfirm>

            {record.pinEnabled && (
              <Popconfirm
                title="Kullanıcının PIN kilidi sıfırlansın mı?"
                onConfirm={handleClearPin}
                okText="Kaldır"
                cancelText="İptal"
              >
                <Button icon={<UnlockOutlined />} loading={actionLoading}>
                  PIN Kilidini Kaldır
                </Button>
              </Popconfirm>
            )}

            <Button icon={<KeyOutlined />} onClick={() => setPasswordModalOpen(true)}>
              Şifre Sıfırla
            </Button>

            <Button
              icon={<BellOutlined />}
              onClick={() => setPushModalOpen(true)}
            >
              Push Gönder
            </Button>

            <Button
              icon={<DownloadOutlined />}
              loading={actionLoading}
              onClick={handleExportKvkk}
            >
              KVKK Veri İndir
            </Button>

            <Popconfirm
              title="Bu kullanıcı için destek (impersonation) tokenı oluşturulsun mu?"
              description="İşlem Denetim Kayıtlarına yazılır."
              onConfirm={handleImpersonate}
              okText="Oluştur"
              cancelText="İptal"
            >
              <Button icon={<UserSwitchOutlined />} loading={actionLoading}>
                Destek Tokenı Üret
              </Button>
            </Popconfirm>
          </Space>
        </Card>
      )}

      {isSuspended && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Bu hesap şu anda ASKIYA ALINMIŞ durumda"
          description="Kullanıcı mobil uygulamaya giriş yapamaz ve mevcut API oturumları reddedilir."
        />
      )}

      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: '1',
            label: 'Temel Bilgiler',
            children: (
              <>
                <Title level={5}>Kullanıcı Bilgileri</Title>
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="E-posta">{record?.email}</Descriptions.Item>
                  <Descriptions.Item label="Kullanıcı Adı">{record?.username || 'Yok'}</Descriptions.Item>
                  <Descriptions.Item label="Durum">
                    <Tag color={record?.status === 'ACTIVE' ? 'green' : record?.status === 'SUSPENDED' ? 'orange' : 'red'}>
                      {record?.status === 'ACTIVE'
                        ? 'Aktif'
                        : record?.status === 'SUSPENDED'
                          ? 'Askıya Alındı'
                          : 'Silindi'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Yetki">
                    <Tag color={record?.isAdmin ? 'purple' : 'default'}>
                      {record?.isAdmin ? 'Admin' : 'Kullanıcı'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="PIN Koruması">
                    <Tag color={record?.pinEnabled ? 'blue' : 'default'}>
                      {record?.pinEnabled ? 'Aktif' : 'Pasif'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Kayıt Tarihi">
                    {dayjs(record?.createdAt).format('YYYY-MM-DD HH:mm')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Güncelleme">
                    {dayjs(record?.updatedAt).format('YYYY-MM-DD HH:mm')}
                  </Descriptions.Item>
                </Descriptions>

                {record?.profile && (
                  <>
                    <Title level={5} style={{ marginTop: 24 }}>Profil</Title>
                    <Descriptions bordered column={2}>
                      <Descriptions.Item label="Ad">{record.profile.firstName || 'Yok'}</Descriptions.Item>
                      <Descriptions.Item label="Soyad">{record.profile.lastName || 'Yok'}</Descriptions.Item>
                      <Descriptions.Item label="Görünen Ad">{record.profile.displayName || 'Yok'}</Descriptions.Item>
                      <Descriptions.Item label="Doğum Tarihi">
                        {record.profile.dateOfBirth ? dayjs(record.profile.dateOfBirth).format('YYYY-MM-DD') : 'Yok'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Boy">{record.profile.heightCm ? `${record.profile.heightCm} cm` : 'Yok'}</Descriptions.Item>
                      <Descriptions.Item label="Kilo">{record.profile.weightKg ? `${record.profile.weightKg} kg` : 'Yok'}</Descriptions.Item>
                      <Descriptions.Item label="Ülke">{record.profile.country || 'Yok'}</Descriptions.Item>
                      <Descriptions.Item label="Saat Dilimi">{record.profile.timezone || 'Yok'}</Descriptions.Item>
                    </Descriptions>
                  </>
                )}
              </>
            ),
          },
          {
            key: '2',
            label: 'Abonelik & Kota Yönetimi',
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                {record?.subscription ? (
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="Mevcut Durum">
                      <Tag color={record.subscription.status === 'ACTIVE' ? 'gold' : 'default'}>
                        {record.subscription.status}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Seviye">
                      {record.subscription.tier === 'MONTHLY'
                        ? 'Aylık'
                        : record.subscription.tier === 'YEARLY'
                          ? 'Yıllık'
                          : 'Yok'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Sağlayıcı">
                      {record.subscription.provider || 'Manuel / Admin'}
                    </Descriptions.Item>
                    <Descriptions.Item label="AI Mesaj Kullanımı">
                      {record.subscription.aiMessagesUsed} / {record.subscription.aiMessagesLimit}
                    </Descriptions.Item>
                    <Descriptions.Item label="Başlangıç">
                      {record.subscription.startDate
                        ? dayjs(record.subscription.startDate).format('YYYY-MM-DD')
                        : 'Yok'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Bitiş">
                      {record.subscription.endDate
                        ? dayjs(record.subscription.endDate).format('YYYY-MM-DD')
                        : 'Yok'}
                    </Descriptions.Item>
                  </Descriptions>
                ) : (
                  <Alert
                    type="info"
                    showIcon
                    message="Kullanıcının henüz abonelik kaydı yok (Varsayılan: FREE)"
                    description="Aşağıdaki formdan doğrudan Premium veya Deneme aboneliği tanımlayabilirsiniz."
                  />
                )}

                <Card
                  size="small"
                  title={
                    <Space>
                      <CrownOutlined style={{ color: '#faad14' }} />
                      <span>Abonelik & AI Kotasını Düzenle (Mobilde Anında Yansır)</span>
                    </Space>
                  }
                >
                  <Form form={subForm} layout="vertical">
                    <Row gutter={16}>
                      <Col xs={24} md={6}>
                        <Form.Item label="Abonelik Durumu" name="status">
                          <Select
                            options={[
                              { label: 'Ücretsiz (FREE)', value: 'FREE' },
                              { label: 'Deneme (TRIAL)', value: 'TRIAL' },
                              { label: 'Premium (ACTIVE)', value: 'ACTIVE' },
                              { label: 'Süresi Dolmuş (EXPIRED)', value: 'EXPIRED' },
                              { label: 'İptal (CANCELLED)', value: 'CANCELLED' },
                              { label: 'Ek Süre (GRACE_PERIOD)', value: 'GRACE_PERIOD' },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={6}>
                        <Form.Item label="Plan" name="tier">
                          <Select
                            allowClear
                            placeholder="Seçiniz"
                            options={[
                              { label: 'Aylık (MONTHLY)', value: 'MONTHLY' },
                              { label: 'Yıllık (YEARLY)', value: 'YEARLY' },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={6}>
                        <Form.Item label="Bitiş Tarihi" name="endDate">
                          <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={6}>
                        <Form.Item label="AI Mesaj Limiti" name="aiMessagesLimit">
                          <InputNumber min={0} max={100000} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Space wrap>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        loading={subSaving}
                        onClick={() => handleSaveSubscription(false)}
                      >
                        Aboneliği Kaydet
                      </Button>
                      <Button
                        icon={<ReloadOutlined />}
                        loading={subSaving}
                        onClick={() => handleSaveSubscription(true)}
                      >
                        Kaydet ve AI Sayacını Sıfırla
                      </Button>
                    </Space>
                  </Form>
                </Card>
              </Space>
            ),
          },
          {
            key: '3',
            label: 'Sağlık Verileri',
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="Regl Döngüleri">
                    {record?._count?.periodCycles || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label="Günlük Check-in / Semptom">
                    {record?._count?.dailyLogs || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label="Su Kayıtları">
                    {record?._count?.waterLogs || 0} kayıt ({record?.wellnessTotals?.totalWaterMl || 0} ml)
                  </Descriptions.Item>
                  <Descriptions.Item label="Adım Kayıtları">
                    {record?._count?.dailySteps || 0} gün ({record?.wellnessTotals?.totalSteps || 0} adım)
                  </Descriptions.Item>
                  <Descriptions.Item label="Uyku Kayıtları">
                    {record?._count?.sleepLogs || 0} kayıt ({record?.wellnessTotals?.totalSleepHours || 0} saat)
                  </Descriptions.Item>
                  <Descriptions.Item label="Meditasyon & Nefes">
                    {record?._count?.meditationSessions || 0} seans ({record?.wellnessTotals?.totalMeditationMin || 0} dk)
                  </Descriptions.Item>
                  <Descriptions.Item label="Sağlık Ölçümleri (BMI/BMR)">
                    {record?._count?.healthMetrics || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label="Hatırlatıcılar">
                    {record?._count?.reminders || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label="Hamilelik Modu" span={2}>
                    {record?.pregnancy ? (
                      <Space>
                        <Tag color={record.pregnancy.isActive ? 'green' : 'default'}>
                          {record.pregnancy.isActive ? 'Aktif' : 'Pasif'}
                        </Tag>
                        {record.pregnancy.weekCache != null && (
                          <span>{record.pregnancy.weekCache}. Hafta</span>
                        )}
                        <Button
                          type="link"
                          size="small"
                          onClick={() => router.push(`/health/pregnancy/show/${record.pregnancy.id}`)}
                        >
                          Hamilelik Detayı
                        </Button>
                      </Space>
                    ) : (
                      'Yok'
                    )}
                  </Descriptions.Item>
                </Descriptions>
                <Space wrap>
                  <Button onClick={() => router.push('/health/cycles')}>
                    Regl Döngülerini Aç
                  </Button>
                  <Button onClick={() => router.push('/health/pregnancy')}>
                    Hamilelik Kayıtlarını Aç
                  </Button>
                  <Button type="primary" onClick={() => router.push('/health/wellness')}>
                    Wellness Verilerini Aç
                  </Button>
                </Space>
              </Space>
            ),
          },
          {
            key: '4',
            label: 'Aktivite',
            children: (
              <Card>
                <p><strong>Konuşmalar:</strong> {record?._count?.conversations || 0}</p>
                <p><strong>Sorular:</strong> {record?._count?.questions || 0}</p>
                <p><strong>Cevaplar:</strong> {record?._count?.answers || 0}</p>
                <p><strong>Görüntülenen Makaleler:</strong> {record?._count?.articleInteractions || 0}</p>
              </Card>
            ),
          },
          {
            key: '5',
            label: '360° Özet & Push',
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                <Row gutter={[12, 12]}>
                  <Col xs={12} md={6}>
                    <Card size="small">
                      <Statistic
                        title="Döngü / Günlük"
                        value={overview?.user?._count?.periodCycles || 0}
                        suffix={`(${overview?.user?._count?.dailyLogs || 0} log)`}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} md={6}>
                    <Card size="small">
                      <Statistic
                        title="Wellness Kayıtları"
                        value={
                          (overview?.user?._count?.waterLogs || 0) +
                          (overview?.user?._count?.sleepLogs || 0) +
                          (overview?.user?._count?.stepsLogs || 0)
                        }
                      />
                    </Card>
                  </Col>
                  <Col xs={12} md={6}>
                    <Card size="small">
                      <Space direction="vertical" size={2}>
                        <Text type="secondary">Push & Partner</Text>
                        <Tag color={overview?.hasPushToken ? 'green' : 'default'}>
                          {overview?.hasPushToken ? 'Push Token Hazır' : 'Push Token Yok'}
                        </Tag>
                        <Tag color={overview?.partnerConnected ? 'magenta' : 'default'}>
                          {overview?.partnerConnected ? 'Partner Bağlı' : 'Partner Yok'}
                        </Tag>
                      </Space>
                    </Card>
                  </Col>
                  <Col xs={12} md={6}>
                    <Card size="small">
                      <Button
                        type="primary"
                        icon={<BellOutlined />}
                        block
                        onClick={() => setPushModalOpen(true)}
                      >
                        Doğrudan Push Gönder
                      </Button>
                    </Card>
                  </Col>
                </Row>

                <Card size="small" title={`Destek Talepleri (${overview?.supportTickets?.length || 0})`}>
                  <List
                    size="small"
                    dataSource={overview?.supportTickets || []}
                    locale={{ emptyText: 'Destek talebi yok' }}
                    renderItem={(t: any) => (
                      <List.Item
                        extra={<Tag color={t.status === 'RESOLVED' ? 'green' : 'orange'}>{t.status}</Tag>}
                      >
                        <List.Item.Meta
                          title={t.subject}
                          description={`${t.category} · ${dayjs(t.createdAt).format('DD.MM.YYYY HH:mm')}`}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Space>
            ),
          },
        ]}
      />

      {/* Push Modal */}
      <Modal
        title="Kullanıcıya Doğrudan Push Gönder"
        open={pushModalOpen}
        onCancel={() => setPushModalOpen(false)}
        onOk={handleSendDirectPush}
        confirmLoading={sendingPush}
        okText="Gönder"
        cancelText="İptal"
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Input
            placeholder="Bildirim Başlığı"
            value={pushTitle}
            onChange={(e) => setPushTitle(e.target.value)}
          />
          <Input.TextArea
            rows={3}
            placeholder="Mesaj içeriği..."
            value={pushBody}
            onChange={(e) => setPushBody(e.target.value)}
          />
        </Space>
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        title="Kullanıcı Şifresini Sıfırla"
        open={passwordModalOpen}
        onCancel={() => {
          setPasswordModalOpen(false);
          setNewPassword('');
        }}
        onOk={handleResetPassword}
        confirmLoading={savingPassword}
        okText="Şifreyi Güncelle"
        cancelText="İptal"
      >
        <Space direction="vertical" style={{ width: '100%' }} size={10}>
          <Text type="secondary">
            <strong>{record?.email}</strong> hesabı için yeni şifre belirleyin (en az 6 karakter).
          </Text>
          <Input.Password
            placeholder="Yeni şifre"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </Space>
      </Modal>

      {/* Impersonation Modal */}
      <Modal
        title="Geçici Destek Erişim Tokenı"
        open={Boolean(impersonateData)}
        onCancel={() => setImpersonateData(null)}
        footer={[
          <Button
            key="copy"
            type="primary"
            icon={<CopyOutlined />}
            onClick={() => {
              if (impersonateData?.accessToken) {
                navigator.clipboard?.writeText(impersonateData.accessToken);
                message.success('Access Token panoya kopyalandı');
              }
            }}
          >
            Tokenı Kopyala
          </Button>,
          <Button key="close" onClick={() => setImpersonateData(null)}>
            Kapat
          </Button>,
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message={`Hedef Kullanıcı: ${impersonateData?.targetUser?.email || record?.email}`}
            description="Bu erişim denetim kaydına (Audit Log) işlendi."
          />
          <Input.TextArea
            readOnly
            rows={4}
            value={impersonateData?.accessToken || ''}
          />
        </Space>
      </Modal>
    </Show>
  );
}
