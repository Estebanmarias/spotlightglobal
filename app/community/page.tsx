import type { Metadata } from 'next'
import CommunityClient from './CommunityClient'

export const metadata: Metadata = {
  title: 'Community | theSpotlightChurch',
  description: 'Join the theSpotlightChurch family — watch the latest sermon, read real testimonies, see upcoming services, and explore moments from our community in Karu, Abuja.',
  openGraph: {
    title: 'Community | theSpotlightChurch',
    description: 'Watch the latest sermon, read testimonies, and see upcoming services from theSpotlightChurch.',
  },
}

export default function CommunityPage() {
  return <CommunityClient />
}