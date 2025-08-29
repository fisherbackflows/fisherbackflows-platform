import { createContext, useContext } from 'react';

export type SupportedLocale = 'en' | 'es' | 'fr';

export interface Translation {
  [key: string]: string | Translation;
}

export interface Translations {
  [locale: string]: Translation;
}

export const defaultLocale: SupportedLocale = 'en';

export const supportedLocales: SupportedLocale[] = ['en', 'es', 'fr'];

export const localeNames: Record<SupportedLocale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français'
};

export const localeFlags: Record<SupportedLocale, string> = {
  en: '🇺🇸',
  es: '🇪🇸', 
  fr: '🇫🇷'
};

export interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (date: Date | string) => string;
  formatCurrency: (amount: number) => string;
  formatNumber: (num: number) => string;
}

export const I18nContext = createContext<I18nContextType | null>(null);

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export function interpolateString(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key]?.toString() || match;
  });
}

export function getNestedTranslation(obj: Translation, path: string): string | Translation | undefined {
  return path.split('.').reduce((current: any, key: string) => {
    return current?.[key];
  }, obj);
}

export function detectBrowserLocale(): SupportedLocale {
  if (typeof window === 'undefined') return defaultLocale;
  
  const browserLocale = navigator.language.toLowerCase().split('-')[0] as SupportedLocale;
  return supportedLocales.includes(browserLocale) ? browserLocale : defaultLocale;
}

export function isRTLLocale(locale: SupportedLocale): boolean {
  const rtlLocales: SupportedLocale[] = [];
  return rtlLocales.includes(locale);
}