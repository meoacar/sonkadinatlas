'use client';

import { Refine } from '@refinedev/core';
import { RefineThemes, ThemedLayoutV2, useNotificationProvider } from '@refinedev/antd';
import { ConfigProvider } from 'antd';
import trTR from 'antd/locale/tr_TR';
import routerProvider from '@refinedev/nextjs-router';
import { dataProvider } from '@/providers/dataProvider';
import { authProvider } from '@/providers/authProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import {
  UserOutlined,
  SettingOutlined,
  FlagOutlined,
  DashboardOutlined,
  FileTextOutlined,
  BellOutlined,
  CrownOutlined,
  QuestionCircleOutlined,
  BookOutlined,
  HeartOutlined,
  CalendarOutlined,
  BulbOutlined,
  TrophyOutlined,
  WarningOutlined,
  BarChartOutlined,
  TeamOutlined,
  DollarOutlined,
} from '@ant-design/icons';

const trTranslations: Record<string, string> = {
  'buttons.create': 'Oluştur',
  'buttons.save': 'Kaydet',
  'buttons.logout': 'Çıkış Yap',
  'buttons.delete': 'Sil',
  'buttons.edit': 'Düzenle',
  'buttons.cancel': 'İptal',
  'buttons.confirm': 'Emin misiniz?',
  'buttons.filter': 'Filtrele',
  'buttons.clear': 'Temizle',
  'buttons.refresh': 'Yenile',
  'buttons.show': 'Görüntüle',
  'buttons.undo': 'Geri Al',
  'buttons.import': 'İçe Aktar',
  'buttons.export': 'Dışa Aktar',
  'buttons.clone': 'Kopyala',
  'buttons.notAccessTitle': 'Erişim izniniz yok',
  'actions.list': 'Liste',
  'actions.create': 'Oluştur',
  'actions.edit': 'Düzenle',
  'actions.show': 'Detay',
  'table.actions': 'İşlemler',
  'table.inTotal': 'Toplam',
  'warnWhenUnsavedChanges': 'Kaydedilmemiş değişiklikleriniz var. Çıkmak istediğinize emin misiniz?',
  'notifications.success': 'İşlem Başarılı',
  'notifications.error': 'Hata oluştu (kod: {{statusCode}})',
  'notifications.undoable': 'İşlemi geri almak için {{seconds}} saniyeniz var.',
  'notifications.createSuccess': '{{resource}} başarıyla oluşturuldu',
  'notifications.createError': '{{resource}} oluşturulurken hata oluştu (kod: {{statusCode}})',
  'notifications.deleteSuccess': '{{resource}} başarıyla silindi',
  'notifications.deleteError': '{{resource}} silinirken hata oluştu (kod: {{statusCode}})',
  'notifications.editSuccess': '{{resource}} başarıyla güncellendi',
  'notifications.editError': '{{resource}} güncellenirken hata oluştu (kod: {{statusCode}})',
  'notifications.importProgress': 'İçe aktarılıyor: {{processed}}/{{total}}',
  'loading': 'Yükleniyor...',
};

const i18nProvider = {
  translate: (key: string, options?: any, defaultMessage?: string) => {
    let text = trTranslations[key] || defaultMessage || key;
    if (options && typeof options === 'object') {
      Object.keys(options).forEach((k) => {
        text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(options[k]));
      });
    }
    return text;
  },
  changeLocale: async () => {},
  getLocale: () => 'tr',
};
// Monitoring imports (will be enabled after package installation)
// import { initSentry } from '@/lib/sentry';
// import { initPostHog } from '@/lib/posthog';

