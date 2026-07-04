import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://spotlightglobal.vercel.app'

  // Add new public routes here as they're built (e.g. blog/sermon posts)
  const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '',          priority: 1.0, changeFrequency: 'weekly'  },
    { path: '/giving',   priority: 0.9, changeFrequency: 'monthly' },
    { path: '/join',     priority: 0.8, changeFrequency: 'monthly' },
    { path: '/community',priority: 0.7, changeFrequency: 'weekly'  },
    { path: '/partner',  priority: 0.7, changeFrequency: 'monthly' },
  ]

  return routes.map(r => ({
    url: `${baseUrl}${r.path}`,
    lastModified: new Date(),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))
}