'use client';

import React from 'react';
import { ChevronDown, Languages } from 'lucide-react';
import { useI18n } from '@/contexts/I18nProvider';
import { supportedLocales, localeNames, localeFlags, type SupportedLocale } from '@/lib/i18n';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'dropdown' | 'buttons';
}

export default function LanguageSelector({ 
  className = '', 
  variant = 'dropdown' 
}: LanguageSelectorProps) {
  const { locale, setLocale, t } = useI18n();
  const [isOpen, setIsOpen] = React.useState(false);

  if (variant === 'buttons') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {supportedLocales.map((localeOption) => (
          <button
            key={localeOption}
            onClick={() => setLocale(localeOption)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1 ${
              locale === localeOption
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
            }`}
          >
            <span>{localeFlags[localeOption]}</span>
            <span>{localeNames[localeOption]}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-white/90 hover:bg-white/20 transition-all duration-200"
        title={t('settings.language')}
      >
        <Languages className="h-4 w-4" />
        <span className="text-sm font-medium">
          {localeFlags[locale]} {localeNames[locale]}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 z-50 min-w-[160px] bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg shadow-xl">
            <div className="p-1">
              {supportedLocales.map((localeOption) => (
                <button
                  key={localeOption}
                  onClick={() => {
                    setLocale(localeOption);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                    locale === localeOption
                      ? 'bg-blue-500 text-white'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{localeFlags[localeOption]}</span>
                  <span className="text-sm font-medium">{localeNames[localeOption]}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}