// Initialize monitoring (will be enabled after package installation)
// initSentry();

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  }));

  // Initialize PostHog on mount (will be enabled after package installation)
  // useEffect(() => {
  //   initPostHog();
  // }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={RefineThemes.Blue} locale={trTR}>
        <Refine
          routerProvider={routerProvider}
          dataProvider={dataProvider}
          authProvider={authProvider}
          notificationProvider={useNotificationProvider}
          i18nProvider={i18nProvider}
          resources={[
            {
              name: 'dashboard',
              list: '/',
              meta: {
                label: 'Kontrol Paneli',
                icon: <DashboardOutlined />,
              },
            },
            {
              name: 'users',
              list: '/users',
              create: '/users/create',
              edit: '/users/edit/:id',
              show: '/users/show/:id',
              meta: {
                label: 'Kullanıcılar',
                icon: <UserOutlined />,
              },
            },
            {
              name: 'user-segmentation',
              list: '/user-segmentation',
              meta: {
                label: 'Kullanıcı Segmentasyonu',
                icon: <TeamOutlined />,
              },
            },
            {
              name: 'subscriptions',
              list: '/subscriptions',
              show: '/subscriptions/show/:id',
              meta: {
                label: 'Abonelikler',
                icon: <CrownOutlined />,
              },
            },
            {
              name: 'financial-dashboard',
              list: '/financial-dashboard',
              meta: {
                label: 'Finansal Panel',
                icon: <DollarOutlined />,
              },
            },
            {
              name: 'qna',
              meta: {
                label: 'Soru & Cevap',
                icon: <QuestionCircleOutlined />,
              },
            },
            {
              name: 'qna/questions',
              list: '/qna/questions',
              show: '/qna/questions/show/:id',
              meta: {
                label: 'Sorular',
                parent: 'qna',
              },
            },
            {
              name: 'qna/answers',
              list: '/qna/answers',
              show: '/qna/answers/show/:id',
              edit: '/qna/answers/edit/:id',
              meta: {
                label: 'Cevaplar',
                parent: 'qna',
              },
            },
            {
              name: 'qna/reports',
              list: '/qna/reports',
              show: '/qna/reports/show/:id',
              meta: {
                label: 'Raporlar',
                parent: 'qna',
              },
            },
            {
              name: 'content',
              meta: {
                label: 'İçerik Yönetimi',
                icon: <BookOutlined />,
              },
            },
            {
              name: 'content/articles',
              list: '/content/articles',
              create: '/content/articles/create',
              edit: '/content/articles/edit/:id',
              meta: {
                label: 'Makaleler',
                parent: 'content',
              },
            },
            {
              name: 'content/pages',
              list: '/pages',
              meta: {
                label: 'Sayfalar',
                parent: 'content',
              },
            },
            {
              name: 'health',
              meta: {
                label: 'Sağlık Takibi',
                icon: <HeartOutlined />,
              },
            },
            {
              name: 'health/cycles',
              list: '/health/cycles',
              show: '/health/cycles/show/:id',
              meta: {
                label: 'Regl Döngüleri',
                parent: 'health',
              },
            },
            {
              name: 'health/pregnancy',
              list: '/health/pregnancy',
              show: '/health/pregnancy/show/:id',
              meta: {
                label: 'Hamilelik',
                parent: 'health',
              },
            },
            {
              name: 'health/wellness',
              list: '/health/wellness',
              meta: {
                label: 'Wellness Verileri',
                parent: 'health',
              },
            },
            {
              name: 'reminders',
              list: '/reminders',
              meta: {
                label: 'Hatırlatıcılar',
                icon: <BellOutlined />,
              },
            },
            {
              name: 'ai',
              meta: {
                label: 'AI Yapılandırması',
                icon: <BulbOutlined />,
              },
            },
            {
              name: 'ai-analytics',
              list: '/ai-analytics',
              meta: {
                label: 'AI Analitiği',
                parent: 'ai',
                icon: <BarChartOutlined />,
              },
            },
            {
              name: 'ai-providers',
              list: '/settings/ai-providers',
              create: '/settings/ai-providers/create',
              edit: '/settings/ai-providers/edit/:id',
              meta: {
                label: 'AI Provider Yönetimi',
                parent: 'ai',
              },
            },
            {
              name: 'ai/model-policies',
              list: '/ai/model-policies',
              create: '/ai/model-policies/create',
              edit: '/ai/model-policies/edit/:id',
              meta: {
                label: 'Model Politikaları',
                parent: 'ai',
              },
            },
            {
              name: 'ai/quotas',
              list: '/ai/quotas',
              meta: {
                label: 'Kullanım Kotaları',
                parent: 'ai',
              },
            },
            {
              name: 'system',
              meta: {
                label: 'Sistem',
                icon: <SettingOutlined />,
              },
            },
            {
              name: 'system/feature-flags',
              list: '/system/feature-flags',
              edit: '/system/feature-flags/edit/:id',
              meta: {
                label: 'Özellik Bayrakları',
                parent: 'system',
              },
            },
            {
              name: 'system/audit-logs',
              list: '/system/audit-logs',
              meta: {
                label: 'Denetim Kayıtları',
                parent: 'system',
              },
            },
          ]}
          options={{
            syncWithLocation: true,
            warnWhenUnsavedChanges: true,
            projectId: 'wellness-admin',
          }}
        >
          <ThemedLayoutV2>
            {children}
          </ThemedLayoutV2>
        </Refine>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
