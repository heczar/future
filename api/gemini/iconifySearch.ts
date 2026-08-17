import { Request, Response } from 'express';

/**
 * Iconify Vector Search API Service
 * Searches 200,000+ free open-source SVG icons from Iconify without API keys.
 */
export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const query = (req.query.q || req.body.query || 'star').toString().trim();
  
  try {
    const searchUrl = `https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=16`;
    const response = await fetch(searchUrl);

    if (!response.ok) {
      return res.status(200).json({ icons: [] });
    }

    const data = await response.json();
    const iconNames: string[] = data.icons || [];

    // Map icon names to SVG URLs
    const results = iconNames.slice(0, 16).map(iconName => {
      const parts = iconName.split(':');
      const prefix = parts[0] || 'mdi';
      const name = parts[1] || 'star';
      return {
        id: iconName,
        svgUrl: `https://api.iconify.design/${prefix}/${name}.svg`,
        prefix,
        name
      };
    });

    return res.status(200).json({ icons: results, total: data.total || results.length });
  } catch (error: any) {
    console.warn('[ICONIFY API] Search error:', error?.message);
    return res.status(200).json({ icons: [], error: error?.message });
  }
}
