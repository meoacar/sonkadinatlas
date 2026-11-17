'use client';

import { Create, useForm } from '@refinedev/antd';
import { Form, Input, Select, InputNumber, Slider, Switch, Row, Col } from 'antd';
import { ZODIAC_OPTIONS, PERIOD_OPTIONS } from '@/lib/astrology';

const { TextArea } = Input;

export default function HoroscopeCreatePage() {
  const { formProps, saveButtonProps } = useForm({
    resource: 'astrology/horoscopes',
    redirect: 'list',
  });

  return (
    <Create saveButtonProps={saveButtonProps} title="Yeni Burç Yorumu (veya Güncelle)">
      <Form
        {...formProps}
        layout="vertical"
        initialValues={{
          sign: 'aries',
          period: 'daily',
          loveScore: 4,
          careerScore: 4,
          healthScore: 4,
          energyScore: 84,
          luckyNumber: 7,
          luckyColor: 'Gül Kurusu',
          isActive: true,
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Burç"
              name="sign"
              rules={[{ required: true, message: 'Burç seçiniz' }]}
            >
              <Select
                options={ZODIAC_OPTIONS.map((z) => ({ value: z.value, label: z.label }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              label="Dönem"
              name="period"
              rules={[{ required: true, message: 'Dönem seçiniz' }]}
            >
              <Select
                options={PERIOD_OPTIONS.map((p) => ({ value: p.value, label: p.label }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Aktif" name="isActive" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Tema Başlığı" name="title">
          <Input placeholder="Örn: Sezgilerin Güçlendiği Parlak Bir Gün" />
        </Form.Item>

        <Form.Item
          label="Genel Yorum Özeti"
          name="summary"
          rules={[{ required: true, message: 'Genel yorum zorunludur' }]}
        >
          <TextArea rows={4} />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item label="Aşk & İlişkiler Yorumu" name="loveText">
              <TextArea rows={3} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Kariyer & Odak Yorumu" name="careerText">
              <TextArea rows={3} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Sağlık & Beden Yorumu" name="healthText">
              <TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Form.Item label="Aşk Puanı (1-5)" name="loveScore">
              <InputNumber min={1} max={5} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item label="Kariyer Puanı (1-5)" name="careerScore">
              <InputNumber min={1} max={5} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item label="Sağlık Puanı (1-5)" name="healthScore">
              <InputNumber min={1} max={5} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item label="Şanslı Sayı" name="luckyNumber">
              <InputNumber min={1} max={99} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Enerji Skoru (0-100)" name="energyScore">
          <Slider min={0} max={100} />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="Şanslı Renk" name="luckyColor">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Şanslı Doğal Taş" name="luckyStone">
              <Input placeholder="Örn: Ay Taşı, Ametist" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Burç Olumlaması" name="affirmation">
          <TextArea rows={2} />
        </Form.Item>
      </Form>
    </Create>
  );
}
