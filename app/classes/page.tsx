import type { Metadata } from 'next'
import { getSupabaseAdminClient } from '@/lib/supabase-server'
import ClassesClient, { type PublicIntake, type PublicProgram } from './ClassesClient'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Classes',
  description: 'Membership Class, the Spotlight Leadership Course and the School of Shift at theSpotlightChurch.',
}

type ProgramRow = {
  id: string; slug: string; name: string; summary: string; perks: string[]
  prerequisite_program_id: string | null; requires_approval: boolean
}
type IntakeRow = {
  id: string; program_id: string; title: string; start_date: string; end_date: string
  registration_open: boolean; registration_deadline: string | null; capacity: number | null
  price: number; currency: string
}

export default async function ClassesPage() {
  const today = new Date().toISOString().slice(0, 10)
  let programs: PublicProgram[] = []
  let intakes: PublicIntake[] = []

  try {
    const supabase = getSupabaseAdminClient()
    const [programRes, intakeRes, enrollmentRes] = await Promise.all([
      supabase.from('class_programs')
        .select('id, slug, name, summary, perks, prerequisite_program_id, requires_approval')
        .eq('is_active', true).order('sort_order'),
      supabase.from('class_intakes')
        .select('id, program_id, title, start_date, end_date, registration_open, registration_deadline, capacity, price, currency')
        .gte('end_date', today).order('start_date'),
      supabase.from('class_enrollments').select('intake_id').not('status', 'in', '(dropped,rejected)'),
    ])

    const used = new Map<string, number>()
    for (const row of (enrollmentRes.data ?? []) as { intake_id: string }[]) {
      used.set(row.intake_id, (used.get(row.intake_id) ?? 0) + 1)
    }
    const rows = (programRes.data ?? []) as ProgramRow[]
    const nameById = new Map(rows.map(p => [p.id, p.name]))

    programs = rows.map(p => ({
      id: p.id, slug: p.slug, name: p.name, summary: p.summary, perks: p.perks ?? [],
      prerequisiteName: p.prerequisite_program_id ? nameById.get(p.prerequisite_program_id) ?? null : null,
      requiresApproval: p.requires_approval,
    }))
    intakes = ((intakeRes.data ?? []) as IntakeRow[]).map(i => {
      const spotsLeft = i.capacity ? Math.max(i.capacity - (used.get(i.id) ?? 0), 0) : null
      return {
        id: i.id, program_id: i.program_id, title: i.title, start_date: i.start_date, end_date: i.end_date,
        price: Number(i.price), currency: i.currency, spotsLeft,
        open: i.registration_open && (!i.registration_deadline || i.registration_deadline >= today) && spotsLeft !== 0,
      }
    })
  } catch (error) {
    console.error('[CLASSES PAGE]', error)
  }

  return <ClassesClient programs={programs} intakes={intakes} />
}