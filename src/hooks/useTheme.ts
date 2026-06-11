import { useEffect } from 'react';
import type { AppTheme } from '../types';

export function useTheme(theme: AppTheme) {
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.style.setProperty('--bg-primary', '#0a0a0a');
      root.style.setProperty('--bg-secondary', '#111111');
      root.style.setProperty('--bg-tertiary', '#1a1a1a');
      root.style.setProperty('--text-primary', '#f5f2eb');
      root.style.setProperty('--text-secondary', '#8a8580');
      root.style.setProperty('--border-color', '#2a2a2a');
      root.style.setProperty('--input-bg', '#1a1a1a');
      root.style.setProperty('--hover-bg', '#1a1a1a');
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.style.setProperty('--bg-primary', '#f5f2eb');
      root.style.setProperty('--bg-secondary', '#ffffff');
      root.style.setProperty('--bg-tertiary', '#e8e5de');
      root.style.setProperty('--text-primary', '#1a1a1a');
      root.style.setProperty('--text-secondary', '#6b6560');
      root.style.setProperty('--border-color', '#d4d0c8');
      root.style.setProperty('--input-bg', '#e8e5de');
      root.style.setProperty('--hover-bg', '#e8e5de');
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);
}
