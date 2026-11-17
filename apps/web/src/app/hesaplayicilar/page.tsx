'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Calendar,
  Baby,
  Droplets,
  Scale,
  Flame,
  Sparkles,
  Smartphone,
  AlertCircle,
} from 'lucide-react';
import { publicApi } from '@/lib/api';
import { useAppContext } from '@/components/AppContext';

type CalcTab = 'cycle' | 'pregnancy' | 'water' | 'bmi' | 'bmr';

const PHASE_META: Record<
  string,
  { tr: string; en: string; descTr: string; descEn: string; color: string }
> = {
  MENSTRUAL: {
    tr: 'Menstrual Faz',
    en: 'Menstrual Phase',
    descTr: 'Dinlenme, sıcak bitki çayları ve demir zengini beslenme önerilir.',
    descEn: 'Rest, gentle movement, and iron-rich nutrition are helpful.',
    color: 'bg-pink-500/15 text-pink-600 dark:text-pink-400',
  },
  FOLLICULAR: {
    tr: 'Foliküler Faz',
    en: 'Follicular Phase',
    descTr: 'Enerjinin yükselmeye başladığı, yeni rutinler için ideal dönem.',
    descEn: 'Rising energy and focus — ideal for strength and new habits.',
    color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  },
  OVULATION: {
    tr: 'Ovulasyon Fazı',
    en: 'Ovulation Phase',
    descTr: 'Doğurganlık zirvede! Bol su içmeyi ve vücut sinyallerini izlemeyi unutma.',
    descEn: 'Peak fertility window! Stay hydrated and track body cues.',
    color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  },
  LUTEAL: {
    tr: 'Luteal Faz',
    en: 'Luteal Phase',
    descTr: 'Kompleks karbonhidratlar, magnezyum ve sakinleştirici nefes egzersizleri iyi gelir.',
    descEn: 'Focus on magnesium, steady sleep, and calming 4-7-8 breathing.',
    color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  },
};

