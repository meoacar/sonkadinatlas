import { notFound } from 'next/navigation';
import { CmsPageClient } from '@/components/CmsPageClient';
import { publicApi, type CmsPage } from '@/lib/api';

export const dynamic = 'force-dynamic';

const DEFAULT_FALLBACKS: Record<
  string,
  { titleTr: string; titleEn: string; contentTr: string; contentEn: string }
> = {
  hakkimizda: {
    titleTr: 'Hakkımızda',
    titleEn: 'About Kadın Atlası',
    contentTr:
      "Kadın Atlası, kadınların regl döngüsü, doğurganlık, hamilelik süreci, günlük wellness alışkanlıkları ve ruhsal dengesini tek bir güvenli platformda takip edebilmesi için tasarlandı.\n\nNOVA AI yapay zeka asistanımız ve uzman içerik kütüphanemizle her kadının bedenini daha yakından tanımasına destek oluyoruz.",
    contentEn:
      'Kadın Atlası empowers women to track menstrual cycles, fertility, pregnancy milestones, and daily wellness routines in a private, science-informed platform.\n\nSupported by our empathetic NOVA AI companion and expert library, we help you live in sync with your body.',
  },
  'gizlilik-politikasi': {
    titleTr: 'Gizlilik Politikası ve KVKK',
    titleEn: 'Privacy Policy',
    contentTr:
      'Sağlık ve döngü verileriniz KVKK kapsamında yüksek güvenlik standartlarıyla korunur. Verileriniz üçüncü taraflara satılmaz.\n\nMobil uygulama içi Ayarlar > Veri ve Gizlilik menüsünden tüm verilerinizi JSON formatında indirebilir veya hesabınızı kalıcı olarak silebilirsiniz.',
    contentEn:
      'Your health and cycle data are protected with strict encryption and privacy-first architecture. We never sell your personal health records.\n\nYou can export or permanently delete your account data anytime inside the mobile app settings.',
  },
  'kullanim-kosullari': {
    titleTr: 'Kullanım Koşulları',
    titleEn: 'Terms of Service',
    contentTr:
      'Kadın Atlası mobil uygulaması ve web sitesi bilgilendirme ve kişisel wellness takibi amacı taşır; tıbbi teşhis veya tedavi yerine geçmez.\n\nHerhangi bir sağlık sorununuzda lütfen uzman bir hekime danışınız.',
    contentEn:
      'Kadın Atlası provides informational tools and personal wellness tracking and does not constitute medical diagnosis or treatment.\n\nAlways consult a qualified healthcare professional for medical concerns.',
  },
};

export default async function CmsDynamicPage({ params }: { params: { slug: string } }) {
  let page: CmsPage | null = null;
  try {
    page = await publicApi.getPageBySlug(params.slug);
  } catch {
    page = null;
  }

  const fb = DEFAULT_FALLBACKS[params.slug];
  if (!page && !fb) {
    notFound();
  }

  return (
    <CmsPageClient
      page={page}
      fallbackTitleTr={fb?.titleTr}
      fallbackTitleEn={fb?.titleEn}
      fallbackContentTr={fb?.contentTr}
      fallbackContentEn={fb?.contentEn}
    />
  );
}
