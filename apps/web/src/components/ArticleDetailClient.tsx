'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Share2, Check, Smartphone } from 'lucide-react';
import type { PublicArticle } from '@/lib/api';
import { useAppContext } from './AppContext';
import { CATEGORY_LABELS } from '@/lib/i18n';

export function ArticleDetailClient({ article }: { article: PublicArticle }) {
  const { locale, t, openDownloadModal } = useAppContext();
  const [copied, setCopied] = useState(false);

  const title =
    locale === 'en' && article.titleEn ? article.titleEn : article.titleTr || article.title;
  const content =
    locale === 'en' && article.contentEn
      ? article.contentEn
      : article.contentTr || article.content || article.excerpt;
  const catLabel = CATEGORY_LABELS[locale][article.category] || article.category;

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Fallback to copy
      }
    }
    if (navigator.clipboard && url) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/kesfet"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-[#7C3AED] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{t.discover.backToList}</span>
      </Link>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs">
          <span className="rounded-full bg-[#FFF0F5] px-3 py-1 font-bold text-[#E91E63] dark:bg-[#2a1936] dark:text-[#FF69B4]">
            {catLabel}
          </span>
          <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
            <Clock className="h-3.5 w-3.5" />
            {article.readTimeMin} {t.discover.readTime}
          </span>
        </div>
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] px-3.5 py-1.5 text-xs font-bold text-[var(--text-main)] hover:border-[#FF69B4]"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
          <span>{copied ? (locale === 'tr' ? 'Kopyalandı' : 'Copied') : locale === 'tr' ? 'Paylaş' : 'Share'}</span>
        </button>
      </div>

      <h1 className="mt-5 text-3xl font-extrabold leading-tight text-[var(--text-main)] sm:text-4xl">
        {title}
      </h1>

      <div className="mt-4 flex items-center gap-3 text-xs text-[var(--text-muted)]">
        {article.author && <span>✍️ {article.author}</span>}
        <span>
          📅{' '}
          {new Date(article.publishedAt).toLocaleDateString(
            locale === 'tr' ? 'tr-TR' : 'en-US',
            { day: 'numeric', month: 'long', year: 'numeric' },
          )}
        </span>
      </div>

      <div className="mt-8 space-y-4 rounded-3xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-6 text-base leading-relaxed text-[var(--text-main)] sm:p-8">
        {content.split('\n').map((paragraph, i) =>
          paragraph.trim() ? (
            <p key={i} className="whitespace-pre-line">
              {paragraph}
            </p>
          ) : (
            <div key={i} className="h-2" />
          ),
        )}
      </div>

      {article.tags && article.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-1 text-xs font-medium text-[var(--text-muted)]"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* App Promo */}
      <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-3xl bg-gradient-to-r from-[#FF69B4] to-[#7C3AED] p-6 text-white sm:flex-row sm:items-center">
        <div>
          <h3 className="text-base font-extrabold">
            {locale === 'tr'
              ? 'Bu konuyu NOVA AI asistanına sor!'
              : 'Ask NOVA AI about this topic!'}
          </h3>
          <p className="mt-1 text-xs text-white/90">
            {locale === 'tr'
              ? 'Kadın Atlası mobil uygulamasında makaleleri kaydet ve kişisel rehberlik al.'
              : 'Save articles and get personalized guidance inside the Kadın Atlası app.'}
          </p>
        </div>
        <button
          type="button"
          onClick={openDownloadModal}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-[#E91E63]"
        >
          <Smartphone className="h-4 w-4" />
          <span>{t.nav.download}</span>
        </button>
      </div>

      {article.relatedArticles && article.relatedArticles.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-extrabold text-[var(--text-main)]">
            {t.discover.relatedTitle}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {article.relatedArticles.map((rel) => (
              <Link
                key={rel.id}
                href={`/kesfet/${rel.id}`}
                className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 transition hover:border-[#FF69B4]"
              >
                <h3 className="line-clamp-2 text-sm font-bold text-[var(--text-main)]">
                  {locale === 'en' && rel.titleEn ? rel.titleEn : rel.titleTr || rel.title}
                </h3>
                <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                  {rel.readTimeMin} {t.discover.readTime}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
