/**
 * @file i18n/routing.ts
 * @description next-intl routing configuration
 */

import { defineRouting } from 'next-intl/routing';
import { locales, defaultLocale } from './config';

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
});
