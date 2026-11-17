import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import { AppProvider } from '@/components/AppContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { DownloadModal } from '@/components/DownloadModal';
import { publicApi, type Locale, type SiteSummary } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Kadın Atlası — Döngü, Hamilelik, Wellness ve NOVA AI Asistanı',
  description:
    'Regl ve yumurtlama takibi, hafta hafta hamilelik rehberi, günlük su ve 4-7-8 nefes egzersizleri ile bütüncül kadın sağlığı platformu.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const cookieLocale = cookieStore.get('web_locale')?.value;
  const initialLocale: Locale = cookieLocale === 'en' ? 'en' : 'tr';

  let summary: SiteSummary | null = null;
  try {
    summary = await publicApi.getSiteSummary();
  } catch {
    // Graceful fallback during offline/build
  }

  return (
    <html lang={initialLocale}>
      <body className="min-h-screen font-sans antialiased">
        <AppProvider
          initialLocale={initialLocale}
          storeLinks={summary?.storeLinks}
        >
          <Navbar />
          <main>{children}</main>
          <Footer pages={summary?.pages || []} />
          <DownloadModal />
        </AppProvider>
      </body>
    </html>
  );
}
