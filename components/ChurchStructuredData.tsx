// Drop this component in components/ChurchStructuredData.tsx,
// then render it once in app/layout.tsx (inside <head> or right after <body>):
//
//   import ChurchStructuredData from '@/components/ChurchStructuredData'
//   ...
//   <ChurchStructuredData />
//
// TODO before shipping: fill in the real address, phone, service times,
// and social links below — placeholders are marked clearly.

export default function ChurchStructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://spotlightglobal.vercel.app'

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Church',
    name: 'theSpotlight Church',
    url: baseUrl,
    logo: `${baseUrl}/images/logo.png`,          // TODO: confirm actual logo path
    image: `${baseUrl}/og-image.jpg`,     // TODO: confirm actual OG image path
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'TODO: street address',
      addressLocality: 'Abuja',
      addressRegion: 'FCT',
      addressCountry: 'NG',
    },
    telephone: 'TODO: phone number',
    sameAs: [
      // TODO: add live social profile URLs, e.g.
      // 'https://instagram.com/thespotlightchurch',
      // 'https://twitter.com/thespotlightchurch',
      // 'https://youtube.com/@thespotlightchurch',
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}