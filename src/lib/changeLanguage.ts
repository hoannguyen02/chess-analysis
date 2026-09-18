import type { NextRouter } from 'next/router';

export type SiteLanguage = 'en' | 'vi';

export function changeLanguage(router: NextRouter, language: SiteLanguage) {
  // Save both cookies before navigation so geo middleware respects the choice.
  for (const [name, value] of [
    ['NEXT_LOCALE', language],
    ['USER_SELECTED_LOCALE', '1'],
  ]) {
    document.cookie = `${name}=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }
  return router.replace(router.asPath, undefined, {
    locale: language,
    scroll: false,
  });
}
