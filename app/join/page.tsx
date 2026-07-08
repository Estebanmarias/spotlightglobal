import type { Metadata } from 'next'
import JoinClient from './JoinClient'

export const metadata: Metadata = {
  title: 'Join the Family | theSpotlightChurch',
  description: 'Register with theSpotlightChurch and become part of the Company of the Blessed — whether you\'re visiting for the first time or ready to call this church home.',
  openGraph: {
    title: 'Join the Family | theSpotlightChurch',
    description: 'Register with theSpotlightChurch and become part of the Company of the Blessed.',
  },
}

export default function JoinPage() {
  return <JoinClient />
}