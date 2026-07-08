import type { Metadata } from 'next'
import PartnerClient from './PartnerClient'

export const metadata: Metadata = {
  title: 'Partner With Us | theSpotlightChurch',
  description: 'Join theSpotlightChurch\'s global partnership — supporting kingdom projects, welfare, and taking the gospel to the ends of the earth. 45+ partners across 12 countries.',
  openGraph: {
    title: 'Partner With Us | theSpotlightChurch',
    description: 'Join theSpotlightChurch\'s global partnership and help take the gospel to the ends of the earth.',
  },
}

export default function PartnerPage() {
  return <PartnerClient />
}