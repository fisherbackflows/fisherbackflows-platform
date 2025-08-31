import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import type { SupportedLocale, Translations } from '../index';

export const translations: Translations = {
  en,
  es,
  fr
};

export function getTranslations(locale: SupportedLocale) {
  return translations[locale] || translations.en;
}