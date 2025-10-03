import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  currentTheme = signal<Theme>(this.getInitialTheme());
  isDark = signal<boolean>(false);

  constructor() {
    this.applyTheme();
    effect(() => {
      const theme = this.currentTheme();
      this.applyTheme();
      localStorage.setItem('theme', theme);
    });
    this.watchSystemTheme();
  }

  private getInitialTheme(): Theme {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      return savedTheme;
    }
    return 'system';
  }

  private applyTheme(): void {
    const theme = this.currentTheme();
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
      this.isDark.set(true);
    } else if (theme === 'light') {
      root.classList.remove('dark');
      this.isDark.set(false);
    } else {
      // System
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        this.isDark.set(true);
      } else {
        root.classList.remove('dark');
        this.isDark.set(false);
      }
    }
  }

  private watchSystemTheme(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    mediaQuery.addEventListener('change', () => {
      if (this.currentTheme() === 'system') {
        this.applyTheme();
      }
    });
  }

  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
  }

  toggleTheme(): void {
    const current = this.isDark();
    this.setTheme(current ? 'light' : 'dark');
  }

  getTheme(): Theme {
    return this.currentTheme();
  }
}
