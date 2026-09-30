'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase'

type Post = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  cover_image: string | null
  category: string
  author_name: string
  published_at: string | null
  created_at: string
}

const formatDate = (d: string | null) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const readTime = (content: string) => {
  const words = content.replace(/<[^>]*>/g, '').split(' ').length
  return Math.max(1, Math.ceil(words / 200))
}

export default function DevotionalPostPage() {
  const supabase  = getSupabaseClient()
  const { slug }  = useParams() as { slug: string }
  const [post, setPost]   = useState<Post | null>(null)
  const [related, setRelated] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase.from('blog_posts') as any)
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single()
      setPost(data)

      if (data) {
        const { data: rel } = await (supabase.from('blog_posts') as any)
          .select('id, title, slug, excerpt, cover_image, category, published_at, created_at')
          .eq('status', 'published')
          .eq('category', data.category)
          .neq('id', data.id)
          .limit(3)
        setRelated(rel || [])
      }
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) return (
    <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
      <span className="w-8 h-8 border-2 border-[#c6c6cf] border-t-[#081534] rounded-full animate-spin" />
    </div>
  )

  if (!post) return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col items-center justify-center text-center p-6">
      <span className="material-symbols-outlined text-[56px] text-[#c6c6cf] block mb-3">article</span>
      <h1 className="text-[#081534] text-[24px] font-bold mb-2">Post not found</h1>
      <p className="text-[#45464e] mb-6">This post may have been removed or is no longer published.</p>
      <Link href="/devotionals"
        className="bg-[#081534] text-white px-6 py-3 rounded-full text-[13px] font-bold hover:opacity-90">
        View All Posts
      </Link>
    </div>
  )

  return (
    <main className="bg-[#f7f9fb] text-[#191c1e]">

      {/* Cover */}
      {post.cover_image && (
        <div className="w-full h-[40vh] sm:h-[50vh] overflow-hidden bg-[#081534]">
          <img src={post.cover_image} alt={post.title}
            className="w-full h-full object-cover opacity-80" />
        </div>
      )}

      {/* Article */}
      <div className="max-w-[760px] mx-auto px-6 py-14">

        {/* Back */}
        <Link href="/devotionals"
          className="inline-flex items-center gap-1.5 text-[#45464e] text-[13px] font-semibold hover:text-[#081534] transition-colors mb-8">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to Devotionals
        </Link>

        {/* Meta */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <span className="inline-block px-3 py-1 bg-[#fdc425]/20 text-[#785a00] rounded-full text-[11px] font-bold uppercase tracking-widest mb-4">
            {post.category}
          </span>
          <h1 className="text-[#081534] text-[28px] sm:text-[36px] lg:text-[44px] font-bold leading-tight mb-5">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#76777f] pb-6 border-b border-[#eceef0] mb-8">
            <span className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-full bg-[#081534] text-white flex items-center justify-center text-[10px] font-bold">
                {post.author_name.charAt(0)}
              </div>
              {post.author_name}
            </span>
            <span>·</span>
            <span>{formatDate(post.published_at || post.created_at)}</span>
            <span>·</span>
            <span>{readTime(post.content)} min read</span>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="prose prose-lg max-w-none
            prose-headings:text-[#081534] prose-headings:font-bold
            prose-p:text-[#45464e] prose-p:leading-[1.85]
            prose-strong:text-[#081534]
            prose-blockquote:border-l-4 prose-blockquote:border-[#fdc425] prose-blockquote:bg-[#fdc425]/5 prose-blockquote:px-5 prose-blockquote:py-3 prose-blockquote:rounded-r-xl prose-blockquote:text-[#45464e] prose-blockquote:not-italic
            prose-a:text-[#785a00] prose-a:no-underline hover:prose-a:underline
            prose-ul:text-[#45464e] prose-ol:text-[#45464e]"
          dangerouslySetInnerHTML={{ __html: post.content }} />

        {/* Share */}
        <div className="mt-12 pt-8 border-t border-[#eceef0]">
          <p className="text-[13px] font-bold text-[#45464e] mb-3">Share this post</p>
          <div className="flex gap-3">
            <a href={`https://wa.me/?text=${encodeURIComponent(`${post.title} - ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-full text-[12px] font-bold hover:opacity-90 transition-all">
              <span className="material-symbols-outlined text-[16px]">share</span> WhatsApp
            </a>
            <a href={`https://t.me/share/url?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent(post.title)}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#229ED9] text-white rounded-full text-[12px] font-bold hover:opacity-90 transition-all">
              <span className="material-symbols-outlined text-[16px]">send</span> Telegram
            </a>
          </div>
        </div>
      </div>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="bg-white border-t border-[#eceef0] py-16 px-6">
          <div className="max-w-[1100px] mx-auto">
            <h2 className="text-[20px] font-bold text-[#081534] mb-6">More {post.category}s</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {related.map(p => (
                <Link key={p.id} href={`/devotionals/${p.slug}`}
                  className="group block bg-[#f7f9fb] rounded-xl border border-[#eceef0] overflow-hidden hover:shadow-md hover:border-[#fdc425]/30 transition-all">
                  {p.cover_image && (
                    <div className="h-36 overflow-hidden">
                      <img src={p.cover_image} alt={p.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-[13px] font-bold text-[#081534] line-clamp-2 group-hover:text-[#785a00] transition-colors">
                      {p.title}
                    </h3>
                    <p className="text-[11px] text-[#76777f] mt-2">
                      {formatDate(p.published_at || p.created_at)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}