'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import type { CmsPage } from '@/lib/api';
import { useAppContext } from './AppContext';

function renderInlineBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={idx} className="font-bold text-[var(--text-main)]">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <React.Fragment key={idx}>{part}</React.Fragment>
    ),
  );
}

export function CmsPageClient({
  page,
  fallbackTitleTr,
  fallbackTitleEn,
  fallbackContentTr,
  fallbackContentEn,
}: {
  page: CmsPage | null;
  fallbackTitleTr?: string;
  fallbackTitleEn?: string;
  fallbackContentTr?: string;
  fallbackContentEn?: string;
}) {
  const { locale, t } = useAppContext();

  const title = page
    ? locale === 'en' && page.titleEn
      ? page.titleEn
      : page.titleTr
    : locale === 'en'
      ? fallbackTitleEn || 'Page'
      : fallbackTitleTr || 'Sayfa';

  const content = page
    ? locale === 'en' && page.contentEn
      ? page.contentEn
      : page.contentTr
    : locale === 'en'
      ? fallbackContentEn || ''
      : fallbackContentTr || '';

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-[#7C3AED] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{t.nav.home}</span>
      </Link>

      <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF69B4]">
        <FileText className="h-4 w-4" />
        <span>{t.brand}</span>
      </div>

      <h1 className="mt-2 text-3xl font-extrabold text-[var(--text-main)] sm:text-4xl">{title}</h1>

      <div className="mt-8 space-y-3 rounded-3xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-6 text-sm leading-relaxed text-[var(--text-main)] sm:p-8 sm:text-base">
        {content.split('\n').map((rawLine, i) => {
          const line = rawLine.trim();
          if (!line) return <div key={i} className="h-2" />;
          if (line.startsWith('### ')) {
            return (
              <h3 key={i} className="pt-3 text-lg font-bold text-[var(--text-main)]">
                {line.slice(4)}
              </h3>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h2 key={i} className="pt-4 text-xl font-extrabold text-[var(--text-main)]">
                {line.slice(3)}
              </h2>
            );
          }
          if (line.startsWith('# ')) {
            return (
              <h2 key={i} className="pt-4 text-2xl font-extrabold text-[var(--text-main)]">
                {line.slice(2)}
              </h2>
            );
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <div key={i} className="flex items-start gap-2.5 pl-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF69B4]" />
                <span>{renderInlineBold(line.slice(2))}</span>
              </div>
            );
          }
          return <p key={i}>{renderInlineBold(line)}</p>;
        })}
      </div>
    </div>
  );
}
