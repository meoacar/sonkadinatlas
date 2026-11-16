'use client';

import { Edit, useForm } from '@refinedev/antd';
import { Form, Input } from 'antd';

export default function AnswerEdit() {
  const { formProps, saveButtonProps } = useForm({
    resource: 'qna/answers',
    action: 'edit',
  });

  return (
    <Edit saveButtonProps={saveButtonProps} title="Cevabı Düzenle">
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="Cevap İçeriği"
          name="content"
          rules={[
            { required: true, message: 'Lütfen cevap içeriği giriniz' },
            { min: 10, message: 'Cevap en az 10 karakter olmalıdır' },
          ]}
        >
          <Input.TextArea rows={8} placeholder="Cevap metni..." />
        </Form.Item>
      </Form>
    </Edit>
  );
}
