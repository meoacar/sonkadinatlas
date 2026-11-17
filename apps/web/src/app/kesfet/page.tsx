import { cookies } from 'next/headers';
import { DiscoverClient } from '@/components/DiscoverClient';
import { publicApi, type Locale, type PublicArticle } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function DiscoverPage() {
  const cookieLocale = cookies().get('web_locale')?.value;
  const locale: Locale = cookieLocale === 'en' ? 'en' : 'tr';

  let articles: PublicArticle[] = [];
  try {
    const res = await publicApi.getArticles({ locale, limit: 24, page: 1 });
    articles = res.articles || [];
  } catch {
    articles = [];
  }

  return <DiscoverClient initialArticles={articles} />;
}
