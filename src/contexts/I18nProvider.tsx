'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  SupportedLocale, 
  defaultLocale, 
  supportedLocales,
  I18nContextType,
  getNestedTranslation,
  interpolateString,
  detectBrowserLocale
} from '@/lib/i18n';
import { getTranslations } from '@/lib/i18n/translations';

const I18nContext = createContext<I18nContextType | null>(null);

interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: SupportedLocale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<SupportedLocale>(
    initialLocale || defaultLocale
  );

  useEffect(() => {
    // Load locale from localStorage on client side
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('fisherbackflows-locale') as SupportedLocale;
      if (savedLocale && supportedLocales.includes(savedLocale)) {
        setLocaleState(savedLocale);
      } else {
        // Detect browser locale if no saved locale
        const browserLocale = detectBrowserLocale();
        setLocaleState(browserLocale);
        localStorage.setItem('fisherbackflows-locale', browserLocale);
      }
    }
  }, []);

  const setLocale = (newLocale: SupportedLocale) => {
    if (supportedLocales.includes(newLocale)) {
      setLocaleState(newLocale);
      if (typeof window !== 'undefined') {
        localStorage.setItem('fisherbackflows-locale', newLocale);
        // Update document language
        document.documentElement.lang = newLocale;
      }
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const translations = getTranslations(locale);
    const translation = getNestedTranslation(translations, key);
    
    if (typeof translation === 'string') {
      return params ? interpolateString(translation, params) : translation;
    }
    
    // Fallback to English if translation not found
    if (locale !== 'en') {
      const fallbackTranslations = getTranslations('en');
      const fallbackTranslation = getNestedTranslation(fallbackTranslations, key);
      if (typeof fallbackTranslation === 'string') {
        return params ? interpolateString(fallbackTranslation, params) : fallbackTranslation;
      }
    }
    
    // Return key if no translation found
    return key;
  };

  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    try {
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(dateObj);
    } catch (error) {
      // Fallback to English format
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(dateObj);
    }
  };

  const formatCurrency = (amount: number): string => {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'USD', // Default to USD, could be configurable
        minimumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      // Fallback formatting
      return `$${amount.toFixed(2)}`;
    }
  };

  const formatNumber = (num: number): string => {
    try {
      return new Intl.NumberFormat(locale).format(num);
    } catch (error) {
      return num.toString();
    }
  };

  const contextValue: I18nContextType = {
    locale,
    setLocale,
    t,
    formatDate,
    formatCurrency,
    formatNumber
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}