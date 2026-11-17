'use client';

import { useState } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { apiClient } from '@/providers/dataProvider';

const { TextArea } = Input;

export type BulkSendMode = 'notification' | 'email';

interface BulkSendModalProps {
  open: boolean;
  mode: BulkSendMode;
  userIds: string[];
  onClose: () => void;
  onSuccess?: () => void;
}

export function BulkSendModal({
  open,
  mode,
  userIds,
  onClose,
  onSuccess,
}: BulkSendModalProps) {
  const [form] = Form.useForm();
  const [sending, setSending] = useState(false);

  const isEmail = mode === 'email';

  const handleSubmit = async (values: { title: string; body: string }) => {
    if (userIds.length === 0) {
      message.warning('En az bir kullanıcı seçin');
      return;
    }

    setSending(true);
    try {
      const endpoint = isEmail
        ? '/admin/bulk/send-emails'
        : '/admin/bulk/send-notifications';
      const payload = isEmail
        ? {
            userIds,
            email: {
              subject: values.title.trim(),
              body: values.body.trim(),
            },
          }
        : {
            userIds,
            notification: {
              title: values.title.trim(),
              body: values.body.trim(),
            },
          };

      const { data } = await apiClient.post(endpoint, payload);
      const ok = data?.success ?? userIds.length;
      const fail = data?.failed ?? 0;

      if (fail > 0) {
        message.warning(`${ok} gönderildi, ${fail} başarısız oldu`);
      } else {
        message.success(
          isEmail
            ? `${ok} kullanıcıya e-posta gönderildi`
            : `${ok} kullanıcıya bildirim gönderildi`,
        );
      }
      form.resetFields();
      onClose();
      onSuccess?.();
    } catch (err: any) {
      message.error(
        err?.response?.data?.message || 'Gönderim sırasında bir hata oluştu',
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      open={open}
      title={
        isEmail
          ? `Toplu E-posta Gönder (${userIds.length} kişi)`
          : `Toplu Bildirim Gönder (${userIds.length} kişi)`
      }
      okText="Gönder"
      cancelText="İptal"
      confirmLoading={sending}
      onCancel={() => {
        if (!sending) {
          form.resetFields();
          onClose();
        }
      }}
      onOk={() => form.submit()}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="title"
          label={isEmail ? 'E-posta Konusu' : 'Bildirim Başlığı'}
          rules={[{ required: true, message: 'Bu alan zorunludur' }]}
        >
          <Input
            placeholder={
              isEmail
                ? 'Örn: Kadın Atlası Haftalık Güncellemesi'
                : 'Örn: Bugünkü check-in zamanı!'
            }
          />
        </Form.Item>

        <Form.Item
          name="body"
          label={isEmail ? 'E-posta İçeriği' : 'Bildirim Mesajı'}
          rules={[{ required: true, message: 'İçerik zorunludur' }]}
        >
          <TextArea
            rows={4}
            placeholder={
              isEmail
                ? 'Kullanıcılara iletilecek e-posta metni...'
                : 'Kullanıcıların hatırlatıcı akışına düşecek mesaj...'
            }
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
