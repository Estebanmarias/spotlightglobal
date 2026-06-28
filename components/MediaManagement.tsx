'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getSupabaseClient } from '@/lib/supabase'

// ════════════════════════════════════════════════════════════════════
// MediaManagement — Events + Gallery with Supabase Storage uploads
//
// Storage bucket: "church-media"
//   /event-flyers/<uuid>.<ext>
//   /gallery/<uuid>.<ext>
//
// Delete flow: deleting a record also deletes its file from the bucket.
// Replace flow: delete the existing entry → upload a new one.
// ════════════════════════════════════════════════════════════════════

const BUCKET = 'Church-Media'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

type ChurchEvent = {
  id: string
  title: string
  description: string | null
  event_date: string
  event_time: string | null
  flyer_url: string | null
  location: string
  is_featured: boolean
}

type CommunityPhoto = {
  id: string
  image_url: string
  caption: string | null
  sort_order: number
}

const blankEventForm = {
  title: '', description: '', event_date: '', event_time: '',
  flyer_url: '', location: 'Main Auditorium', is_featured: false,
}

const inputCls = 'w-full bg-[#f2f4f6] border-b-2 border-transparent focus:border-[#081534] outline-none px-4 py-3 rounded-t-lg text-[14px] transition-colors'

interface MediaManagementProps {
  viewerRole: 'super_admin' | 'ministry_leader' | 'admin'
}

