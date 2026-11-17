'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Form,
  Input,
  Select,
  Slider,
  Switch,
  Button,
  Space,
  Typography,
  Spin,
  message,
} from 'antd';
import {
  StarOutlined,
  SaveOutlined,
  CompassOutlined,
  ReloadOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/providers/dataProvider';
import { MOON_PHASES, ZODIAC_OPTIONS } from '@/lib/astrology';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function CosmicSkyAdminPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const loadCosmic = useCallback(async () => {
    setLoading(true);
    try {
      const [cosmicRes, statsRes] = await Promise.all([
        apiClient.get('/astrology/admin/cosmic'),
        apiClient.get('/astrology/admin/stats'),
      ]);

      form.setFieldsValue(cosmicRes.data);
      setStats(statsRes.data);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Kozmik veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    loadCosmic();
  }, [loadCosmic]);

  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      await apiClient.put('/astrology/admin/cosmic', values);
      message.success('Kozmik gökyüzü ve Ay evresi güncellendi');
      loadCosmic();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Kozmik Gökyüzü & Ay Evresi Yönetimi
          </Title>
          <Text type="secondary">
            Mobil Astroloji ekranının üst bandında görünen Ay evresi, günlük tema ve olumlama mesajını yönetin
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadCosmic}>
            Yenile
          </Button>
          <Button
            type="primary"
            icon={<UnorderedListOutlined />}
            onClick={() => router.push('/astrology/horoscopes')}
          >
            Burç Yorumlarını Yönet
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Toplam Yorum"
              value={stats?.totalHoroscopes ?? 0}
              prefix={<StarOutlined style={{ color: '#ec4899' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Aktif Yorum"
              value={stats?.activeHoroscopes ?? 0}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Kapsanan Burç"
              value={stats?.coveredSigns ?? 0}
              suffix="/ 12"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Kayıtlı Doğum Haritası"
              value={stats?.savedBirthCharts ?? 0}
              prefix={<CompassOutlined style={{ color: '#8b5cf6' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Günün Kozmik Gökyüzü Ayarları">
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                label="Ay Evresi"
                name="moonPhase"
                rules={[{ required: true, message: 'Ay evresi seçiniz' }]}
              >
                <Select
                  options={MOON_PHASES.map((p) => ({ value: p, label: p }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="Ay Hangi Burçta?"
                name="moonSign"
                rules={[{ required: true, message: 'Ay burcu seçiniz' }]}
              >
                <Select
                  options={ZODIAC_OPTIONS.map((z) => ({
                    value: z.nameTr,
                    label: z.label,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="Aktif Olarak Göster" name="isActive" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Kozmik Tema Başlığı"
            name="cosmicTheme"
            rules={[{ required: true, message: 'Tema başlığı zorunludur' }]}
          >
            <Input placeholder="Örn: Sezgisel Dengelenme ve Nazik Başlangıçlar" />
          </Form.Item>

          <Form.Item label="Enerji Endeksi (0 - 100)" name="energyIndex">
            <Slider min={0} max={100} marks={{ 0: '0', 50: '50', 100: '100' }} />
          </Form.Item>

          <Form.Item label="Gezegen & Retro Notu" name="retrogradeNote">
            <TextArea
              rows={2}
              placeholder="Örn: Merkür doğrudan harekette; iletişim ve planlama için akıcı bir gün..."
            />
          </Form.Item>

          <Form.Item
            label="Günün Olumlaması"
            name="dailyAffirmation"
            rules={[{ required: true, message: 'Olumlama mesajı zorunludur' }]}
          >
            <TextArea
              rows={2}
              placeholder="Örn: Bedenimin ritmine kulak veriyor, bugünü huzurla kucaklıyorum."
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={saving}
            size="large"
          >
            Kozmik Ayarları Kaydet
          </Button>
        </Form>
      </Card>
    </div>
  );
}
