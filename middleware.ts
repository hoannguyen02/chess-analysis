import { DefaultLocale } from '@/constants';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// List of supported locales
const locales = ['vi', 'en'];
const defaultLocale = DefaultLocale || 'en';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore next internal paths or static files
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Check if the pathname already has a locale
  const hasLocale = locales.some((locale) => pathname.startsWith(`/${locale}`));

  if (!hasLocale) {
    // Redirect to the default locale
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
