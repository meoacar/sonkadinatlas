'use client';

import { useEffect, useState } from 'react';
import { Edit, useForm } from '@refinedev/antd';
import {
  Form,
  Input,
  Select,
  Switch,
  Divider,
  InputNumber,
  DatePicker,
  Alert,
  Card,
  Button,
  Row,
  Col,
  Space,
  Tag,
  message,
} from 'antd';
import { CrownOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiClient } from '@/providers/dataProvider';

export default function UserEdit() {
  const { formProps, saveButtonProps, queryResult } = useForm({
    resource: 'users',
    redirect: 'show',
  });

  const record = queryResult?.data?.data as any;
  const currentStatus = Form.useWatch('status', formProps.form);

  const [subForm] = Form.useForm();
  const [subSaving, setSubSaving] = useState(false);

  useEffect(() => {
    if (!record) return;
    subForm.setFieldsValue({
      status: record.subscription?.status || 'FREE',
      tier: record.subscription?.tier || undefined,
      endDate: record.subscription?.endDate ? dayjs(record.subscription.endDate) : null,
      aiMessagesLimit: record.subscription?.aiMessagesLimit ?? 100,
    });
  }, [record, subForm]);

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
          ? 'Abonelik güncellendi ve AI kullanım sayacı sıfırlandı'
          : 'Abonelik bilgileri güncellendi',
      );
      queryResult?.refetch?.();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Abonelik güncellenemedi');
    } finally {
      setSubSaving(false);
    }
  };

  return (
    <Edit saveButtonProps={saveButtonProps} title="Kullanıcı Düzenle">
      <Form {...formProps} layout="vertical">
        {currentStatus === 'SUSPENDED' && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message="Kullanıcı Askıya Alınacak"
            description="Kaydettiğinizde bu kullanıcının mobil uygulama oturumu sonlandırılır ve aktif edilene kadar yeniden giriş yapamaz."
          />
        )}
        {currentStatus === 'DELETED' && (
          <Alert
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
            message="Kullanıcı Silindi Olarak İşaretlenecek"
            description="Kaydettiğinizde kullanıcının uygulamaya erişimi tamamen engellenir."
          />
        )}

        <Divider orientation="left">Hesap Bilgileri</Divider>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="E-posta"
              name="email"
              rules={[
                { required: true, message: 'Lütfen e-posta giriniz' },
                { type: 'email', message: 'Lütfen geçerli bir e-posta giriniz' },
              ]}
            >
              <Input placeholder="ornek@email.com" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Kullanıcı Adı"
              name="username"
              rules={[
                {
                  pattern: /^[a-z0-9._]{3,24}$/,
                  message: '3-24 karakter, sadece küçük harf, rakam, nokta ve alt çizgi',
                },
              ]}
            >
              <Input placeholder="kullaniciadi (opsiyonel)" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Hesap Durumu"
              name="status"
              rules={[{ required: true, message: 'Lütfen durum seçiniz' }]}
            >
              <Select placeholder="Durum seçiniz">
                <Select.Option value="ACTIVE">Aktif</Select.Option>
                <Select.Option value="SUSPENDED">Askıya Alındı</Select.Option>
                <Select.Option value="DELETED">Silindi</Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={12} md={8}>
            <Form.Item
              label="Admin Yetkisi"
              name="isAdmin"
              valuePropName="checked"
              tooltip="Kullanıcıya admin paneline erişim yetkisi verir"
            >
              <Switch checkedChildren="Admin" unCheckedChildren="Kullanıcı" />
            </Form.Item>
          </Col>

          <Col xs={12} md={8}>
            <Form.Item
              label="PIN Koruması"
              name="pinEnabled"
              valuePropName="checked"
              tooltip="Pasif yaptığınızda kullanıcının mevcut PIN kilidi temizlenir ve mobil uygulamaya yansır"
            >
              <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Şifre Değiştirme (Opsiyonel)</Divider>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Yeni Şifre"
              name="newPassword"
              tooltip="Boş bırakırsanız şifre değiştirilmez"
              rules={[{ min: 6, message: 'Şifre en az 6 karakter olmalıdır' }]}
            >
              <Input.Password placeholder="Yeni şifre (opsiyonel)" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Şifre Tekrar"
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const newPassword = getFieldValue('newPassword');
                    if (!newPassword || !value || newPassword === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Şifreler eşleşmiyor!'));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Şifre tekrar" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Profil Bilgileri</Divider>

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item label="Ad" name={['profile', 'firstName']}>
              <Input placeholder="Ad" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Soyad" name={['profile', 'lastName']}>
              <Input placeholder="Soyad" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Görünen Ad" name={['profile', 'displayName']}>
              <Input placeholder="Görünen ad" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Doğum Tarihi"
              name={['profile', 'dateOfBirth']}
              getValueProps={(value) => ({
                value: value ? dayjs(value) : undefined,
              })}
              normalize={(value) => (value ? value.toISOString() : null)}
            >
              <DatePicker
                format="YYYY-MM-DD"
                style={{ width: '100%' }}
                placeholder="Doğum tarihi seçiniz"
              />
            </Form.Item>
          </Col>
          <Col xs={12} md={4}>
            <Form.Item label="Boy (cm)" name={['profile', 'heightCm']}>
              <InputNumber min={0} max={300} style={{ width: '100%' }} placeholder="Boy" />
            </Form.Item>
          </Col>
          <Col xs={12} md={4}>
            <Form.Item label="Kilo (kg)" name={['profile', 'weightKg']}>
              <InputNumber min={0} max={500} style={{ width: '100%' }} placeholder="Kilo" />
            </Form.Item>
          </Col>
          <Col xs={12} md={4}>
            <Form.Item label="Ülke" name={['profile', 'country']}>
              <Input placeholder="TR" />
            </Form.Item>
          </Col>
          <Col xs={12} md={4}>
            <Form.Item label="Saat Dilimi" name={['profile', 'timezone']}>
              <Input placeholder="Europe/Istanbul" />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      {/* Subscription & NOVA AI Quota Management */}
      <Card
        style={{ marginTop: 24 }}
        title={
          <Space>
            <CrownOutlined style={{ color: '#faad14' }} />
            <span>Abonelik & NOVA AI Kota Yönetimi</span>
            {record?.subscription && (
              <Tag color="blue">
                AI Kullanım: {record.subscription.aiMessagesUsed} /{' '}
                {record.subscription.aiMessagesLimit}
              </Tag>
            )}
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
              Aboneliği Güncelle
            </Button>
            <Button
              icon={<ReloadOutlined />}
              loading={subSaving}
              onClick={() => handleSaveSubscription(true)}
            >
              Kaydet ve AI Kullanımını Sıfırla
            </Button>
          </Space>
        </Form>
      </Card>
    </Edit>
  );
}
