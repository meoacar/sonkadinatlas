'use client';

import { Edit, useForm } from '@refinedev/antd';
import { Form, Input, Switch, Radio } from 'antd';
import { useState, useEffect } from 'react';

export default function FeatureFlagEdit() {
  const { formProps, saveButtonProps, queryResult } = useForm({
    resource: 'system/feature-flags',
    action: 'edit',
  });

  const record = queryResult?.data?.data;
  const [mode, setMode] = useState<'boolean' | 'json'>('boolean');

  useEffect(() => {
    if (record && typeof record.valueJson !== 'boolean') {
      setMode('json');
    }
  }, [record]);

  return (
    <Edit saveButtonProps={saveButtonProps} title="Özellik Bayrağı Düzenle">
      <Form {...formProps} layout="vertical">
        <Form.Item label="Özellik Anahtarı (Key)" name="key">
          <Input disabled />
        </Form.Item>

        <Form.Item label="Değer Tipi">
          <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)}>
            <Radio.Button value="boolean">Açık / Kapalı (Boolean)</Radio.Button>
            <Radio.Button value="json">Gelişmiş JSON</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {mode === 'boolean' ? (
          <Form.Item
            label="Durum"
            name="valueJson"
            valuePropName="checked"
            getValueProps={(value) => ({
              checked: Boolean(value),
            })}
          >
            <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
          </Form.Item>
        ) : (
          <Form.Item
            label="JSON Değeri"
            name="valueJson"
            getValueProps={(value) => ({
              value: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
            })}
            normalize={(value) => {
              try {
                return JSON.parse(value);
              } catch {
                return value;
              }
            }}
          >
            <Input.TextArea rows={6} placeholder='{"enabled": true}' />
          </Form.Item>
        )}
      </Form>
    </Edit>
  );
}
