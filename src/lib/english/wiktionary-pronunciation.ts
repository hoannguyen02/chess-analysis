// Server-only parser. Wiktionary contributors, CC BY-SA 4.0.
import { load } from 'cheerio';
import { Pronunciations } from './pronunciation';
export function parseWiktionary(word: string, html: string) {
  const $ = load(html);
  const section = $('#English').closest('section');
  if (!section.length) {
    if ($('section h2').length)
      return { pronunciations: {}, status: 'not-found' as const };
    throw new Error('Unrecognized dictionary page');
  }
  const sets = {
    UK: new Set<string>(),
    US: new Set<string>(),
    IPA: new Set<string>(),
  };
  section.find('.IPA').each((_, element) => {
    const node = $(element);
    if (
      !node
        .parents('section')
        .toArray()
        .some((parent) =>
          $(parent)
            .children('h3,h4,h5')
            .toArray()
            .some((heading) => /^Pronunciation/.test($(heading).text()))
        )
    )
      return;
    const ipa = node.text().trim();
    // Broad dictionary IPA only; skip narrow [phonetic] variants and examples.
    if (!/^\/[^/<>\n]{1,116}\/$/u.test(ipa)) return;
    const li = node.closest('li');
    if (!li.length) return;
    const own = li.clone();
    own.children('ul, ol, table').remove();
    own.find('.IPA').remove();
    const before = own
      .text()
      .trim()
      .split('\n')[0]
      .replace(/IPA\s*\(key\)/g, '');
    const qualifiers = [...before.matchAll(/\(([^)]+)\)/g)]
      .map((m) => m[1])
      .join(', ');
    if (!qualifiers && li.parents('li').length) return;

    const labels = qualifiers.split(/,\s*/).filter(Boolean);
    const supported =
      /^(UK|US|Received Pronunciation|RP|General British|British|General American|American|GA|Canada|Canadian|Australia|New Zealand)$/i;
    if (labels.some((label) => !supported.test(label))) return;
    if (
      labels.some((label) =>
        /^(UK|Received Pronunciation|RP|General British|British)$/i.test(label)
      )
    )
      sets.UK.add(ipa);
    if (
      labels.some((label) => /^(US|General American|American|GA)$/i.test(label))
    )
      sets.US.add(ipa);
    if (!labels.length) sets.IPA.add(ipa);
  });
  const pronunciations: Pronunciations = {};
  let ambiguous = false;
  for (const accent of ['UK', 'US', 'IPA'] as const) {
    if (sets[accent].size > 1) ambiguous = true;
    const ipa = [...sets[accent]].join(' · ');
    if (sets[accent].size >= 1 && sets[accent].size <= 3 && ipa.length <= 120)
      pronunciations[accent] = {
        ipa,
        source: `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}#English`,
      };
  }
  // Conflicting unqualified headword senses require context, even if a regional
  // subsection happens to document only one of those senses.
  if (
    sets.IPA.size > 1 ||
    [
      'read',
      'name',
      'lead',
      'wind',
      'bow',
      'tear',
      'live',
      'close',
      'record',
      'present',
      'object',
    ].includes(word)
  )
    return { pronunciations: {}, status: 'needs-context' as const };
  return {
    pronunciations,
    status: Object.keys(pronunciations).length
      ? ('found' as const)
      : ambiguous
        ? ('needs-context' as const)
        : ('not-found' as const),
  };
}
