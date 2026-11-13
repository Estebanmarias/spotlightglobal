'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase'
import Icon from '@/components/Icon'

type Post = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image: string | null
  category: string
  author_name: string
  published_at: string | null
  created_at: string
}

const CATEGORIES = ['All', 'Devotional', 'Sermon Notes', 'Teaching', 'Announcement', 'Testimony', 'Prayer']

const categoryColor = (c: string) => {
  if (c === 'Devotional')   return 'bg-[#fdc425]/20 text-[#785a00]'
  if (c === 'Sermon Notes') return 'bg-[#d8e2ff] text-[#002960]'
  if (c === 'Teaching')     return 'bg-purple-100 text-purple-800'
  if (c === 'Announcement') return 'bg-green-100 text-green-800'
  if (c === 'Testimony')    return 'bg-pink-100 text-pink-800'
  if (c === 'Prayer')       return 'bg-blue-100 text-blue-800'
  return 'bg-[#f2f4f6] text-[#45464e]'
}

const formatDate = (d: string | null) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function DevotionalsPage() {
  const supabase = getSupabaseClient()
  const reduce = useReducedMotion()
  const [posts, setPosts]         = useState<Post[]>([])
  const [loading, setLoading]     = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase.from('blog_posts') as any)
        .select('id, title, slug, excerpt, cover_image, category, author_name, published_at, created_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
      setPosts(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = activeCategory === 'All'
    ? posts
    : posts.filter(p => p.category === activeCategory)

  const featured = filtered[0]
  const rest     = filtered.slice(1)

  return (
    <main className="bg-[#f7f9fb] text-[#191c1e]">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-[#081534] px-5 py-14 sm:px-6 sm:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fdc425]/5 blur-[100px]" />
        </div>
        <div className="relative z-10 mx-auto max-w-[1100px]">
          <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#fdc425]/30 bg-[#fdc425]/20 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#fdc425] sm:mb-6">
              <Icon name="auto_stories" className="text-[14px]" />
              Fresh Word
            </span>
            <h1 className="mb-3 text-[30px] font-bold leading-tight text-white sm:mb-4 sm:text-[48px] lg:text-[56px]">
              Devotionals & Teachings
            </h1>
            <p className="max-w-2xl text-[15px] leading-[26px] text-white/70 sm:text-[18px] sm:leading-[28px]">
              Weekly devotionals, sermon notes, and teachings from Apostle Edet Kingsley
              to nourish your spirit and strengthen your walk with God.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-5 py-8 sm:px-6 sm:py-16">

        {/* Category filter: one swipeable row on phones, wraps on larger screens */}
        <div className="-mx-5 mb-6 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:mb-10 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden"
          role="group" aria-label="Filter by category">
          {CATEGORIES.map(c => (
            <button key={c} aria-pressed={activeCategory === c} onClick={() => setActiveCategory(c)}
              className={`min-h-10 shrink-0 whitespace-nowrap rounded-full border px-4 text-[13px] font-bold transition-colors sm:text-[12px]
                ${activeCategory === c
                  ? 'border-[#081534] bg-[#081534] text-white'
                  : 'border-[#c6c6cf] bg-white text-[#45464e] hover:border-[#081534]'}`}>
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4 sm:space-y-6">
            <div className="h-56 animate-pulse rounded-2xl bg-[#eceef0] sm:h-64" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {[1, 2, 3].map(i => <div key={i} className="h-28 animate-pulse rounded-xl bg-[#eceef0] sm:h-48" />)}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-[#eceef0] bg-white px-5 py-16 text-center sm:py-20">
            <Icon name="article" className="mb-3 block text-[56px] text-[#c6c6cf]" />
            <p className="text-[16px] font-semibold text-[#45464e]">No posts yet</p>
            <p className="mt-1 text-[14px] text-[#5f6068]">Check back soon for fresh word from Apostle Edet Kingsley</p>
          </div>
        ) : (
          <>
            {/* Featured post */}
            {featured && (
              <motion.div initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="mb-6 sm:mb-10">
                <Link href={`/devotionals/${featured.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-[#eceef0] bg-white transition-all duration-500 hover:border-[#fdc425]/30 hover:shadow-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    {featured.cover_image ? (
                      <div className="h-52 overflow-hidden bg-[#eceef0] sm:h-64 md:h-full">
                        <img src={featured.cover_image} alt={featured.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      </div>
                    ) : (
                      <div className="flex h-40 items-center justify-center bg-[#081534] sm:h-64 md:h-full">
                        <Icon name="auto_stories" className="text-[56px] text-[#fdc425] sm:text-[64px]" />
                      </div>
                    )}
                    <div className="flex flex-col justify-center p-5 sm:p-8 md:p-10">
                      <div className="mb-3 flex flex-wrap items-center gap-2 sm:mb-4">
                        <span className="rounded-full bg-[#fdc425] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest text-[#6d5200]">
                          Featured
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${categoryColor(featured.category)}`}>
                          {featured.category}
                        </span>
                      </div>
                      <h2 className="mb-2 text-[21px] font-bold leading-snug text-[#081534] transition-colors group-hover:text-[#785a00] sm:mb-3 sm:text-[26px]">
                        {featured.title}
                      </h2>
                      {featured.excerpt && (
                        <p className="mb-4 line-clamp-3 text-[14px] leading-relaxed text-[#45464e] sm:mb-5">
                          {featured.excerpt}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#5f6068]">
                        <span className="flex items-center gap-1">
                          <Icon name="person" className="text-[14px]" />
                          {featured.author_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="calendar_today" className="text-[14px]" />
                          {formatDate(featured.published_at || featured.created_at)}
                        </span>
                      </div>
                      <div className="mt-5 flex min-h-11 items-center gap-2 text-[14px] font-bold text-[#081534] transition-all group-hover:gap-3 sm:mt-6 sm:text-[13px]">
                        Read Post <Icon name="arrow_forward" className="text-[16px]" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* Post list: compact rows on phones, cards from sm up */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                {rest.map((p, i) => (
                  <motion.div key={p.id}
                    initial={reduce ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: Math.min(i, 5) * 0.05 }}>
                    <Link href={`/devotionals/${p.slug}`}
                      className="group flex h-full gap-3 overflow-hidden rounded-xl border border-[#eceef0] bg-white transition-all hover:border-[#fdc425]/30 hover:shadow-lg active:bg-[#f7f9fb] sm:block sm:gap-0">
                      {p.cover_image ? (
                        <div className="relative min-h-28 w-28 shrink-0 self-stretch overflow-hidden bg-[#eceef0] sm:h-44 sm:min-h-0 sm:w-full">
                          <img src={p.cover_image} alt={p.title} loading="lazy" decoding="async"
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:static" />
                        </div>
                      ) : (
                        <div className="flex min-h-28 w-28 shrink-0 items-center justify-center self-stretch bg-[#081534] sm:h-44 sm:min-h-0 sm:w-full">
                          <Icon name="auto_stories" className="text-[32px] text-[#fdc425] sm:text-[40px]" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 py-3 pr-3 sm:p-5">
                        <span className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold sm:mb-3 ${categoryColor(p.category)}`}>
                          {p.category}
                        </span>
                        <h3 className="mb-1 line-clamp-3 text-[15px] font-bold leading-snug text-[#081534] transition-colors group-hover:text-[#785a00] sm:mb-2 sm:line-clamp-2">
                          {p.title}
                        </h3>
                        {p.excerpt && (
                          <p className="mb-4 line-clamp-2 hidden text-[13px] leading-relaxed text-[#45464e] sm:block">
                            {p.excerpt}
                          </p>
                        )}
                        <p className="flex items-center gap-1 text-[12px] text-[#5f6068] sm:border-t sm:border-[#f2f4f6] sm:pt-3">
                          <Icon name="calendar_today" className="text-[13px]" />
                          {formatDate(p.published_at || p.created_at)}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}