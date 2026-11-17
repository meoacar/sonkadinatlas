'use client';

import { Edit, useForm } from '@refinedev/antd';
import { Form, Input, Select, Switch, Row, Col } from 'antd';
import { QNA_CATEGORIES } from '@/lib/community';

const { TextArea } = Input;

export default function QuestionEdit() {
  const { formProps, saveButtonProps, onFinish } = useForm({
    resource: 'qna/questions',
    redirect: 'show',
  });

  const handleFinish = async (values: any) => {
    const payload = {
      ...values,
      tags: Array.isArray(values.tags)
        ? values.tags.slice(0, 5)
        : [],
    };
    return onFinish(payload);
  };

  return (
    <Edit saveButtonProps={saveButtonProps} title="Soruyu Düzenle">
      <Form {...formProps} onFinish={handleFinish} layout="vertical">
        <Form.Item
          label="Başlık"
          name="title"
          rules={[
            { required: true, message: 'Başlık zorunludur' },
            { min: 10, message: 'En az 10 karakter olmalı' },
            { max: 200, message: 'En fazla 200 karakter olabilir' },
          ]}
        >
          <Input />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Kategori"
              name="category"
              rules={[{ required: true, message: 'Kategori seçiniz' }]}
            >
              <Select
                options={QNA_CATEGORIES.map((c) => ({
                  value: c.value,
                  label: c.label,
                }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Durum" name="status">
              <Select
                options={[
                  { value: 'OPEN', label: 'Açık' },
                  { value: 'ANSWERED', label: 'Cevaplandı' },
                  { value: 'CLOSED', label: 'Kapalı' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="İçerik"
          name="content"
          rules={[
            { required: true, message: 'İçerik zorunludur' },
            { min: 20, message: 'En az 20 karakter olmalı' },
            { max: 5000, message: 'En fazla 5000 karakter olabilir' },
          ]}
        >
          <TextArea rows={6} />
        </Form.Item>

        <Form.Item label="Etiketler (En fazla 5 adet)" name="tags">
          <Select mode="tags" maxCount={5} tokenSeparators={[',']} />
        </Form.Item>

        <Row gutter={24}>
          <Col>
            <Form.Item
              label="Öne Çıkan"
              name="isPremium"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col>
            <Form.Item
              label="Anonim"
              name="isAnonymous"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
}
