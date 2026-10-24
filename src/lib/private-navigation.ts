/** Allow return navigation only to known private pages on this site. */
export function privateReturnPath(
  value: unknown,
  locale: unknown,
  allowedPaths: string[],
  fallback: string
): string {
  const language = locale === 'vi' ? 'vi' : 'en';
  const defaultPath = `/${language}${fallback}`;
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /[\\\u0000-\u0020]/.test(value)
  )
    return defaultPath;
  const url = new URL(value, 'https://private.invalid');
  if (url.origin !== 'https://private.invalid') return defaultPath;
  const match = /^\/(vi|en)(\/.*)$/.exec(url.pathname);
  const path = match ? match[2] : url.pathname;
  if (!allowedPaths.includes(path)) return defaultPath;
  return `/${match ? match[1] : language}${path}${url.search}${url.hash}`;
}
