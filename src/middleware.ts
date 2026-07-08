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

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  if (!hasLocale) {
    const locale = resolveLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;

    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
