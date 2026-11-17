import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { ArticleDetailClient } from '@/components/ArticleDetailClient';
import { publicApi, type Locale } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const article = await publicApi.getArticleById(params.id, 'tr');
    return {
      title: `${article.titleTr || article.title} — Kadın Atlası`,
      description: article.excerpt,
    };
  } catch {
    return {
      title: 'Makale — Kadın Atlası',
    };
  }
}

export default async function ArticleDetailPage({ params }: { params: { id: string } }) {
  const cookieLocale = cookies().get('web_locale')?.value;
  const locale: Locale = cookieLocale === 'en' ? 'en' : 'tr';

  try {
    const article = await publicApi.getArticleById(params.id, locale);
    return <ArticleDetailClient article={article} />;
  } catch {
    notFound();
  }
}
