import Link from 'next/link'
import Icon from '@/components/Icon'
import Reveal from '@/components/Reveal'

const classes = [
  { icon: 'groups', title: 'Membership Class', tag: 'Start here', desc: 'Start here. Learn what we believe and take your place in the family.' },
  { icon: 'school', title: 'Spotlight Leadership Course', tag: '3-month course', desc: 'A three-month course that prepares you to lead and serve.' },
  { icon: 'bolt', title: 'School of Shift', tag: 'Coaching & growth', desc: 'Coaching and personal development for people ready to go further.' },
]

export default function ClassesSection() {
  return (
    <section className="relative overflow-hidden bg-[#f7f9fb] py-16 sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-[#fdc425]/10 blur-[90px]"
      />

      <div className="relative mx-auto w-full max-w-[1280px] px-4 sm:px-8 lg:px-16">
        <Reveal className="mb-10 text-center sm:mb-14">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#785a00]">Classes</p>
          <h2 className="mb-3 text-[26px] font-bold text-[#081534] sm:text-[30px] lg:text-[34px]">Grow with us</h2>
          <p className="mx-auto max-w-xl text-[14px] leading-6 text-[#45464e] sm:text-[16px]">
            Three classes to take you from joining the family to leading it. Each one builds on the one before.
          </p>
        </Reveal>

        <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:gap-4">
          {classes.map((c, i) => (
            <div key={c.title} className="contents">
              <Reveal delay={i * 0.08} className="h-full">
                <Link
                  href="/classes#path"
                  className="group flex h-full flex-col rounded-3xl border border-[#d9dbe0] bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-[#fdc425] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-[#081534] sm:p-8"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex rounded-full bg-[#fdc425]/25 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#785a00]">
                      Step {i + 1}
                    </span>
                    <span className="text-[11px] font-semibold text-[#76777f]">{c.tag}</span>
                  </div>

                  <div className="mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#081534] text-[#fdc425] transition-colors group-hover:bg-[#fdc425] group-hover:text-[#6d5200]">
                    <Icon name={c.icon} className="text-[26px]" />
                  </div>

                  <h3 className="mt-5 text-[20px] font-bold leading-snug text-[#081534]">{c.title}</h3>
                  <p className="mt-2 text-[14px] leading-6 text-[#45464e]">{c.desc}</p>

                  <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-[13px] font-bold text-[#081534]">
                    View intakes
                    <Icon name="arrow_forward" className="text-[16px] transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>

              {i < classes.length - 1 && (
                <div aria-hidden className="flex items-center justify-center text-[#785a00]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d9dbe0] bg-white shadow-sm">
                    <Icon name="arrow_downward" className="text-[18px] md:hidden" />
                    <Icon name="arrow_forward" className="hidden text-[18px] md:block" />
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:mt-12 sm:flex-row sm:gap-5">
          <Link
            href="/classes"
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#081534] px-8 text-[14px] font-bold text-white transition hover:bg-[#17305f] active:scale-95"
          >
            See classes and register
            <Icon name="arrow_forward" className="text-[18px]" />
          </Link>
          <Link
            href="/contact"
            className="text-[13px] font-semibold text-[#785a00] underline-offset-4 hover:underline"
          >
            Questions? Get in touch
          </Link>
        </div>
      </div>
    </section>
  )
}