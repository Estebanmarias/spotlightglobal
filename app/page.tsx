// import { motion } from 'framer-motion' // server-safe wrapper below
import HeroSection from '@/components/HeroSection'
import MinistriesSection from '@/components/MinistriesSection'
import ConnectSection from '@/components/ConnectSection'

export const metadata = {
  title: 'theSpotlightChurch | Welcome Home',
  description: 'A sanctuary for modern souls. Join our global community.',
}

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <VisionSection />
      <MinistriesSection />
      <ConnectSection />
    </main>
  )
}

// ── Inline Vision teaser ──────────────────────────────────────────────────────
function VisionSection() {
  return (
    <section className="py-24 bg-[#f7f9fb]">
      <div className="px-16 w-full max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-[32px] font-bold leading-[40px] text-[#081534] mb-6">
            A Sanctuary for Modern Souls
          </h2>
          <p className="text-[18px] leading-[28px] text-[#45464e] mb-8">
           We make Christ Known, Manifesting the Character of the Holy Spirit, Helping many find Purpose and through
           God&apos;s lifting Power Fulfilling It.
          </p>
          <div className="flex items-start gap-4">
            <div className="bg-[#1e2a4a] p-3 rounded-lg text-[#fdc425]">
              <span className="material-symbols-outlined">location_on</span>
            </div>
            <div>
              <h4 className="text-[24px] font-semibold text-[#081534]">Join us in person</h4>
              <p className="text-[16px] text-[#45464e]">
                Ado Guest house event centre, Ado secretariat junction, Abuja-Keffi road, Karu
                <br />
                Sunday 8:30 AM - 10:30 AM
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-6 mt-12">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTuADFGULSK_90YFVDxdiCK2sPyTjqAUnqU08JyaHjwjfSnbJygSolxW9nLDsRd-KHq_d6j_NshbO6LhnTpnfCnOxXsf0o7TuNbYLwB0MgNkwytq1nXsvkHNwjJ5ND7EhffTEy7p-b-Gdah7IpOTKdUr6ITUTQw2mxwtmyU9mQI_wYmlMYMGXg3SMHP1Swf7XfOd2xulznrcN40PfIoQ3OcDkSOcg9KeJPOJTSsFAw44cvVjr0jt_844mwL0Z4CXMgwU0lHGsi3W8"
              alt="Church exterior" className="rounded-xl w-full aspect-[4/5] object-cover shadow-sm" />
            <div className="bg-[#fdc425] p-6 rounded-xl">
              <h3 className="text-[24px] font-semibold text-[#6d5200] mb-2">Our Mission</h3>
              <p className="text-[14px] font-semibold text-[#6d5200] opacity-80">
                Manifesting the Character of the Holy Spirit, Helping many find Purpose and through God&apos;s lifting Power Fulfilling It.
              </p>
            </div>
          </div>
          <div className="space-y-6">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3KNp-CVcwhV12KWJdBem1EHXNCFl5nW7AJOWUSr0Hx4viExit3TwNjFBjvwQYerkAH__E4X4VT3wME2NJiQtNQmj9CVDQxakM-OCwVCz-mc0O2EC5eW1k2gquLnn4GKEkMEJIMqstMxOKsb_pIYRTNxZBNzlGMtb8w7fFK8_j1JHPoP-4vgF8MaU6p10tTsbQ0EqeACSSflLmnZAPGAm7jPFrb8J11EI6QHhyDERQi1pJeHu7D9M_2I45-Dh1pNib7CF3EkMMe2k"
              alt="Community" className="rounded-xl w-full aspect-[4/5] object-cover shadow-sm" />
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAO2xjXf2xjGElj9c-sSaN8mK2mKDbuXihrEItmDwWrb1VEx5lmSJlBbBalOS6Pvri-qJdtrCcegXcGl4MlJeXqKJpdOqhIMXRRSU2NdTn_45UJ_-QlE_hoRMym7N6yu0HINxmNlHrf6gX7uF8h2TwLgiYc7zSwUSQn92bfXCLfU0dITvvCUQkm5OQEGk2o_iAe3yx3XcGVxwt1OSA35jVP-MaGa_nZAeM2F3AnMfno8SAMJKIG3-LHlUsgZyfFHmA1RqMxK0qKESk"
              alt="Service" className="rounded-xl w-full aspect-square object-cover shadow-sm" />
          </div>
        </div>
      </div>
    </section>
  )
}