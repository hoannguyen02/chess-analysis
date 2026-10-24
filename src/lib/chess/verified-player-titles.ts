// Exact aliases only. Conservative effective dates avoid assigning titles before award.
// Sources: https://ratings.fide.com/profile/25059530
//          https://ratings.fide.com/profile/5000017
const profiles = [
  {
    aliases: ['Praggnanandhaa,R', 'Praggnanandhaa, R', 'Praggnanandhaa R'],
    awards: [
      { since: '2018.07.11', title: 'GM' },
      { since: '2016.09.14', title: 'IM' },
      { since: '2014.01.01', title: 'FM' },
    ],
  },
  {
    aliases: ['Anand,V', 'Anand, V', 'Anand,Viswanathan', 'Anand, Viswanathan'],
    awards: [
      { since: '1989.01.01', title: 'GM' },
      { since: '1986.01.01', title: 'IM' },
    ],
  },
];
export function verifiedPlayerTitle(name: string, date = ''): string {
  if (!/^\d{4}\./.test(date)) return '';
  // Unknown month/day are treated as the start of the year/month.
  const earliestDate = date.replace(/\?/g, '0');
  return (
    profiles
      .find((profile) => profile.aliases.includes(name))
      ?.awards.find((award) => earliestDate >= award.since)?.title ?? ''
  );
}
