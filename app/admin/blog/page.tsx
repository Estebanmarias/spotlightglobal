'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { getSupabaseClient } from '@/lib/supabase'
import { useAdminAccess } from '@/lib/use-admin-permissions'
import AdminLoader from '@/components/AdminLoader'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import TiptapLink from '@tiptap/extension-link'

type Post = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  cover_image: string | null
  category: string
  status: string
  author_name: string
  published_at: string | null
  created_at: string
}

const CATEGORIES = ['Devotional', 'Sermon Notes', 'Teaching', 'Announcement', 'Testimony', 'Prayer']

const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

// ── Toolbar ───────────────────────────────────────────────────────
function Toolbar({ editor }: { editor: any }) {
  if (!editor) return null

  const btn = (
    action: () => void,
    active: boolean,
    label: string,
    title: string
  ) => (
    <button type="button" onClick={action} title={title}
      className={`px-2 h-8 flex items-center justify-center rounded-lg text-[12px] font-bold transition-all min-w-[32px]
        ${active ? 'bg-[#081534] text-white' : 'text-[#45464e] hover:bg-[#f2f4f6]'}`}>
      {label}
    </button>
  )

  const iconBtn = (action: () => void, active: boolean, icon: string, title: string) => (
    <button type="button" onClick={action} title={title}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
        ${active ? 'bg-[#081534] text-white' : 'text-[#45464e] hover:bg-[#f2f4f6]'}`}>
      <span className="material-symbols-outlined text-[16px]">{icon}</span>
    </button>
  )

  const divider = <div className="w-px bg-[#c6c6cf] mx-0.5 h-5 self-center" />

  return (
    <div className="flex flex-wrap gap-0.5 p-2.5 border-b border-[#c6c6cf] bg-[#f7f9fb] rounded-t-xl">
      {iconBtn(() => editor.chain().focus().toggleBold().run(),      editor.isActive('bold'),    'format_bold',   'Bold')}
      {iconBtn(() => editor.chain().focus().toggleItalic().run(),    editor.isActive('italic'),  'format_italic', 'Italic')}
      {iconBtn(() => editor.chain().focus().toggleStrike().run(),    editor.isActive('strike'),  'format_strikethrough', 'Strikethrough')}
      {divider}
      {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }), 'H2', 'Heading 2')}
      {btn(() => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }), 'H3', 'Heading 3')}
      {divider}
      {iconBtn(() => editor.chain().focus().toggleBulletList().run(),  editor.isActive('bulletList'),  'format_list_bulleted', 'Bullet List')}
      {iconBtn(() => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'), 'format_list_numbered', 'Numbered List')}
      {divider}
      {iconBtn(() => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'), 'format_quote', 'Blockquote')}
      {iconBtn(() => editor.chain().focus().setHorizontalRule().run(), false, 'horizontal_rule', 'Divider')}
      {divider}
      {iconBtn(() => editor.chain().focus().undo().run(), false, 'undo', 'Undo')}
      {iconBtn(() => editor.chain().focus().redo().run(), false, 'redo', 'Redo')}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────
function BlogAdminContent() {
  const supabase = getSupabaseClient()
  const router   = useRouter()
  const access   = useAdminAccess('blog' as any)

  const [posts, setPosts]       = useState<Post[]>([])
  const [loading, setLoading]   = useState(true)
  const [view, setView]         = useState<'list' | 'editor'>('list')
  const [editPost, setEditPost] = useState<Post | null>(null)
  const [saving, setSaving]     = useState(false)
  const [deleteTarget, setDelete] = useState<Post | null>(null)
  const [toast, setToast]       = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const [form, setForm] = useState({
    title: '', slug: '', excerpt: '', cover_image: '',
    category: 'Devotional', status: 'draft', author_name: 'Apostle Edet Kingsley',
  })

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing your post here…' }),
      CharacterCount,
      TiptapLink.configure({ openOnClick: false }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[280px] px-4 py-4 text-[15px] leading-relaxed text-[#191c1e]',
      },
    },
  })

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchPosts = async () => {
    setLoading(true)
    const { data } = await (supabase.from('blog_posts') as any)
      .select('*').order('created_at', { ascending: false })
    setPosts(data || [])
    setLoading(false)
  }

  useEffect(() => { if (!access.loading) fetchPosts() }, [access.loading])

  const openNew = () => {
    setEditPost(null)
    setForm({ title: '', slug: '', excerpt: '', cover_image: '', category: 'Devotional', status: 'draft', author_name: 'Apostle Edet Kingsley' })
    editor?.commands.setContent('')
    setView('editor')
  }

  const openEdit = (p: Post) => {
    setEditPost(p)
    setForm({
      title: p.title, slug: p.slug, excerpt: p.excerpt || '',
      cover_image: p.cover_image || '', category: p.category,
      status: p.status, author_name: p.author_name,
    })
    editor?.commands.setContent(p.content)
    setView('editor')
  }

  const handleSave = async (status?: string) => {
    if (!form.title.trim()) { showToast('Title is required', 'error'); return }
    if (!editor?.getText().trim()) { showToast('Content is required', 'error'); return }
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    const finalStatus = status || form.status
    const payload = {
      title:        form.title.trim(),
      slug:         form.slug || slugify(form.title),
      excerpt:      form.excerpt.trim() || null,
      content:      editor?.getHTML() || '',
      cover_image:  form.cover_image.trim() || null,
      category:     form.category,
      status:       finalStatus,
      author_name:  form.author_name.trim(),
      author_id:    user?.id || null,
      published_at: finalStatus === 'published' ? new Date().toISOString() : null,
      updated_at:   new Date().toISOString(),
    }

    if (editPost) {
      const { error } = await (supabase.from('blog_posts') as any).update(payload).eq('id', editPost.id)
      if (error) { showToast('Failed to update post', 'error'); setSaving(false); return }
      showToast(finalStatus === 'published' ? 'Post published!' : 'Draft saved')
    } else {
      const { error } = await (supabase.from('blog_posts') as any).insert(payload)
      if (error) {
        if (error.code === '23505') { showToast('Slug already exists — change the title', 'error'); setSaving(false); return }
        showToast('Failed to create post', 'error'); setSaving(false); return
      }
      showToast(finalStatus === 'published' ? 'Post published!' : 'Draft saved')
    }

    setSaving(false)
    setView('list')
    fetchPosts()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const { error } = await (supabase.from('blog_posts') as any).delete().eq('id', deleteTarget.id)
    if (error) { showToast('Failed to delete', 'error'); setDelete(null); return }
    showToast('Post deleted')
    setDelete(null)
    fetchPosts()
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })

  if (access.loading) return <AdminLoader />

  const inputCls = 'w-full bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3 rounded-t-lg text-[14px] transition-colors'

  return (
    <div className="bg-[#f7f9fb] min-h-screen">

      {/* ── Header ── */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#c6c6cf] px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 pl-12 lg:pl-0">
            {/* Back to dashboard */}
            <button onClick={() => view === 'editor' ? setView('list') : router.push('/admin/dashboard')}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-[#45464e] hover:bg-[#f2f4f6] transition-colors shrink-0">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div>
              <h2 className="text-[18px] sm:text-[22px] font-bold text-[#081534]">
                {view === 'list' ? 'Blog & Devotionals' : editPost ? 'Edit Post' : 'New Post'}
              </h2>
              <p className="text-[11px] text-[#45464e] hidden sm:block">
                {view === 'list'
                  ? `${posts.filter(p => p.status === 'published').length} published · ${posts.filter(p => p.status === 'draft').length} drafts`
                  : 'Write and publish your post'}
              </p>
            </div>
          </div>
          {view === 'list' && (
            <button onClick={openNew}
              className="flex items-center gap-1.5 bg-[#081534] text-white px-4 py-2.5 rounded-xl text-[12px] sm:text-[13px] font-bold hover:opacity-90 transition-opacity shrink-0">
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span className="hidden sm:inline">New Post</span>
            </button>
          )}
          {view === 'editor' && (
            <div className="flex gap-2 shrink-0">
              <button onClick={() => handleSave('draft')} disabled={saving}
                className="px-3 sm:px-4 py-2 bg-[#f2f4f6] text-[#081534] rounded-lg text-[12px] font-bold hover:bg-[#eceef0] disabled:opacity-40">
                {saving ? '…' : 'Draft'}
              </button>
              <button onClick={() => handleSave('published')} disabled={saving}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[#081534] text-white rounded-lg text-[12px] font-bold hover:opacity-90 disabled:opacity-40">
                {saving
                  ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <span className="material-symbols-outlined text-[14px]">public</span>}
                <span className="hidden sm:inline">Publish</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">

        {/* ── LIST VIEW ── */}
        {view === 'list' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Total',      value: posts.length,                                       icon: 'article',   bg: 'bg-[#081534]' },
                { label: 'Published',  value: posts.filter(p => p.status === 'published').length, icon: 'public',    bg: 'bg-green-700' },
                { label: 'Drafts',     value: posts.filter(p => p.status === 'draft').length,     icon: 'edit_note', bg: 'bg-[#45464e]' },
                { label: 'Categories', value: new Set(posts.map(p => p.category)).size,           icon: 'category',  bg: 'bg-[#fdc425]' },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white border border-[#c6c6cf] p-4 rounded-xl">
                  <div className={`p-1.5 rounded-lg ${s.bg} text-white inline-block mb-2`}>
                    <span className="material-symbols-outlined text-[16px]">{s.icon}</span>
                  </div>
                  <p className="text-[10px] text-[#45464e] uppercase tracking-widest font-bold">{s.label}</p>
                  <p className="text-[22px] font-bold text-[#081534] mt-0.5">{loading ? '—' : s.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Posts list */}
            <div className="bg-white border border-[#c6c6cf] rounded-xl overflow-hidden">
              {loading ? (
                <div className="p-6 space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-[#f2f4f6] rounded-lg animate-pulse" />)}
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <span className="material-symbols-outlined text-[48px] text-[#c6c6cf] block mb-3">article</span>
                  <p className="text-[#45464e] font-semibold">No posts yet</p>
                  <p className="text-[12px] text-[#76777f] mt-1 mb-5">Write your first devotional</p>
                  <button onClick={openNew}
                    className="px-5 py-2.5 bg-[#081534] text-white rounded-lg text-[13px] font-bold hover:opacity-90">
                    Write First Post
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#f2f4f6]">
                  {posts.map((p, i) => (
                    <motion.div key={p.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#f7f9fb] transition-colors">
                      {/* Thumbnail */}
                      {p.cover_image ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-[#eceef0]">
                          <img src={p.cover_image} alt={p.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[#081534] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[#fdc425] text-[20px]">article</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[13px] font-bold text-[#081534] truncate">{p.title}</p>
                          <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase
                            ${p.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-[#f2f4f6] text-[#45464e]'}`}>
                            {p.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#76777f]">
                          {p.category} · {formatDate(p.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {p.status === 'published' && (
                          <button
                            onClick={() => router.push(`/admin/messaging?title=${encodeURIComponent(p.title)}&slug=${p.slug}`)}
                            title="Broadcast this post"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#45464e] hover:text-[#081534] hover:bg-[#f2f4f6] transition-all">
                            <span className="material-symbols-outlined text-[16px]">send</span>
                          </button>
                        )}
                        <button onClick={() => openEdit(p)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#45464e] hover:text-[#081534] hover:bg-[#f2f4f6] transition-all">
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button onClick={() => setDelete(p)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#45464e] hover:text-[#ba1a1a] hover:bg-[#ffdad6] transition-all">
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── EDITOR VIEW ── */}
        {view === 'editor' && (
          <div className="max-w-[860px] mx-auto space-y-4 pb-8">

            {/* Cover preview */}
            {form.cover_image && (
              <div className="relative h-40 sm:h-52 rounded-2xl overflow-hidden bg-[#eceef0]">
                <img src={form.cover_image} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20" />
              </div>
            )}

            {/* Meta */}
            <div className="bg-white border border-[#c6c6cf] rounded-2xl p-4 sm:p-6 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-[#45464e] uppercase tracking-wide block mb-1.5">Title *</label>
                <input value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value, slug: slugify(e.target.value) }))}
                  placeholder="Enter post title…"
                  className="w-full text-[18px] sm:text-[22px] font-bold text-[#081534] bg-transparent border-b-2 border-[#f2f4f6] focus:border-[#081534] outline-none pb-2 transition-colors" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#45464e] uppercase tracking-wide block mb-1.5">Category</label>
                  <select value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className={inputCls}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#45464e] uppercase tracking-wide block mb-1.5">Author</label>
                  <input value={form.author_name}
                    onChange={e => setForm(p => ({ ...p, author_name: e.target.value }))}
                    className={inputCls} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#45464e] uppercase tracking-wide block mb-1.5">Cover Image URL</label>
                  <input value={form.cover_image}
                    onChange={e => setForm(p => ({ ...p, cover_image: e.target.value }))}
                    placeholder="https://…" className={inputCls} />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#45464e] uppercase tracking-wide block mb-1.5">Excerpt</label>
                <textarea value={form.excerpt}
                  onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))}
                  rows={2} placeholder="Brief summary shown in post list…"
                  className="w-full bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3 rounded-t-lg text-[14px] transition-colors resize-none" />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#45464e] uppercase tracking-wide block mb-1.5">URL Slug</label>
                <div className="flex items-center gap-2 bg-[#f2f4f6] px-3 py-2 rounded-lg overflow-hidden">
                  <span className="text-[11px] text-[#76777f] shrink-0">/devotionals/</span>
                  <input value={form.slug}
                    onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
                    className="flex-1 bg-transparent outline-none text-[12px] text-[#081534] font-semibold min-w-0" />
                </div>
              </div>
            </div>

            {/* Editor */}
            <div className="bg-white border border-[#c6c6cf] rounded-2xl overflow-hidden">
              <Toolbar editor={editor} />
              <EditorContent editor={editor} />
              {editor && (
                <div className="px-4 py-2 border-t border-[#f2f4f6] flex justify-end">
                  <span className="text-[11px] text-[#76777f]">
                    {editor.storage.characterCount.characters()} chars
                  </span>
                </div>
              )}
            </div>

            {/* Mobile save buttons */}
            <div className="flex gap-3 sm:hidden">
              <button onClick={() => setView('list')}
                className="flex-1 py-3 border border-[#c6c6cf] text-[#45464e] rounded-xl text-[13px] font-semibold">
                Cancel
              </button>
              <button onClick={() => handleSave('draft')} disabled={saving}
                className="flex-1 py-3 bg-[#f2f4f6] text-[#081534] rounded-xl text-[13px] font-bold disabled:opacity-40">
                Save Draft
              </button>
              <button onClick={() => handleSave('published')} disabled={saving}
                className="flex-1 py-3 bg-[#081534] text-white rounded-xl text-[13px] font-bold disabled:opacity-40">
                Publish
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setDelete(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-[380px] p-6 shadow-2xl">
                <div className="w-12 h-12 bg-[#ffdad6] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-[22px]">delete</span>
                </div>
                <h3 className="text-[16px] font-bold text-[#081534] text-center mb-2">Delete Post</h3>
                <p className="text-[13px] text-[#45464e] text-center mb-5">
                  Delete <span className="font-bold">"{deleteTarget.title}"</span>? This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setDelete(null)}
                    className="flex-1 py-3 border border-[#c6c6cf] rounded-xl text-[13px] font-semibold text-[#45464e] hover:bg-[#f2f4f6]">
                    Cancel
                  </button>
                  <button onClick={handleDelete}
                    className="flex-1 py-3 bg-[#ba1a1a] text-white rounded-xl text-[13px] font-bold hover:opacity-90">
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full text-[13px] font-semibold shadow-lg flex items-center gap-2
              ${toast.type === 'error' ? 'bg-[#ba1a1a] text-white' : 'bg-[#081534] text-white'}`}>
            <span className="material-symbols-outlined text-[16px]">
              {toast.type === 'error' ? 'error' : 'check_circle'}
            </span>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function BlogAdminPage() {
  return (
    <Suspense fallback={<AdminLoader />}>
      <BlogAdminContent />
    </Suspense>
  )
}