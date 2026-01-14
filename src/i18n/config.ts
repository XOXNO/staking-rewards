/**
 * @file i18n/config.ts
 * @description Internationalization configuration - locales, RTL support
 */

export const locales = ['en'] as const;
export const defaultLocale = 'en' as const;
export const rtlLocales: readonly string[] = ['ar', 'he'] as const;

export type Locale = (typeof locales)[number];

export function isRtlLocale(locale: string): boolean {
  return rtlLocales.includes(locale);
}
