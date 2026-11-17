'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Locale } from '@/lib/api';
import { translations } from '@/lib/i18n';

interface AppContextValue {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  t: (typeof translations)['tr'];
  dark: boolean;
  toggleDark: () => void;
  downloadOpen: boolean;
  openDownloadModal: () => void;
  closeDownloadModal: () => void;
  storeLinks: { ios: string; android: string };
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  children,
  initialLocale = 'tr',
  storeLinks = { ios: 'https://apps.apple.com', android: 'https://play.google.com/store' },
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
  storeLinks?: { ios: string; android: string };
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [dark, setDark] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);

  useEffect(() => {
    const savedLocale = localStorage.getItem('web_locale') as Locale | null;
    if (savedLocale === 'tr' || savedLocale === 'en') {
      setLocaleState(savedLocale);
    }
    const savedTheme = localStorage.getItem('web_theme');
    if (savedTheme === 'dark') {
      setDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const setLocale = (loc: Locale) => {
    setLocaleState(loc);
    localStorage.setItem('web_locale', loc);
    document.cookie = `web_locale=${loc};path=/;max-age=31536000`;
  };

  const toggleDark = () => {
    setDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('web_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('web_theme', 'light');
      }
      return next;
    });
  };

  return (
    <AppContext.Provider
      value={{
        locale,
        setLocale,
        t: translations[locale],
        dark,
        toggleDark,
        downloadOpen,
        openDownloadModal: () => setDownloadOpen(true),
        closeDownloadModal: () => setDownloadOpen(false),
        storeLinks,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used inside AppProvider');
  }
  return ctx;
}
