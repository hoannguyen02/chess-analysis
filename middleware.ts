import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const locales = ['vi', 'en'] as const;
type Locale = (typeof locales)[number];

const isSupportedLocale = (value: string): value is Locale => {
  return locales.includes(value as Locale);
};

const resolveLocale = (request: NextRequest): Locale => {
  // Keep explicit user choice when available.
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value?.toLowerCase();
  if (cookieLocale && isSupportedLocale(cookieLocale)) {
    return cookieLocale;
  }

  // Geo header is available on most edge/CDN providers.
  const country =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
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

  // Check if the pathname already has a locale
  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  if (!hasLocale) {
    const locale = resolveLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;

    const response = NextResponse.redirect(url);
    response.cookies.set('NEXT_LOCALE', locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
    return response;
  }

  return NextResponse.next();
}
