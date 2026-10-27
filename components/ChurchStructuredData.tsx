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
    name: 'theSpotlightChurch',
    url: baseUrl,
    logo: `${baseUrl}/images/logo.png`,
    image: `${baseUrl}/og-image.jpg`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Icon Hotel Hall, opposite Mai Angwan House by the transformer, Angwan Danlami, New Nyanya, Abuja-Keffi Express Way',
      addressLocality: 'Karu',
      addressRegion: 'FCT',
      addressCountry: 'NG',
    },
    telephone: '+2348115316745',
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