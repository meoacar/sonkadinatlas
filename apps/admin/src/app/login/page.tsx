'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Space, Switch } from 'antd';
import {
  LockOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons';
import { useLogin } from '@refinedev/core';
import { useAdminTheme } from '@/providers/themeContext';

const { Title, Text } = Typography;

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

export default function LoginPage() {
  const { mutate: login, isLoading } = useLogin();
  const { isDark, toggleTheme } = useAdminTheme();
  const [form] = Form.useForm();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutLeft, setLockoutLeft] = useState(0);
  const [capsLockOn, setCapsLockOn] = useState(false);

  useEffect(() => {
    if (lockoutLeft <= 0) return;
    const timer = setInterval(() => {
      setLockoutLeft((prev) => {
        if (prev <= 1) {
          setFailedAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutLeft]);

  const handleKeyEvent = (e: React.KeyboardEvent) => {
    if (typeof e.getModifierState === 'function') {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const handleFinish = (values: { email: string; password: string }) => {
    if (lockoutLeft > 0) return;
    setErrorMessage(null);

    login(
      {
        email: values.email.trim(),
        password: values.password,
      },
      {
        onSuccess: (data) => {
          if (!data?.success) {
            const nextAttempts = failedAttempts + 1;
            setFailedAttempts(nextAttempts);
            if (nextAttempts >= MAX_ATTEMPTS) {
              setLockoutLeft(LOCKOUT_SECONDS);
              setErrorMessage(
                `Çok fazla hatalı giriş denemesi. Güvenlik nedeniyle ${LOCKOUT_SECONDS} saniye bekleyin.`,
              );
            } else {
              setErrorMessage(
                data?.error?.message || 'E-posta, şifre hatalı veya yönetici yetkiniz yok.',
              );
            }
          }
        },
        onError: (err: any) => {
          const nextAttempts = failedAttempts + 1;
          setFailedAttempts(nextAttempts);
          if (nextAttempts >= MAX_ATTEMPTS) {
            setLockoutLeft(LOCKOUT_SECONDS);
          }
          setErrorMessage(err?.message || 'Giriş sırasında bir hata oluştu.');
        },
      },
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        position: 'relative',
        background: isDark
          ? 'radial-gradient(circle at 15% 20%, rgba(124, 58, 237, 0.22), transparent 45%), radial-gradient(circle at 85% 80%, rgba(236, 72, 153, 0.16), transparent 48%), #0f1117'
          : 'radial-gradient(circle at 15% 20%, rgba(124, 58, 237, 0.14), transparent 42%), radial-gradient(circle at 85% 80%, rgba(236, 72, 153, 0.12), transparent 45%), #f6f7fb',
      }}
    >
      <div
        onClick={toggleTheme}
        style={{
          position: 'absolute',
          top: 20,
          right: 24,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderRadius: 999,
          border: isDark ? '1px solid #272c3a' : '1px solid rgba(15,23,42,0.1)',
          background: isDark ? '#171a23' : '#ffffff',
          cursor: 'pointer',
        }}
      >
        {isDark ? (
          <MoonOutlined style={{ color: '#a78bfa' }} />
        ) : (
          <SunOutlined style={{ color: '#f59e0b' }} />
        )}
        <Switch size="small" checked={isDark} onChange={toggleTheme} />
      </div>

      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              margin: '0 auto 14px',
              background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 25px rgba(124, 58, 237, 0.25)',
            }}
          >
            <SafetyCertificateOutlined style={{ fontSize: 28, color: '#ffffff' }} />
          </div>
          <Title level={3} style={{ margin: 0, fontWeight: 700, color: isDark ? '#e6e8f0' : '#111827' }}>
            NOVA Wellness Yönetim
          </Title>
          <Text type="secondary" style={{ fontSize: 13.5 }}>
            Yetkili Yönetici Oturum Açma Ekranı
          </Text>
        </div>

        <Card
          variant="borderless"
          style={{
            borderRadius: 20,
            boxShadow: '0 14px 40px rgba(15, 23, 42, 0.08)',
            border: '1px solid rgba(15, 23, 42, 0.06)',
          }}
          styles={{ body: { padding: 28 } }}
        >
          {errorMessage && (
            <Alert
              type="error"
              showIcon
              message={errorMessage}
              style={{ marginBottom: 18, borderRadius: 10 }}
            />
          )}

          {capsLockOn && (
            <Alert
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              message="Caps Lock açık. Şifrenizi büyük/küçük harfe dikkat ederek girin."
              style={{ marginBottom: 16, borderRadius: 10 }}
            />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            requiredMark={false}
            size="large"
          >
            <Form.Item
              label={<Text strong>Yönetici E-posta</Text>}
              name="email"
              rules={[
                { required: true, message: 'Lütfen yönetici e-posta adresini girin.' },
                { type: 'email', message: 'Geçerli bir e-posta adresi girin.' },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#9CA3AF' }} />}
                placeholder="yonetici@domain.com"
                autoComplete="username"
                disabled={isLoading || lockoutLeft > 0}
              />
            </Form.Item>

            <Form.Item
              label={<Text strong>Şifre</Text>}
              name="password"
              rules={[
                { required: true, message: 'Lütfen şifrenizi girin.' },
                { min: 6, message: 'Şifre en az 6 karakter olmalıdır.' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#9CA3AF' }} />}
                placeholder="••••••••"
                autoComplete="current-password"
                onKeyUp={handleKeyEvent}
                disabled={isLoading || lockoutLeft > 0}
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={isLoading}
              disabled={lockoutLeft > 0}
              style={{
                height: 44,
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 15,
                marginTop: 6,
                background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                border: 'none',
              }}
            >
              {lockoutLeft > 0 ? `Bekleyin (${lockoutLeft} sn)` : 'Güvenli Giriş Yap'}
            </Button>
          </Form>

          <div
            style={{
              marginTop: 20,
              paddingTop: 14,
              borderTop: '1px solid #F1F5F9',
              textAlign: 'center',
            }}
          >
            <Space size={6}>
              <LockOutlined style={{ color: '#10B981', fontSize: 12 }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Rol doğrulamalı JWT oturum koruması aktif
              </Text>
            </Space>
          </div>
        </Card>
      </div>
    </div>
  );
}
