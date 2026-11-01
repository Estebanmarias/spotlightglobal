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
      streetAddress: 'Icon Hotel Hall, Angwan Danlami, New Nyanya, Abuja-Keffi Expressway',
      addressLocality: 'Karu',
      addressRegion: 'FCT',
      addressCountry: 'NG',
    },
    hasMap: 'https://www.google.com/maps/search/?api=1&query=Icon%20Hotel%20Hall%2C%20Angwan%20Danlami%2C%20New%20Nyanya%2C%20Abuja-Keffi%20Expressway%2C%20Nigeria',
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