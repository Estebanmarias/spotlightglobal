'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase'

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

const readTime = (excerpt: string | null) => {
  const words = (excerpt || '').split(' ').length
  return Math.max(1, Math.ceil(words / 200))
}

const formatDate = (d: string | null) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function DevotionalsPage() {
  const supabase = getSupabaseClient()
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
      <section className="bg-[#081534] py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#fdc425]/5 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="max-w-[1100px] mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#fdc425]/20 text-[#fdc425] border border-[#fdc425]/30 rounded-full text-[11px] font-bold uppercase tracking-widest mb-6">
              <span className="material-symbols-outlined text-[14px]">auto_stories</span>
              Fresh Word
            </span>
            <h1 className="text-white text-[36px] sm:text-[48px] lg:text-[56px] font-bold leading-tight mb-4">
              Devotionals & Teachings
            </h1>
            <p className="text-white/70 text-[16px] sm:text-[18px] leading-[28px] max-w-2xl">
              Weekly devotionals, sermon notes, and teachings from Apostle Edet Kingsley
              to nourish your spirit and strengthen your walk with God.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="max-w-[1100px] mx-auto px-6 py-16">

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-10">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setActiveCategory(c)}
              className={`px-4 py-2 rounded-full text-[12px] font-bold transition-all border
                ${activeCategory === c
                  ? 'bg-[#081534] text-white border-[#081534]'
                  : 'bg-white text-[#45464e] border-[#c6c6cf] hover:border-[#081534]'}`}>
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="h-64 bg-[#eceef0] rounded-2xl animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3].map(i => <div key={i} className="h-48 bg-[#eceef0] rounded-xl animate-pulse" />)}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#eceef0]">
            <span className="material-symbols-outlined text-[56px] text-[#c6c6cf] block mb-3">article</span>
            <p className="text-[#45464e] font-semibold text-[16px]">No posts yet</p>
            <p className="text-[13px] text-[#76777f] mt-1">Check back soon for fresh word from Apostle Edet Kingsley</p>
          </div>
        ) : (
          <>
            {/* Featured post */}
            {featured && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="mb-10">
                <Link href={`/devotionals/${featured.slug}`}
                  className="group block bg-white rounded-2xl border border-[#eceef0] overflow-hidden hover:shadow-xl hover:border-[#fdc425]/30 transition-all duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    {featured.cover_image ? (
                      <div className="h-64 md:h-full overflow-hidden bg-[#eceef0]">
                        <img src={featured.cover_image} alt={featured.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      </div>
                    ) : (
                      <div className="h-64 md:h-full bg-[#081534] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#fdc425] text-[64px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
                      </div>
                    )}
                    <div className="p-7 sm:p-10 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-2 py-0.5 bg-[#fdc425] text-[#6d5200] rounded-full text-[10px] font-bold uppercase tracking-widest">
                          Featured
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${categoryColor(featured.category)}`}>
                          {featured.category}
                        </span>
                      </div>
                      <h2 className="text-[#081534] text-[22px] sm:text-[26px] font-bold leading-snug mb-3 group-hover:text-[#785a00] transition-colors">
                        {featured.title}
                      </h2>
                      {featured.excerpt && (
                        <p className="text-[#45464e] text-[14px] leading-relaxed mb-5 line-clamp-3">
                          {featured.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-[12px] text-[#76777f]">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">person</span>
                          {featured.author_name}
                        </span>
                        <span>·</span>
                        <span>{formatDate(featured.published_at || featured.created_at)}</span>
                        <span>·</span>
                        <span>{readTime(featured.excerpt)} min read</span>
                      </div>
                      <div className="mt-6 flex items-center gap-2 text-[#081534] text-[13px] font-bold group-hover:gap-3 transition-all">
                        Read Post <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* Post grid */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {rest.map((p, i) => (
                  <motion.div key={p.id}
                    initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                    <Link href={`/devotionals/${p.slug}`}
                      className="group block bg-white rounded-xl border border-[#eceef0] overflow-hidden hover:shadow-lg hover:border-[#fdc425]/30 transition-all duration-400 h-full">
                      {p.cover_image ? (
                        <div className="h-44 overflow-hidden bg-[#eceef0]">
                          <img src={p.cover_image} alt={p.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        </div>
                      ) : (
                        <div className="h-44 bg-[#081534] flex items-center justify-center">
                          <span className="material-symbols-outlined text-[#fdc425] text-[40px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
                        </div>
                      )}
                      <div className="p-5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mb-3 ${categoryColor(p.category)}`}>
                          {p.category}
                        </span>
                        <h3 className="text-[#081534] text-[15px] font-bold leading-snug mb-2 line-clamp-2 group-hover:text-[#785a00] transition-colors">
                          {p.title}
                        </h3>
                        {p.excerpt && (
                          <p className="text-[#45464e] text-[12px] leading-relaxed line-clamp-2 mb-4">
                            {p.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-[11px] text-[#76777f] pt-3 border-t border-[#f2f4f6]">
                          <span>{formatDate(p.published_at || p.created_at)}</span>
                          <span>{readTime(p.excerpt)} min read</span>
                        </div>
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