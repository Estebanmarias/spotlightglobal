import { NextResponse } from 'next/server'

const KEY = process.env.YOUTUBE_API_KEY
const CHANNEL_ID = 'UCqKvr26isZoFXO02xEtX5UQ'
// A channel's uploads playlist ID is the channel ID with "UC" swapped for "UU"
const UPLOADS_PLAYLIST = 'UU' + CHANNEL_ID.slice(2)

type PlaylistItem = { contentDetails?: { videoId?: string } }
type Video = {
  id: string
  snippet: { title: string; publishedAt: string; liveBroadcastContent: string }
  status?: { embeddable?: boolean }
}

const reply = (body: object, seconds: number) =>
  NextResponse.json(body, {
    headers: { 'Cache-Control': `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}` },
  })

export async function GET() {
  if (!KEY) return reply({ type: 'none' }, 60)

  try {
    const listRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?key=${KEY}&playlistId=${UPLOADS_PLAYLIST}&part=contentDetails&maxResults=10`,
      { next: { revalidate: 300 } },
    )
    if (!listRes.ok) return reply({ type: 'none' }, 60)
    const list = await listRes.json()
    const ids = (list.items ?? []).map((i: PlaylistItem) => i.contentDetails?.videoId).filter(Boolean).join(',')
    if (!ids) return reply({ type: 'none' }, 60)

    const videoRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?key=${KEY}&id=${ids}&part=snippet,status`,
      { next: { revalidate: 300 } },
    )
    if (!videoRes.ok) return reply({ type: 'none' }, 60)
    const videos: Video[] = ((await videoRes.json()).items ?? []).sort(
    (a: Video, b: Video) => +new Date(b.snippet?.publishedAt) - +new Date(a.snippet?.publishedAt),
    )

    const live = videos.find(v => v.snippet?.liveBroadcastContent === 'live')
    if (live) return reply({ type: 'live', videoId: live.id, title: live.snippet.title }, 300)

    const latest = videos.find(
      v => v.status?.embeddable === true && v.snippet?.liveBroadcastContent === 'none',
    )
    if (latest) return reply({ type: 'latest', videoId: latest.id, title: latest.snippet.title }, 300)

    return reply({ type: 'none' }, 300)
  } catch {
    return reply({ type: 'none' }, 60)
  }
}