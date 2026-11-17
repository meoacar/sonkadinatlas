'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, MessageSquareHeart } from 'lucide-react';
import { publicApi } from '@/lib/api';
import { useAppContext } from '@/components/AppContext';

export default function ContactPage() {
  const { locale, t } = useAppContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Web İletişim');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await publicApi.submitContact({
        name,
        email,
        category,
        subject,
        message,
      });
      setSubmittedId(res.id);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setError(err?.message || (locale === 'tr' ? 'Mesaj gönderilemedi.' : 'Failed to send message.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF0F5] px-3.5 py-1 text-xs font-bold text-[#E91E63] dark:bg-[#2a1936] dark:text-[#FF69B4]">
          <MessageSquareHeart className="h-3.5 w-3.5" />
          {t.contact.badge}
        </span>
        <h1 className="mt-3 text-3xl font-extrabold text-[var(--text-main)] sm:text-4xl">
          {t.contact.title}
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--text-muted)] sm:text-base">
          {t.contact.subtitle}
        </p>
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-5">
        <div className="flex flex-col justify-between rounded-3xl border border-[var(--border-soft)] bg-[#FFF0F5] p-6 dark:bg-[#231731] md:col-span-2">
          <div>
            <img
              src="/images/mascots/7.png"
              alt="Kadın Atlası Destek"
              className="mx-auto h-32 w-32 object-contain"
            />
            <h2 className="mt-4 text-lg font-extrabold text-[var(--text-main)]">
              {locale === 'tr' ? 'Doğrudan Destek Hattı' : 'Direct Support Inbox'}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
              {locale === 'tr'
                ? 'Gönderdiğiniz tüm mesajlar Kadın Atlası destek ekibimizin paneline anında iletilir.'
                : 'Every message submitted here goes straight into our support team workspace.'}
            </p>
          </div>
          <div className="mt-6 rounded-2xl bg-[var(--bg-card)] p-4 text-xs text-[var(--text-muted)]">
            <div className="font-bold text-[var(--text-main)]">support@womenswellness.app</div>
            <div className="mt-1">
              {locale === 'tr' ? 'Yanıt süresi: 24 saat içinde' : 'Typical response: under 24h'}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-6 sm:p-8 md:col-span-3">
          {submittedId ? (
            <div className="py-10 text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
              <h3 className="mt-4 text-xl font-extrabold text-[var(--text-main)]">
                {t.contact.successTitle}
              </h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{t.contact.successDesc}</p>
              <button
                type="button"
                onClick={() => setSubmittedId(null)}
                className="mt-6 rounded-xl border border-[var(--border-soft)] px-5 py-2.5 text-xs font-bold text-[var(--text-main)] hover:border-[#FF69B4]"
              >
                {locale === 'tr' ? 'Yeni Mesaj Gönder' : 'Send Another Message'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)]">
                    {t.contact.name}
                  </label>
                  <input
                    required
                    minLength={2}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-page)] px-4 py-2.5 text-sm text-[var(--text-main)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)]">
                    {t.contact.email}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-page)] px-4 py-2.5 text-sm text-[var(--text-main)]"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)]">
                    {t.contact.category}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-page)] px-3 py-2.5 text-sm text-[var(--text-main)]"
                  >
                    <option value="Web İletişim">
                      {locale === 'tr' ? 'Genel Soru' : 'General Question'}
                    </option>
                    <option value="Uygulama Desteği">
                      {locale === 'tr' ? 'Uygulama Desteği' : 'App Support'}
                    </option>
                    <option value="Abonelik">
                      {locale === 'tr' ? 'Premium / Abonelik' : 'Premium / Billing'}
                    </option>
                    <option value="İş Birliği">
                      {locale === 'tr' ? 'İş Birliği / Basın' : 'Partnership / Press'}
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)]">
                    {t.contact.subject}
                  </label>
                  <input
                    required
                    minLength={3}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-page)] px-4 py-2.5 text-sm text-[var(--text-main)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)]">
                  {t.contact.message}
                </label>
                <textarea
                  required
                  minLength={10}
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-page)] px-4 py-2.5 text-sm text-[var(--text-main)]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF69B4] to-[#D946EF] py-3.5 text-sm font-bold text-white shadow-md shadow-pink-500/20 transition hover:opacity-95"
              >
                <Send className="h-4 w-4" />
                <span>{submitting ? t.contact.sending : t.contact.send}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
