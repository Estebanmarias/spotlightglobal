// Drop this component in components/ChurchStructuredData.tsx,
// then render it once in app/layout.tsx (inside <head> or right after <body>):

//   import ChurchStructuredData from '@/components/ChurchStructuredData'
//   ...
//   <ChurchStructuredData />

export default function ChurchStructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://spotlightglobal.vercel.app'

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Church',
    name: SITE_CONFIG.churchName,
    url: baseUrl,
    logo: `${baseUrl}/images/logo.png`,
    image: `${baseUrl}/og-image.jpg`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE_CONFIG.address,
      addressLocality: 'Karu',
      addressRegion: 'FCT',
      addressCountry: 'NG',
    },
    hasMap: SITE_CONFIG.mapsUrl,
    telephone: SITE_CONFIG.phone,
    sameAs: [
      'https://instagram.com/thespotlightchurch',
      'https://www.youtube.com/@thespotlightchurch',
      'https://t.me/thespotlightchurchLive',
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
import { SITE_CONFIG } from "@/lib/site-config";
