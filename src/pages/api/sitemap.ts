import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const siteUrl = 'https://limachess.com'; // Update with your actual domain

  const slugResults = await axios.get(
    `${process.env.NEXT_PUBLIC_LIMA_BE_DOMAIN}/v1/courses/public/slug`
  );

  const courseSlugs: string[] = slugResults.data || [];

  // Generate URLs for both the default language (`/lessons/`) and Vietnamese (`/vi/lessons/`)
  const courseUrls = courseSlugs.flatMap(({ slug }: any) => [
    `<url>
      <loc>${siteUrl}/lessons/${slug}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`,
    `<url>
      <loc>${siteUrl}/vi/lessons/${slug}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`,
  ]);
  const menuUrls = ['openings', 'endgames', 'tactics', 'traps'].flatMap(
    (menu: string) => [
      `<url>
      <loc>${siteUrl}/${menu}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`,
      `<url>
      <loc>${siteUrl}/vi/${menu}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`,
    ]
  );

  // Create the sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
      <loc>${siteUrl}/</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
    </url>
    ${menuUrls.join('\n')}
    ${courseUrls.join('\n')}
  </urlset>`;

  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(sitemap);
}