// ── Helpers ───────────────────────────────────────────────────────
function getStoragePath(url: string | null): string | null {
  if (!url) return null
  // Extract path after /storage/v1/object/public/church-media/
  const marker = `/object/public/${BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.slice(idx + marker.length)
}

function generateFileName(file: File): string {
  const ext = file.name.split('.').pop() ?? 'jpg'
  return `${crypto.randomUUID()}.${ext}`
}

export default function MediaManagement({ viewerRole }: MediaManagementProps) {
  const supabase = getSupabaseClient()
  const [tab, setTab] = useState<'events' | 'gallery'>('events')

  // ── Events state ──────────────────────────────────────────────────
  const [events, setEvents] = useState<ChurchEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [showEventModal, setShowEventModal] = useState(false)
  const [editEvent, setEditEvent] = useState<ChurchEvent | null>(null)
  const [eventForm, setEventForm] = useState(blankEventForm)
  const [deleteEventTarget, setDeleteEventTarget] = useState<ChurchEvent | null>(null)
  const [savingEvent, setSavingEvent] = useState(false)

  // flyer upload
  const flyerInputRef = useRef<HTMLInputElement>(null)
  const [flyerFile, setFlyerFile] = useState<File | null>(null)
  const [flyerPreview, setFlyerPreview] = useState<string>('')
  const [flyerUploading, setFlyerUploading] = useState(false)

  // ── Gallery state ─────────────────────────────────────────────────
  const [photos, setPhotos] = useState<CommunityPhoto[]>([])
  const [photosLoading, setPhotosLoading] = useState(true)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [photoCaption, setPhotoCaption] = useState('')
  const [deletePhotoTarget, setDeletePhotoTarget] = useState<CommunityPhoto | null>(null)
  const [savingPhoto, setSavingPhoto] = useState(false)

  // photo upload
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>('')
  const [photoUploading, setPhotoUploading] = useState(false)

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Fetchers ──────────────────────────────────────────────────────
  const fetchEvents = async () => {
    setEventsLoading(true)
    const { data } = await (supabase.from('church_events') as any)
      .select('*').order('event_date', { ascending: true })
    setEvents(data || [])
    setEventsLoading(false)
  }

  const fetchPhotos = async () => {
    setPhotosLoading(true)
    const { data } = await (supabase.from('community_photos') as any)
      .select('*').order('sort_order', { ascending: true })
    setPhotos(data || [])
    setPhotosLoading(false)
  }

  useEffect(() => {
    fetchEvents()
    fetchPhotos()
    const ch = supabase
      .channel('media-mgmt-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'church_events' }, fetchEvents)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_photos' }, fetchPhotos)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  // ── Storage upload helper ─────────────────────────────────────────
  const uploadFile = async (file: File, folder: 'gallery' | 'event-flyers'): Promise<string | null> => {
    const fileName = generateFileName(file)
    const path = `${folder}/${fileName}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })
    if (error) { showToast(`Upload failed: ${error.message}`, 'error'); return null }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
  }

  const deleteFromStorage = async (url: string | null) => {
    const path = getStoragePath(url)
    if (!path) return
    await supabase.storage.from(BUCKET).remove([path])
  }

  // ── Flyer file picker ─────────────────────────────────────────────
  const handleFlyerPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFlyerFile(file)
    setFlyerPreview(URL.createObjectURL(file))
    setEventForm(p => ({ ...p, flyer_url: '' })) // clear URL field
  }

  const handleRemoveFlyerPreview = () => {
    setFlyerFile(null)
    setFlyerPreview('')
    if (flyerInputRef.current) flyerInputRef.current.value = ''
  }

  // ── Photo file picker ─────────────────────────────────────────────
  const handlePhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleRemovePhotoPreview = () => {
    setPhotoFile(null)
    setPhotoPreview('')
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  // ── Event CRUD ────────────────────────────────────────────────────
  const openAddEvent = () => {
    setEventForm(blankEventForm)
    setEditEvent(null)
    setFlyerFile(null)
    setFlyerPreview('')
    setShowEventModal(true)
  }

  const openEditEvent = (e: ChurchEvent) => {
    setEventForm({
      title: e.title, description: e.description ?? '',
      event_date: e.event_date, event_time: e.event_time ?? '',
      flyer_url: e.flyer_url ?? '', location: e.location, is_featured: e.is_featured,
    })
    setEditEvent(e)
    setFlyerFile(null)
    setFlyerPreview('')
    setShowEventModal(true)
  }

  const handleSaveEvent = async () => {
    if (!eventForm.title.trim() || !eventForm.event_date) return
    setSavingEvent(true)

    const { data: { user } } = await supabase.auth.getUser()

    let finalFlyerUrl = eventForm.flyer_url || null

    // If a new file was picked, upload it
    if (flyerFile) {
      setFlyerUploading(true)
      // Delete old flyer from storage if replacing
      if (editEvent?.flyer_url) await deleteFromStorage(editEvent.flyer_url)
      const uploaded = await uploadFile(flyerFile, 'event-flyers')
      setFlyerUploading(false)
      if (!uploaded) { setSavingEvent(false); return }
      finalFlyerUrl = uploaded
    }

    const payload = {
      title: eventForm.title.trim(),
      description: eventForm.description.trim() || null,
      event_date: eventForm.event_date,
      event_time: eventForm.event_time.trim() || null,
      flyer_url: finalFlyerUrl,
      location: eventForm.location.trim() || 'Main Auditorium',
      is_featured: eventForm.is_featured,
      added_by: user?.id ?? null,
    }

    if (editEvent) {
      const { error } = await (supabase.from('church_events') as any)
        .update(payload).eq('id', editEvent.id)
      if (error) { showToast('Failed to update event', 'error'); setSavingEvent(false); return }
      showToast('Event updated')
    } else {
      const { error } = await (supabase.from('church_events') as any).insert(payload)
      if (error) { showToast('Failed to create event', 'error'); setSavingEvent(false); return }
      showToast('Event created')
    }

    setSavingEvent(false)
    setShowEventModal(false)
    setEditEvent(null)
    setFlyerFile(null)
    setFlyerPreview('')
  }

  const handleDeleteEvent = async () => {
    if (!deleteEventTarget) return
    // Delete flyer from storage first
    await deleteFromStorage(deleteEventTarget.flyer_url)
    const { error } = await (supabase.from('church_events') as any)
      .delete().eq('id', deleteEventTarget.id)
    if (error) { showToast('Failed to delete event', 'error'); setDeleteEventTarget(null); return }
    showToast('Event removed')
    setDeleteEventTarget(null)
  }

  // ── Photo CRUD ────────────────────────────────────────────────────
  const openAddPhoto = () => {
    setPhotoCaption('')
    setPhotoFile(null)
    setPhotoPreview('')
    setShowPhotoModal(true)
  }

  const handleSavePhoto = async () => {
    if (!photoFile) return
    setSavingPhoto(true)

    const { data: { user } } = await supabase.auth.getUser()

    setPhotoUploading(true)
    const uploaded = await uploadFile(photoFile, 'gallery')
    setPhotoUploading(false)

    if (!uploaded) { setSavingPhoto(false); return }

    const nextSort = photos.length > 0 ? Math.max(...photos.map(p => p.sort_order)) + 1 : 0

    const { error } = await (supabase.from('community_photos') as any).insert({
      image_url: uploaded,
      caption: photoCaption.trim() || null,
      sort_order: nextSort,
      added_by: user?.id ?? null,
    })

    setSavingPhoto(false)
    if (error) { showToast('Failed to add photo', 'error'); return }
    showToast('Photo added')
    setShowPhotoModal(false)
    setPhotoFile(null)
    setPhotoPreview('')
  }

  const handleDeletePhoto = async () => {
    if (!deletePhotoTarget) return
    // Delete from storage first
    await deleteFromStorage(deletePhotoTarget.image_url)
    const { error } = await (supabase.from('community_photos') as any)
      .delete().eq('id', deletePhotoTarget.id)
    if (error) { showToast('Failed to delete photo', 'error'); setDeletePhotoTarget(null); return }
    showToast('Photo removed')
    setDeletePhotoTarget(null)
  }

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00')
    return date.toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  const isBusy = savingEvent || flyerUploading || savingPhoto || photoUploading

  return (
    <div className="bg-white border border-[#c6c6cf] rounded-xl overflow-hidden">

      {/* Header */}
      <div className="px-5 sm:px-6 py-5 border-b border-[#c6c6cf] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-bold text-[#081534] flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">videocam</span>
            Media — Events & Gallery
          </h3>
          <p className="text-[12px] text-[#45464e] mt-0.5">
            {viewerRole === 'super_admin'
              ? 'Managing on behalf of the Media ministry'
              : 'Content shown on the public Community page'}
          </p>
        </div>
        <div className="flex bg-[#f2f4f6] rounded-lg p-1 gap-1 w-fit">
          {(['events', 'gallery'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md text-[12px] font-semibold transition-all
                ${tab === t ? 'bg-white text-[#081534] shadow-sm' : 'text-[#45464e]'}`}>
              {t === 'events' ? 'Upcoming Events' : 'Gallery'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 sm:p-6">

        {/* ── EVENTS TAB ─────────────────────────────────────────────── */}
        {tab === 'events' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[12px] text-[#45464e]">
                {events.length} event{events.length !== 1 ? 's' : ''} on the public page
              </p>
              <button onClick={openAddEvent}
                className="flex items-center gap-1.5 bg-[#081534] text-white px-4 py-2 rounded-lg text-[12px] font-bold hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-[16px]">add</span> Add Event
              </button>
            </div>

            {eventsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-[#f2f4f6] rounded-lg animate-pulse" />)}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12 bg-[#f7f9fb] rounded-xl border border-dashed border-[#c6c6cf]">
                <span className="material-symbols-outlined text-[40px] text-[#c6c6cf] block mb-2">event</span>
                <p className="text-[13px] text-[#45464e] font-semibold">No events yet</p>
                <p className="text-[11px] text-[#76777f] mt-1">Add one to show it on the public Community page</p>
              </div>
            ) : (
              <div className="space-y-2">
                {events.map(e => (
                  <div key={e.id}
                    className="flex items-center justify-between p-3.5 bg-[#f7f9fb] rounded-lg border border-[#eceef0] hover:border-[#c6c6cf] transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      {e.flyer_url ? (
                        <img src={e.flyer_url} alt={e.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[#081534] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-white text-[18px]">event</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-bold text-[#081534] truncate">{e.title}</p>
                          {e.is_featured && (
                            <span className="px-1.5 py-0.5 bg-[#fdc425] text-[#6d5200] text-[9px] font-bold rounded uppercase shrink-0">Featured</span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#45464e]">
                          {formatDate(e.event_date)}{e.event_time ? ` · ${e.event_time}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEditEvent(e)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[#45464e] hover:text-[#081534] hover:bg-white transition-all">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button onClick={() => setDeleteEventTarget(e)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[#45464e] hover:text-[#ba1a1a] hover:bg-[#ffdad6] transition-all">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── GALLERY TAB ────────────────────────────────────────────── */}
        {tab === 'gallery' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[12px] text-[#45464e]">
                {photos.length} photo{photos.length !== 1 ? 's' : ''} in the public gallery
              </p>
              <button onClick={openAddPhoto}
                className="flex items-center gap-1.5 bg-[#081534] text-white px-4 py-2 rounded-lg text-[12px] font-bold hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span> Add Photo
              </button>
            </div>

            {/* Storage tip */}
            <div className="flex items-start gap-2 p-3 bg-[#f7f9fb] rounded-lg border border-[#eceef0] mb-4">
              <span className="material-symbols-outlined text-[16px] text-[#45464e] mt-0.5 shrink-0">info</span>
              <p className="text-[11px] text-[#45464e] leading-relaxed">
                Photos are stored in Supabase. To replace a photo, delete it and upload a new one.
                This keeps storage clean — deleted photos are removed from the bucket immediately.
              </p>
            </div>

            {photosLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {[...Array(8)].map((_, i) => <div key={i} className="aspect-square bg-[#f2f4f6] rounded-lg animate-pulse" />)}
              </div>
            ) : photos.length === 0 ? (
              <div className="text-center py-12 bg-[#f7f9fb] rounded-xl border border-dashed border-[#c6c6cf]">
                <span className="material-symbols-outlined text-[40px] text-[#c6c6cf] block mb-2">photo_library</span>
                <p className="text-[13px] text-[#45464e] font-semibold">No photos yet</p>
                <p className="text-[11px] text-[#76777f] mt-1">Add one to show it on the public Community page</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {photos.map(p => (
                  <div key={p.id} className="group relative aspect-square rounded-lg overflow-hidden">
                    <img src={p.image_url} alt={p.caption ?? ''} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                      <button onClick={() => setDeletePhotoTarget(p)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-[#ba1a1a] hover:bg-white">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                    {p.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-[10px] truncate">{p.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ADD / EDIT EVENT MODAL
      ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showEventModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
              onClick={() => !isBusy && setShowEventModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-[480px] max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#c6c6cf]">
                  <h3 className="text-[16px] font-bold text-[#081534]">
                    {editEvent ? 'Edit Event' : 'Add Event'}
                  </h3>
                  <button onClick={() => setShowEventModal(false)} disabled={isBusy}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#45464e] hover:bg-[#f2f4f6] disabled:opacity-40">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                  {/* Title */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-[#45464e] uppercase tracking-wide">Title *</label>
                    <input value={eventForm.title}
                      onChange={e => setEventForm(p => ({ ...p, title: e.target.value }))}
                      placeholder="Sunday Worship Service" className={inputCls} />
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-[#45464e] uppercase tracking-wide">Description</label>
                    <textarea value={eventForm.description}
                      onChange={e => setEventForm(p => ({ ...p, description: e.target.value }))}
                      rows={2} className={inputCls + ' resize-none'} />
                  </div>

                  {/* Date + Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-[#45464e] uppercase tracking-wide">Date *</label>
                      <input type="date" value={eventForm.event_date}
                        onChange={e => setEventForm(p => ({ ...p, event_date: e.target.value }))}
                        className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-[#45464e] uppercase tracking-wide">Time</label>
                      <input value={eventForm.event_time}
                        onChange={e => setEventForm(p => ({ ...p, event_time: e.target.value }))}
                        placeholder="9:00 AM" className={inputCls} />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-[#45464e] uppercase tracking-wide">Location</label>
                    <input value={eventForm.location}
                      onChange={e => setEventForm(p => ({ ...p, location: e.target.value }))}
                      className={inputCls} />
                  </div>

                  {/* Flyer upload */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-[#45464e] uppercase tracking-wide">
                      Event Flyer (optional)
                    </label>

                    {/* Show current stored flyer if editing and no new file picked */}
                    {editEvent?.flyer_url && !flyerPreview && (
                      <div className="relative rounded-lg overflow-hidden h-32 bg-[#f7f9fb] group">
                        <img src={editEvent.flyer_url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <button type="button"
                            onClick={() => setEventForm(p => ({ ...p, flyer_url: '' }))}
                            className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-white rounded-lg text-[11px] font-bold text-[#ba1a1a] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">delete</span> Remove flyer
                          </button>
                        </div>
                        <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                          Current flyer
                        </div>
                      </div>
                    )}

                    {/* File preview */}
                    {flyerPreview && (
                      <div className="relative rounded-lg overflow-hidden h-32 bg-[#f7f9fb]">
                        <img src={flyerPreview} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={handleRemoveFlyerPreview}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors">
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                        <div className="absolute top-2 left-2 bg-[#081534]/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                          New upload
                        </div>
                      </div>
                    )}

                    {/* Upload button */}
                    {!flyerPreview && (
                      <button type="button" onClick={() => flyerInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-[#c6c6cf] rounded-lg text-[12px] font-semibold text-[#45464e] hover:border-[#081534] hover:text-[#081534] transition-all">
                        <span className="material-symbols-outlined text-[18px]">upload</span>
                        {editEvent?.flyer_url ? 'Upload replacement flyer' : 'Upload flyer image'}
                      </button>
                    )}
                    <input ref={flyerInputRef} type="file" accept="image/*" className="hidden"
                      onChange={handleFlyerPick} />
                    <p className="text-[10px] text-[#76777f]">JPG, PNG, WebP — max 5MB recommended</p>
                  </div>

                  {/* Featured */}
                  <label className="flex items-center gap-2.5 p-3 bg-[#f7f9fb] rounded-lg cursor-pointer">
                    <input type="checkbox" checked={eventForm.is_featured}
                      onChange={e => setEventForm(p => ({ ...p, is_featured: e.target.checked }))}
                      className="w-4 h-4 accent-[#081534]" />
                    <span className="text-[13px] font-semibold text-[#191c1e]">Feature this event</span>
                    <span className="text-[11px] text-[#76777f]">— shown prominently on the community page</span>
                  </label>
                </div>

                <div className="px-6 py-4 border-t border-[#c6c6cf] flex gap-3">
                  <button onClick={() => setShowEventModal(false)} disabled={isBusy}
                    className="flex-1 py-3 border border-[#c6c6cf] text-[#45464e] rounded-xl text-[13px] font-semibold hover:bg-[#f2f4f6] disabled:opacity-40">
                    Cancel
                  </button>
                  <button onClick={handleSaveEvent}
                    disabled={!eventForm.title.trim() || !eventForm.event_date || isBusy}
                    className="flex-1 py-3 bg-[#081534] text-white rounded-xl text-[13px] font-bold hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2">
                    {flyerUploading ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</>
                    ) : savingEvent ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                    ) : editEvent ? 'Save Changes' : 'Add Event'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════
          ADD PHOTO MODAL
      ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showPhotoModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
              onClick={() => !isBusy && setShowPhotoModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#c6c6cf]">
                  <h3 className="text-[16px] font-bold text-[#081534]">Add Photo</h3>
                  <button onClick={() => setShowPhotoModal(false)} disabled={isBusy}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#45464e] hover:bg-[#f2f4f6] disabled:opacity-40">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                  {/* Drop zone / preview */}
                  {photoPreview ? (
                    <div className="relative rounded-xl overflow-hidden bg-[#f7f9fb]" style={{ aspectRatio: '4/3' }}>
                      <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={handleRemovePhotoPreview}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => photoInputRef.current?.click()}
                      className="w-full flex flex-col items-center justify-center gap-3 py-10 border-2 border-dashed border-[#c6c6cf] rounded-xl text-[#45464e] hover:border-[#081534] hover:text-[#081534] hover:bg-[#f7f9fb] transition-all">
                      <span className="material-symbols-outlined text-[36px]">add_photo_alternate</span>
                      <div className="text-center">
                        <p className="text-[13px] font-bold">Click to upload a photo</p>
                        <p className="text-[11px] text-[#76777f] mt-0.5">JPG, PNG, WebP — max 5MB recommended</p>
                      </div>
                    </button>
                  )}
                  <input ref={photoInputRef} type="file" accept="image/*" className="hidden"
                    onChange={handlePhotoPick} />

                  {/* Caption */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-[#45464e] uppercase tracking-wide">Caption (optional)</label>
                    <input value={photoCaption}
                      onChange={e => setPhotoCaption(e.target.value)}
                      placeholder="Describe this moment…" className={inputCls} />
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-[#c6c6cf] flex gap-3">
                  <button onClick={() => setShowPhotoModal(false)} disabled={isBusy}
                    className="flex-1 py-3 border border-[#c6c6cf] text-[#45464e] rounded-xl text-[13px] font-semibold hover:bg-[#f2f4f6] disabled:opacity-40">
                    Cancel
                  </button>
                  <button onClick={handleSavePhoto} disabled={!photoFile || isBusy}
                    className="flex-1 py-3 bg-[#081534] text-white rounded-xl text-[13px] font-bold hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2">
                    {photoUploading ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</>
                    ) : savingPhoto ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                    ) : 'Add Photo'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Delete confirms ───────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteEventTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
              onClick={() => setDeleteEventTarget(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-[380px] p-6 shadow-2xl">
                <div className="w-12 h-12 bg-[#ffdad6] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-[22px]">delete</span>
                </div>
                <h3 className="text-[16px] font-bold text-[#081534] text-center mb-2">Remove Event</h3>
                <p className="text-[13px] text-[#45464e] text-center mb-2">
                  Remove <span className="font-bold text-[#081534]">{deleteEventTarget.title}</span> from the public page?
                </p>
                {deleteEventTarget.flyer_url && (
                  <p className="text-[11px] text-[#ba1a1a] text-center mb-4">
                    The event flyer image will also be permanently deleted from storage.
                  </p>
                )}
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setDeleteEventTarget(null)}
                    className="flex-1 py-3 border border-[#c6c6cf] rounded-xl text-[13px] font-semibold text-[#45464e] hover:bg-[#f2f4f6]">
                    Cancel
                  </button>
                  <button onClick={handleDeleteEvent}
                    className="flex-1 py-3 bg-[#ba1a1a] text-white rounded-xl text-[13px] font-bold hover:opacity-90">
                    Remove
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletePhotoTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
              onClick={() => setDeletePhotoTarget(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-[380px] p-6 shadow-2xl">
                <div className="w-12 h-12 bg-[#ffdad6] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-[22px]">delete</span>
                </div>
                <h3 className="text-[16px] font-bold text-[#081534] text-center mb-2">Remove Photo</h3>
                <p className="text-[13px] text-[#45464e] text-center mb-2">
                  This photo will be removed from the public gallery.
                </p>
                <p className="text-[11px] text-[#ba1a1a] text-center mb-4">
                  The image file will also be permanently deleted from storage.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setDeletePhotoTarget(null)}
                    className="flex-1 py-3 border border-[#c6c6cf] rounded-xl text-[13px] font-semibold text-[#45464e] hover:bg-[#f2f4f6]">
                    Cancel
                  </button>
                  <button onClick={handleDeletePhoto}
                    className="flex-1 py-3 bg-[#ba1a1a] text-white rounded-xl text-[13px] font-bold hover:opacity-90">
                    Remove
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