import type { MetadataRoute } from 'next';
import { publicApi } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/hesaplayicilar`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/kesfet`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/premium`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/iletisim`, changeFrequency: 'monthly', priority: 0.6 },
  ];

  try {
    const [articlesRes, pages] = await Promise.all([
      publicApi.getArticles({ locale: 'tr', limit: 50, page: 1 }),
      publicApi.getPages(),
    ]);

    const articleRoutes: MetadataRoute.Sitemap = (articlesRes.articles || []).map((a) => ({
      url: `${SITE_URL}/kesfet/${a.id}`,
      lastModified: a.publishedAt ? new Date(a.publishedAt) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    const pageRoutes: MetadataRoute.Sitemap = (pages || []).map((p) => ({
      url: `${SITE_URL}/sayfa/${p.slug}`,
      changeFrequency: 'monthly',
      priority: 0.5,
    }));

    return [...staticRoutes, ...articleRoutes, ...pageRoutes];
  } catch {
    return staticRoutes;
  }
}
