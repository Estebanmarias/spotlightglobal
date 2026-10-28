import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Ban, Baby, BadgeCheck, Bell, BellRing,
  BookOpen, Cake, Calendar, CalendarDays, CalendarX, Check, ChevronDown, ChevronLeft,
ChevronRight, Church, Smartphone, CircleAlert, CircleCheck, CircleDot, CirclePlay, CirclePlus,
  ClipboardCheck, Clock, Contact, Copy, CreditCard, Download, ExternalLink, FileText,
  Gavel, Globe, Grip, HandHeart, Handshake, Heart, House, IdCard, ImagePlus, Images, Info,
  KeyRound, LayoutDashboard, LayoutGrid, Link2, LoaderCircle, Lock, LogIn, LogOut, Mail,
  MailCheck, MapPin, Menu, MessageCircle, Music, PenLine, Pencil, Phone, PiggyBank, Plus,
  Podcast, Receipt, Search, Send, Share2, ShieldCheck, Sprout, Tag, Trash2, Upload, User,
  UserCheck, UserMinus, UserPlus, UserX, Users, Video, X, type LucideIcon,
} from 'lucide-react'

import { Gem, GraduationCap, Zap } from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
    add: Plus, bolt: Zap, diamond: Gem, school: GraduationCap, menu_book: BookOpen, add_circle: CirclePlus, add_photo_alternate: ImagePlus,
  arrow_back: ArrowLeft, arrow_downward: ArrowDown, arrow_forward: ArrowRight, arrow_outward: ArrowUpRight,
  article: FileText, auto_stories: BookOpen, badge: IdCard, block: Ban,
  cake: Cake, calendar_month: Calendar, calendar_today: Calendar, call: Phone,
  category: LayoutGrid, chat: MessageCircle, chat_bubble: MessageCircle,
  check: Check, check_circle: CircleCheck, chevron_left: ChevronLeft, chevron_right: ChevronRight,
  child_care: Baby, church: Church, close: X, contact_mail: Contact, content_copy: Copy,
  dashboard: LayoutDashboard, delete: Trash2, dialpad: Smartphone, download: Download,
  edit: Pencil, edit_note: PenLine, energy_savings_leaf: Sprout, error: CircleAlert,
  event: CalendarDays, event_busy: CalendarX, expand_more: ChevronDown,
  fact_check: ClipboardCheck, favorite: Heart, gavel: Gavel,
  group: Users, group_off: UserX, groups: Users, handshake: Handshake, home: House,
  how_to_reg: UserCheck, info: Info, language: Globe, link: Link2, location_on: MapPin,
  lock: Lock, lock_reset: KeyRound, login: LogIn, logout: LogOut, loyalty: Tag,
  mail: Mail, man: User, manage_search: Search, mark_email_read: MailCheck,
  mark_email_unread: Mail, menu: Menu, music_note: Music, notifications: Bell,
  notifications_active: BellRing, open_in_new: ExternalLink, person: User, person_add: UserPlus,
  person_remove: UserMinus, phone: Phone, photo_library: Images, picture_as_pdf: FileText,
  place: MapPin, play_circle: CirclePlay, podcasts: Podcast, point_of_sale: CreditCard,
  progress_activity: LoaderCircle, public: Globe, radio_button_checked: CircleDot,
  receipt_long: Receipt, savings: PiggyBank, schedule: Clock, search: Search, send: Send,
  share: Share2, travel_explore: Globe, upload: Upload, verified: BadgeCheck,
  verified_user: ShieldCheck, videocam: Video, volunteer_activism: HandHeart, woman: User,
}

// If the caller sets a text size, honour it; otherwise keep the old 24px default
const HAS_SIZE = /\btext-(?:\[[\d.]+px\]|xs|sm|base|lg|xl|[2-9]xl)(?=\s|$)/

export default function Icon({ name, className = '' }: { name: string; className?: string }) {
  const Glyph = ICONS[name]
  if (!Glyph) {
    if (process.env.NODE_ENV !== 'production') console.warn(`[Icon] no icon mapped for "${name}"`)
    return null
  }
  return (
    <Glyph
      size="1em"
      aria-hidden="true"
      className={`shrink-0 ${HAS_SIZE.test(className) ? '' : 'text-[24px]'} ${className}`.trim()}
    />
  )
}