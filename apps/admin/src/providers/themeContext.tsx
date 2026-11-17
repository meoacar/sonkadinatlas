'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type AdminThemeMode = 'light' | 'dark';

interface AdminThemeContextValue {
  mode: AdminThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setMode: (mode: AdminThemeMode) => void;
}

const STORAGE_KEY = 'admin-color-mode';

const AdminThemeContext = createContext<AdminThemeContextValue>({
  mode: 'light',
  isDark: false,
  toggleTheme: () => {},
  setMode: () => {},
});

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AdminThemeMode>('light');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        setModeState(saved);
      } else if (
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ) {
        setModeState('dark');
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  useEffect(() => {
    const isDark = mode === 'dark';
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.style.colorScheme = mode;
    document.body.style.backgroundColor = isDark ? '#0f1117' : '#f5f6fa';
    document.body.style.color = isDark ? '#e6e8f0' : '#111827';
  }, [mode]);

  const setMode = (next: AdminThemeMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage errors
    }
  };

  const toggleTheme = () => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  };

  return (
    <AdminThemeContext.Provider
      value={{
        mode,
        isDark: mode === 'dark',
        toggleTheme,
        setMode,
      }}
    >
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  return useContext(AdminThemeContext);
}
