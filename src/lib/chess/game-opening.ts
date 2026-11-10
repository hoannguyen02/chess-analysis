/** Opening names describe the moves, independently of the game result. */
export function gameOpeningCaption(
  headers: Record<string, string>,
  matched?: { name: string; eco: string }
): string {
  const clean = (value?: string) => {
    const text = value?.trim() ?? '';
    return text && !/^[?–—-]+$/.test(text) ? text : '';
  };
  const recorded = clean(headers.Opening);
  const name = recorded
    ? [recorded, clean(headers.Variation)].filter(Boolean).join(': ')
    : (matched?.name ?? '');
  const eco = recorded ? headers.ECO : (matched?.eco ?? headers.ECO);
  const code = eco && /^[A-E]\d{2}$/.test(eco) ? eco : '';
  if (!name) return code ? `Khai cuộc: ECO ${code}` : '';
  return `Khai cuộc: ${name}${code ? ` · ${code}` : ''}`;
}
