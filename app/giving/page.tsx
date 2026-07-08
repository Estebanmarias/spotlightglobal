import type { Metadata } from 'next'
import GivingClient from './GivingClient'

export const metadata: Metadata = {
  title: 'Give | theSpotlightChurch',
  description: 'Partner with theSpotlightChurch through tithes, offerings, prophetic seeds, and kingdom partnership. Give directly via bank transfer, in-service, or USSD.',
  openGraph: {
    title: 'Give | theSpotlightChurch',
    description: 'Partner with theSpotlightChurch through tithes, offerings, prophetic seeds, and kingdom partnership.',
  },
}

export default function GivingPage() {
  return <GivingClient />
}