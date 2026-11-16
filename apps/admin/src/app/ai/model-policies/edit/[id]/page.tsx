'use client';

import { Edit, useForm } from '@refinedev/antd';
import { Form, Input, Select, InputNumber } from 'antd';
import { useList } from '@refinedev/core';

const planOptions = [
  { label: 'Ücretsiz (Free)', value: 'free' },
  { label: 'Premium', value: 'premium' },
];

export default function ModelPolicyEdit() {
  const { formProps, saveButtonProps } = useForm({
    resource: 'ai/model-policies',
    action: 'edit',
  });

  const { data: providersData } = useList({
    resource: 'ai-providers',
    pagination: { mode: 'off' },
  });

  const providers = providersData?.data || [];

  function getProviderIcon(provider: string) {
    const icons: Record<string, string> = {
      google: '🔷',
      openai: '🤖',
      anthropic: '🧠',
      deepseek: '⚡',
    };
    return icons[provider] || '❓';
  }

  const providerOptions: Array<{ label: string; value: string; modelName?: string }> =
    providers.length > 0
      ? providers.map((p: any) => ({
          label: `${getProviderIcon(p.provider)} ${p.displayName || p.provider}`,
          value: p.provider,
          modelName: p.modelName,
        }))
      : [
          { label: '🔷 Google Gemini', value: 'google' },
          { label: '🤖 OpenAI', value: 'openai' },
          { label: '🧠 Anthropic', value: 'anthropic' },
          { label: '⚡ DeepSeek', value: 'deepseek' },
        ];

  return (
    <Edit saveButtonProps={saveButtonProps} title="Model Politikası Düzenle">
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="Abonelik Planı"
          name="plan"
          rules={[{ required: true, message: 'Lütfen abonelik planı seçiniz' }]}
        >
          <Select size="large" options={planOptions} placeholder="Abonelik planı seçiniz" />
        </Form.Item>

        <Form.Item
          label="AI Sağlayıcı"
          name="provider"
          rules={[{ required: true, message: 'Lütfen sağlayıcı seçiniz' }]}
        >
          <Select
            size="large"
            options={providerOptions}
            placeholder="AI sağlayıcı seçiniz"
            onChange={(value) => {
              const selectedProvider = providers.find((p: any) => p.provider === value);
              if (selectedProvider?.modelName) {
                formProps.form?.setFieldValue('modelName', selectedProvider.modelName);
              }
            }}
          />
        </Form.Item>

        <Form.Item
          label="Model Adı"
          name="modelName"
          rules={[{ required: true, message: 'Lütfen model adı giriniz' }]}
        >
          <Input size="large" placeholder="Örn: gemini-2.5-flash" />
        </Form.Item>

        <Form.Item
          label="Sıcaklık (Temperature)"
          name="temperature"
          rules={[{ required: true, message: 'Lütfen sıcaklık değeri giriniz' }]}
          tooltip="Yaratıcılık seviyesi (0.0 = deterministik, 1.0 = yaratıcı)"
        >
          <InputNumber
            size="large"
            min={0}
            max={2}
            step={0.1}
            style={{ width: '100%' }}
            placeholder="0.0 - 2.0"
          />
        </Form.Item>

        <Form.Item
          label="Maksimum Token"
          name="maxTokens"
          rules={[{ required: true, message: 'Lütfen maksimum token sayısı giriniz' }]}
          tooltip="Yanıtta üretilebilecek maksimum token sayısı"
        >
          <InputNumber
            size="large"
            min={1}
            max={32000}
            style={{ width: '100%' }}
            placeholder="1 - 32000"
          />
        </Form.Item>

        <Form.Item
          label="Etkin Araçlar (JSON)"
          name="toolsEnabledJson"
          getValueProps={(value) => ({
            value: typeof value === 'string' ? value : JSON.stringify(value || []),
          })}
          normalize={(value) => {
            try {
              return JSON.parse(value);
            } catch {
              return value;
            }
          }}
        >
          <Input.TextArea rows={3} placeholder='["web_search", "calculator"]' />
        </Form.Item>
      </Form>
    </Edit>
  );
}
