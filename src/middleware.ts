import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const locales = ['vi', 'en'] as const;
type Locale = (typeof locales)[number];

const isSupportedLocale = (value: string): value is Locale => {
  return locales.includes(value as Locale);
};

const resolveLocale = (request: NextRequest): Locale => {
  // If user explicitly chose language from the UI, keep that choice.
  const userSelectedLocale =
    request.cookies.get('USER_SELECTED_LOCALE')?.value === '1';
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value?.toLowerCase();
  if (userSelectedLocale && cookieLocale && isSupportedLocale(cookieLocale)) {
    return cookieLocale;
  }

  // Geo header is available on most edge/CDN providers.
  const geoFromObject = (
    request as NextRequest & { geo?: { country?: string } }
  ).geo?.country;
  const country =
    geoFromObject ||
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-country-code') ||
    '';

  if (country.toUpperCase() === 'VN') {
    return 'vi';
  }

  return 'en';
};

const getPathLocale = (pathname: string): Locale | null => {
  const matched = locales.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  return matched ?? null;
};

const replaceLocaleInPath = (
  pathname: string,
  fromLocale: Locale,
  toLocale: Locale
): string => {
  if (pathname === `/${fromLocale}`) {
    return `/${toLocale}`;
  }

  return pathname.replace(`/${fromLocale}/`, `/${toLocale}/`);
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore next internal paths, API routes, and static files.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const preferredLocale = resolveLocale(request);
  const userSelectedLocale =
    request.cookies.get('USER_SELECTED_LOCALE')?.value === '1';
  const pathLocale = getPathLocale(pathname);

  if (pathLocale) {
    // If locale was not explicitly selected by user, keep it aligned with geo default.
    if (!userSelectedLocale && pathLocale !== preferredLocale) {
      const url = request.nextUrl.clone();
      url.pathname = replaceLocaleInPath(pathname, pathLocale, preferredLocale);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  if (!pathLocale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${preferredLocale}${pathname}`;

    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