function CalculatorsContent() {
  const searchParams = useSearchParams();
  const { locale, t, openDownloadModal } = useAppContext();

  const initialTab = (searchParams.get('tab') as CalcTab) || 'cycle';
  const [tab, setTab] = useState<CalcTab>(
    ['cycle', 'pregnancy', 'water', 'bmi', 'bmr'].includes(initialTab) ? initialTab : 'cycle',
  );

  useEffect(() => {
    const param = searchParams.get('tab') as CalcTab | null;
    if (param && ['cycle', 'pregnancy', 'water', 'bmi', 'bmr'].includes(param)) {
      setTab(param);
    }
  }, [searchParams]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cycle inputs & result
  const [lastPeriodDate, setLastPeriodDate] = useState(() => {
    const d = new Date(Date.now() - 10 * 86400000);
    return d.toISOString().split('T')[0];
  });
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [cycleResult, setCycleResult] = useState<any>(null);

  // Pregnancy inputs & result
  const [pregMode, setPregMode] = useState<'lmp' | 'due'>('lmp');
  const [pregDate, setPregDate] = useState(() => {
    const d = new Date(Date.now() - 90 * 86400000);
    return d.toISOString().split('T')[0];
  });
  const [pregResult, setPregResult] = useState<any>(null);

  // Water inputs & result
  const [waterWeight, setWaterWeight] = useState(60);
  const [waterActivity, setWaterActivity] = useState<'sedentary' | 'moderate' | 'active'>('moderate');
  const [waterClimate, setWaterClimate] = useState<'cool' | 'temperate' | 'hot'>('temperate');
  const [waterResult, setWaterResult] = useState<any>(null);

  // BMI inputs & result
  const [bmiWeight, setBmiWeight] = useState(60);
  const [bmiHeight, setBmiHeight] = useState(165);
  const [bmiResult, setBmiResult] = useState<any>(null);

  // BMR inputs & result
  const [bmrAge, setBmrAge] = useState(28);
  const [bmrSex, setBmrSex] = useState<'female' | 'male'>('female');
  const [bmrWeight, setBmrWeight] = useState(60);
  const [bmrHeight, setBmrHeight] = useState(165);
  const [bmrActivity, setBmrActivity] = useState<
    'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  >('moderate');
  const [bmrResult, setBmrResult] = useState<any>(null);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const runCycle = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await publicApi.calculateCycle({
        lastPeriodDate,
        cycleLength,
        periodLength,
      });
      setCycleResult(res);
    } catch (err: any) {
      setError(err?.message || 'Hesaplama başarısız');
    } finally {
      setLoading(false);
    }
  };

  const runPregnancy = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await publicApi.calculatePregnancy(
        pregMode === 'lmp' ? { lmpDate: pregDate } : { dueDate: pregDate },
      );
      setPregResult(res);
    } catch (err: any) {
      setError(err?.message || 'Hesaplama başarısız');
    } finally {
      setLoading(false);
    }
  };

  const runWater = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await publicApi.calculateWater({
        weightKg: waterWeight,
        activity: waterActivity,
        climate: waterClimate,
      });
      setWaterResult(res);
    } catch (err: any) {
      setError(err?.message || 'Hesaplama başarısız');
    } finally {
      setLoading(false);
    }
  };

  const runBMI = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await publicApi.calculateBMI({ weightKg: bmiWeight, heightCm: bmiHeight });
      setBmiResult(res);
    } catch (err: any) {
      setError(err?.message || 'Hesaplama başarısız');
    } finally {
      setLoading(false);
    }
  };

  const runBMR = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await publicApi.calculateBMR({
        ageYears: bmrAge,
        sex: bmrSex,
        weightKg: bmrWeight,
        heightCm: bmrHeight,
        activityLevel: bmrActivity,
      });
      setBmrResult(res);
    } catch (err: any) {
      setError(err?.message || 'Hesaplama başarısız');
    } finally {
      setLoading(false);
    }
  };

  // Auto-calculate initial preview on tab open
  useEffect(() => {
    setError(null);
    if (tab === 'cycle' && !cycleResult) runCycle();
    if (tab === 'pregnancy' && !pregResult) runPregnancy();
    if (tab === 'water' && !waterResult) runWater();
    if (tab === 'bmi' && !bmiResult) runBMI();
    if (tab === 'bmr' && !bmrResult) runBMR();
  }, [tab]);

  const tabItems: Array<{ key: CalcTab; label: string; icon: React.ReactNode }> = [
    { key: 'cycle', label: t.calculators.tabs.cycle, icon: <Calendar className="h-4 w-4" /> },
    { key: 'pregnancy', label: t.calculators.tabs.pregnancy, icon: <Baby className="h-4 w-4" /> },
    { key: 'water', label: t.calculators.tabs.water, icon: <Droplets className="h-4 w-4" /> },
    { key: 'bmi', label: t.calculators.tabs.bmi, icon: <Scale className="h-4 w-4" /> },
    { key: 'bmr', label: t.calculators.tabs.bmr, icon: <Flame className="h-4 w-4" /> },
  ];

  const bmiCategoryText = (cat: string) => {
    const map: Record<string, { tr: string; en: string; color: string }> = {
      underweight: { tr: 'Zayıf', en: 'Underweight', color: 'text-sky-500' },
      normal: { tr: 'Normal Aralık', en: 'Normal Weight', color: 'text-emerald-500' },
      overweight: { tr: 'Fazla Kilolu', en: 'Overweight', color: 'text-amber-500' },
      obese: { tr: 'Obez', en: 'Obese', color: 'text-rose-500' },
    };
    const item = map[cat] || map.normal;
    return { text: locale === 'tr' ? item.tr : item.en, color: item.color };
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF0F5] px-3.5 py-1 text-xs font-bold text-[#E91E63] dark:bg-[#2a1936] dark:text-[#FF69B4]">
          <Sparkles className="h-3.5 w-3.5" />
          {t.calculators.badge}
        </span>
        <h1 className="mt-3 text-3xl font-extrabold text-[var(--text-main)] sm:text-4xl">
          {t.calculators.title}
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-[var(--text-muted)] sm:text-base">
          {t.calculators.subtitle}
        </p>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {tabItems.map((item) => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition ${
                active
                  ? 'bg-gradient-to-r from-[#FF69B4] to-[#D946EF] text-white shadow-md shadow-pink-500/20'
                  : 'border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-main)] hover:border-[#FF69B4]'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mt-6 flex items-center gap-2 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Calculator Body */}
      <div className="mt-8 rounded-3xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-6 shadow-sm sm:p-8">
        {/* 1. CYCLE */}
        {tab === 'cycle' && (
          <div className="grid gap-8 md:grid-cols-2">
            <form onSubmit={runCycle} className="space-y-4">
              <h2 className="text-xl font-extrabold text-[var(--text-main)]">
                {t.calculators.tabs.cycle}
              </h2>
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)]">
                  {locale === 'tr' ? 'Son Adet Başlangıç Tarihi' : 'Last Period Start Date'}
                </label>
                <input
                  type="date"
                  value={lastPeriodDate}
                  onChange={(e) => setLastPeriodDate(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-page)] px-4 py-2.5 text-sm text-[var(--text-main)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)]">
                    {locale === 'tr' ? 'Ortalama Döngü (Gün)' : 'Cycle Length (Days)'}
                  </label>
                  <input
                    type="number"
                    min={20}
                    max={45}
                    value={cycleLength}
                    onChange={(e) => setCycleLength(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-page)] px-4 py-2.5 text-sm text-[var(--text-main)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)]">
                    {locale === 'tr' ? 'Kanama Süresi (Gün)' : 'Period Length (Days)'}
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={periodLength}
                    onChange={(e) => setPeriodLength(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-page)] px-4 py-2.5 text-sm text-[var(--text-main)]"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-[#FF69B4] to-[#D946EF] py-3 text-sm font-bold text-white transition hover:opacity-95"
              >
                {loading
                  ? locale === 'tr'
                    ? 'Hesaplanıyor...'
                    : 'Calculating...'
                  : locale === 'tr'
                    ? 'Döngümü Hesapla'
                    : 'Calculate Cycle'}
              </button>
            </form>

            {cycleResult && (
              <div className="space-y-4 rounded-2xl bg-[var(--bg-page)] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-muted)]">
                    {locale === 'tr' ? 'Bugünkü Tahmini Durum' : 'Estimated Current Phase'}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      PHASE_META[cycleResult.currentPhase]?.color || ''
                    }`}
                  >
                    {locale === 'tr'
                      ? `${cycleResult.currentCycleDay}. Gün • ${PHASE_META[cycleResult.currentPhase]?.tr}`
                      : `Day ${cycleResult.currentCycleDay} • ${PHASE_META[cycleResult.currentPhase]?.en}`}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                  {locale === 'tr'
                    ? PHASE_META[cycleResult.currentPhase]?.descTr
                    : PHASE_META[cycleResult.currentPhase]?.descEn}
                </p>

                <div className="grid gap-3 pt-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
                    <div className="text-xs text-[var(--text-muted)]">
                      {locale === 'tr' ? 'Sonraki Regl Tarihi' : 'Next Period'}
                    </div>
                    <div className="mt-1 text-sm font-extrabold text-[#E91E63] dark:text-[#FF69B4]">
                      {fmtDate(cycleResult.nextPeriodDate)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
                    <div className="text-xs text-[var(--text-muted)]">
                      {locale === 'tr' ? 'Yumurtlama (Ovulasyon)' : 'Ovulation Day'}
                    </div>
                    <div className="mt-1 text-sm font-extrabold text-[#7C3AED]">
                      {fmtDate(cycleResult.ovulationDate)}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
                  <div className="text-xs text-[var(--text-muted)]">
                    {locale === 'tr' ? 'Yüksek Doğurganlık Penceresi' : 'Fertile Window'}
                  </div>
                  <div className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {fmtDate(cycleResult.fertileWindow.start)} –{' '}
                    {fmtDate(cycleResult.fertileWindow.end)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. PREGNANCY */}
        {tab === 'pregnancy' && (
          <div className="grid gap-8 md:grid-cols-2">
            <form onSubmit={runPregnancy} className="space-y-4">
              <h2 className="text-xl font-extrabold text-[var(--text-main)]">
                {t.calculators.tabs.pregnancy}
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPregMode('lmp')}
                  className={`flex-1 rounded-xl border py-2 text-xs font-bold ${
                    pregMode === 'lmp'
                      ? 'border-[#FF69B4] bg-[#FFF0F5] text-[#E91E63] dark:bg-[#2a1936] dark:text-[#FF69B4]'
                      : 'border-[var(--border-soft)] text-[var(--text-muted)]'
                  }`}
                >
                  {locale === 'tr' ? 'Son Adet Tarihi (SAT)' : 'Last Period Date'}
                </button>
                <button
                  type="button"
                  onClick={() => setPregMode('due')}
                  className={`flex-1 rounded-xl border py-2 text-xs font-bold ${
                    pregMode === 'due'
                      ? 'border-[#FF69B4] bg-[#FFF0F5] text-[#E91E63] dark:bg-[#2a1936] dark:text-[#FF69B4]'
                      : 'border-[var(--border-soft)] text-[var(--text-muted)]'
                  }`}
                >
                  {locale === 'tr' ? 'Tahmini Doğum Tarihi' : 'Estimated Due Date'}
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)]">
                  {pregMode === 'lmp'
                    ? locale === 'tr'
                      ? 'Son Adet Başlangıç Tarihi'
                      : 'First Day of Last Period'
                    : locale === 'tr'
                      ? 'Tahmini Doğum Tarihi'
                      : 'Expected Due Date'}
                </label>
                <input
                  type="date"
                  value={pregDate}
                  onChange={(e) => setPregDate(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-page)] px-4 py-2.5 text-sm text-[var(--text-main)]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-[#FF69B4] to-[#7C3AED] py-3 text-sm font-bold text-white"
              >
                {locale === 'tr' ? 'Hamilelik Haftasını Hesapla' : 'Calculate Pregnancy Week'}
              </button>
            </form>

            {pregResult && (
              <div className="space-y-4 rounded-2xl bg-[var(--bg-page)] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {locale === 'tr' ? 'Gebelik Süreci' : 'Gestational Age'}
                    </div>
                    <div className="text-2xl font-extrabold text-[#7C3AED]">
                      {locale === 'tr'
                        ? `${pregResult.weeks} Hafta + ${pregResult.days} Gün`
                        : `${pregResult.weeks} Weeks + ${pregResult.days} Days`}
                    </div>
                  </div>
                  <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-bold text-[#7C3AED]">
                    {pregResult.trimester}. Trimester
                  </span>
                </div>

                <div>
                  <div className="mb-1 flex justify-between text-xs text-[var(--text-muted)]">
                    <span>{locale === 'tr' ? 'İlerleme' : 'Progress'}</span>
                    <span>%{pregResult.progressPercentage}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[var(--border-soft)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#FF69B4] to-[#7C3AED]"
                      style={{ width: `${pregResult.progressPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
                    <div className="text-xs text-[var(--text-muted)]">
                      {locale === 'tr' ? 'Tahmini Doğum' : 'Estimated Due Date'}
                    </div>
                    <div className="mt-1 text-sm font-bold text-[var(--text-main)]">
                      {fmtDate(pregResult.dueDate)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-3">
                    <div className="text-xs text-[var(--text-muted)]">
                      {locale === 'tr' ? 'Doğuma Kalan' : 'Days Remaining'}
                    </div>
                    <div className="mt-1 text-sm font-bold text-[#E91E63] dark:text-[#FF69B4]">
                      {pregResult.daysRemaining} {locale === 'tr' ? 'gün' : 'days'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. WATER */}
        {tab === 'water' && (
          <div className="grid gap-8 md:grid-cols-2">
            <form onSubmit={runWater} className="space-y-4">
              <h2 className="text-xl font-extrabold text-[var(--text-main)]">
                {t.calculators.tabs.water}
              </h2>
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)]">
                  {locale === 'tr' ? 'Kilonuz (kg)' : 'Weight (kg)'}
                </label>
                <input
                  type="number"
                  min={30}
                  max={250}
                  value={waterWeight}
                  onChange={(e) => setWaterWeight(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-page)] px-4 py-2.5 text-sm text-[var(--text-main)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)]">
                    {locale === 'tr' ? 'Aktivite' : 'Activity'}
                  </label>
                  <select
                    value={waterActivity}
                    onChange={(e) => setWaterActivity(e.target.value as any)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-page)] px-3 py-2.5 text-sm text-[var(--text-main)]"
                  >
                    <option value="sedentary">{locale === 'tr' ? 'Hareketsiz' : 'Sedentary'}</option>
                    <option value="moderate">{locale === 'tr' ? 'Orta' : 'Moderate'}</option>
                    <option value="active">{locale === 'tr' ? 'Aktif / Spor' : 'Active'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)]">
                    {locale === 'tr' ? 'İklim' : 'Climate'}
                  </label>
                  <select
                    value={waterClimate}
                    onChange={(e) => setWaterClimate(e.target.value as any)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-page)] px-3 py-2.5 text-sm text-[var(--text-main)]"
                  >
                    <option value="cool">{locale === 'tr' ? 'Serin' : 'Cool'}</option>
                    <option value="temperate">{locale === 'tr' ? 'Ilıman' : 'Temperate'}</option>
                    <option value="hot">{locale === 'tr' ? 'Sıcak' : 'Hot'}</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] py-3 text-sm font-bold text-white"
              >
                {locale === 'tr' ? 'Su Hedefimi Hesapla' : 'Calculate Hydration Target'}
              </button>
            </form>

            {waterResult && (
              <div className="flex flex-col justify-center space-y-4 rounded-2xl bg-[var(--bg-page)] p-6 text-center">
                <div className="text-xs font-bold uppercase tracking-wider text-sky-500">
                  {locale === 'tr' ? 'Önerilen Günlük Su Hedefi' : 'Recommended Daily Hydration'}
                </div>
                <div className="text-4xl font-extrabold text-[var(--text-main)]">
                  {waterResult.dailyWaterMl} ml
                </div>
                <div className="text-sm font-semibold text-[var(--text-muted)]">
                  ≈ {waterResult.dailyNeedL} L • {waterResult.glasses250Ml}{' '}
                  {locale === 'tr' ? 'bardak (250 ml)' : 'glasses (250 ml)'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. BMI */}
        {tab === 'bmi' && (
          <div className="grid gap-8 md:grid-cols-2">
            <form onSubmit={runBMI} className="space-y-4">
              <h2 className="text-xl font-extrabold text-[var(--text-main)]">
                {t.calculators.tabs.bmi}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)]">
                    {locale === 'tr' ? 'Boy (cm)' : 'Height (cm)'}
                  </label>
                  <input
                    type="number"
                    min={100}
                    max={250}
                    value={bmiHeight}
                    onChange={(e) => setBmiHeight(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-page)] px-4 py-2.5 text-sm text-[var(--text-main)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)]">
                    {locale === 'tr' ? 'Kilo (kg)' : 'Weight (kg)'}
                  </label>
                  <input
                    type="number"
                    min={25}
                    max={250}
                    value={bmiWeight}
                    onChange={(e) => setBmiWeight(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-page)] px-4 py-2.5 text-sm text-[var(--text-main)]"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-[#FF69B4] to-[#D946EF] py-3 text-sm font-bold text-white"
              >
                {locale === 'tr' ? 'BMI Hesapla' : 'Calculate BMI'}
              </button>
            </form>

            {bmiResult && (
              <div className="flex flex-col justify-center space-y-3 rounded-2xl bg-[var(--bg-page)] p-6 text-center">
                <div className="text-xs font-bold text-[var(--text-muted)]">
                  {locale === 'tr' ? 'Vücut Kitle İndeksiniz' : 'Your Body Mass Index'}
                </div>
                <div className="text-4xl font-extrabold text-[var(--text-main)]">
                  {bmiResult.bmi}
                </div>
                <div className={`text-base font-extrabold ${bmiCategoryText(bmiResult.category).color}`}>
                  {bmiCategoryText(bmiResult.category).text}
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 via-amber-400 to-rose-500" />
              </div>
            )}
          </div>
        )}

        {/* 5. BMR / TDEE */}
        {tab === 'bmr' && (
          <div className="grid gap-8 md:grid-cols-2">
            <form onSubmit={runBMR} className="space-y-4">
              <h2 className="text-xl font-extrabold text-[var(--text-main)]">
                {t.calculators.tabs.bmr}
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)]">
                    {locale === 'tr' ? 'Yaş' : 'Age'}
                  </label>
                  <input
                    type="number"
                    min={12}
                    max={100}
                    value={bmrAge}
                    onChange={(e) => setBmrAge(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-page)] px-3 py-2.5 text-sm text-[var(--text-main)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)]">
                    {locale === 'tr' ? 'Boy (cm)' : 'Height'}
                  </label>
                  <input
                    type="number"
                    min={100}
                    max={250}
                    value={bmrHeight}
                    onChange={(e) => setBmrHeight(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-page)] px-3 py-2.5 text-sm text-[var(--text-main)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)]">
                    {locale === 'tr' ? 'Kilo (kg)' : 'Weight'}
                  </label>
                  <input
                    type="number"
                    min={25}
                    max={250}
                    value={bmrWeight}
                    onChange={(e) => setBmrWeight(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-page)] px-3 py-2.5 text-sm text-[var(--text-main)]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)]">
                    {locale === 'tr' ? 'Cinsiyet' : 'Sex'}
                  </label>
                  <select
                    value={bmrSex}
                    onChange={(e) => setBmrSex(e.target.value as any)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-page)] px-3 py-2.5 text-sm text-[var(--text-main)]"
                  >
                    <option value="female">{locale === 'tr' ? 'Kadın' : 'Female'}</option>
                    <option value="male">{locale === 'tr' ? 'Erkek' : 'Male'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)]">
                    {locale === 'tr' ? 'Aktivite Düzeyi' : 'Activity'}
                  </label>
                  <select
                    value={bmrActivity}
                    onChange={(e) => setBmrActivity(e.target.value as any)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--bg-page)] px-3 py-2.5 text-sm text-[var(--text-main)]"
                  >
                    <option value="sedentary">{locale === 'tr' ? 'Masa Başı' : 'Sedentary'}</option>
                    <option value="light">{locale === 'tr' ? 'Hafif Aktif' : 'Light'}</option>
                    <option value="moderate">{locale === 'tr' ? 'Orta Aktif' : 'Moderate'}</option>
                    <option value="active">{locale === 'tr' ? 'Çok Aktif' : 'Active'}</option>
                    <option value="very_active">{locale === 'tr' ? 'Yoğun Spor' : 'Very Active'}</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-[#FF69B4] to-[#7C3AED] py-3 text-sm font-bold text-white"
              >
                {locale === 'tr' ? 'Kalori İhtiyacını Hesapla' : 'Calculate Calories'}
              </button>
            </form>

            {bmrResult && (
              <div className="grid gap-3 rounded-2xl bg-[var(--bg-page)] p-5 sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 text-center">
                  <div className="text-xs text-[var(--text-muted)]">
                    {locale === 'tr' ? 'Bazal Metabolizma (BMR)' : 'Basal Metabolic Rate'}
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-[#7C3AED]">
                    {bmrResult.bmr} kcal
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 text-center">
                  <div className="text-xs text-[var(--text-muted)]">
                    {locale === 'tr' ? 'Günlük Kalori (TDEE)' : 'Daily Maintenance (TDEE)'}
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-[#E91E63] dark:text-[#FF69B4]">
                    {bmrResult.tdee} kcal
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save in Mobile App CTA */}
      <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-3xl border border-[var(--border-soft)] bg-[#FFF0F5] p-6 dark:bg-[#231731] sm:flex-row sm:items-center">
        <div>
          <h3 className="text-base font-extrabold text-[var(--text-main)]">
            {t.calculators.ctaSaveTitle}
          </h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{t.calculators.ctaSaveDesc}</p>
        </div>
        <button
          type="button"
          onClick={openDownloadModal}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF69B4] to-[#D946EF] px-5 py-3 text-sm font-bold text-white"
        >
          <Smartphone className="h-4 w-4" />
          <span>{t.nav.download}</span>
        </button>
      </div>
    </div>
  );
}

export default function CalculatorsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm">Yükleniyor...</div>}>
      <CalculatorsContent />
    </Suspense>
  );
}
