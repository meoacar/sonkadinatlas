'use client';

import { Create, useForm } from '@refinedev/antd';
import { Form, Input, Select, Switch, Divider, InputNumber, DatePicker } from 'antd';
import dayjs from 'dayjs';

export default function UserCreate() {
  const { formProps, saveButtonProps } = useForm({
    resource: 'users',
  });

  return (
    <Create saveButtonProps={saveButtonProps} title="Yeni Kullanıcı Oluştur">
      <Form {...formProps} layout="vertical">
        <Divider orientation="left">Hesap Bilgileri</Divider>

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

        <Form.Item
          label="Kullanıcı Adı"
          name="username"
          rules={[{ required: true, message: 'Lütfen kullanıcı adı giriniz' }]}
        >
          <Input placeholder="kullaniciadi" />
        </Form.Item>

        <Form.Item
          label="Şifre"
          name="password"
          rules={[
            { required: true, message: 'Lütfen şifre giriniz' },
            { min: 6, message: 'Şifre en az 6 karakter olmalıdır' },
          ]}
        >
          <Input.Password placeholder="En az 6 karakterli şifre" />
        </Form.Item>

        <Form.Item
          label="Hesap Durumu"
          name="status"
          initialValue="ACTIVE"
          rules={[{ required: true, message: 'Lütfen durum seçiniz' }]}
        >
          <Select placeholder="Durum seçiniz">
            <Select.Option value="ACTIVE">Aktif</Select.Option>
            <Select.Option value="SUSPENDED">Askıya Alındı</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Admin Yetkisi"
          name="isAdmin"
          valuePropName="checked"
          initialValue={false}
          tooltip="Kullanıcıya admin paneline erişim yetkisi verir"
        >
          <Switch checkedChildren="Admin" unCheckedChildren="Kullanıcı" />
        </Form.Item>

        <Divider orientation="left">Profil Bilgileri</Divider>

        <Form.Item label="Ad" name={['profile', 'firstName']}>
          <Input placeholder="Ad" />
        </Form.Item>

        <Form.Item label="Soyad" name={['profile', 'lastName']}>
          <Input placeholder="Soyad" />
        </Form.Item>

        <Form.Item label="Görünen Ad" name={['profile', 'displayName']}>
          <Input placeholder="Görünen ad" />
        </Form.Item>

        <Form.Item
          label="Doğum Tarihi"
          name={['profile', 'dateOfBirth']}
          getValueProps={(value) => ({
            value: value ? dayjs(value) : undefined,
          })}
          normalize={(value) => value && value.toISOString()}
        >
          <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} placeholder="Doğum tarihi seçiniz" />
        </Form.Item>

        <Form.Item label="Boy (cm)" name={['profile', 'heightCm']}>
          <InputNumber min={0} max={300} style={{ width: '100%' }} placeholder="Boy (cm)" />
        </Form.Item>

        <Form.Item label="Kilo (kg)" name={['profile', 'weightKg']}>
          <InputNumber min={0} max={500} style={{ width: '100%' }} placeholder="Kilo (kg)" />
        </Form.Item>

        <Form.Item label="Ülke" name={['profile', 'country']} initialValue="TR">
          <Input placeholder="Ülke" />
        </Form.Item>

        <Form.Item label="Saat Dilimi" name={['profile', 'timezone']} initialValue="Europe/Istanbul">
          <Input placeholder="Europe/Istanbul" />
        </Form.Item>
      </Form>
    </Create>
  );
}
