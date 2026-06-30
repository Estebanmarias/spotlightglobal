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

// ── Inline Vision teaser ─────────────────────────────────────────────────────
function VisionSection() {
  return (
    <section className="py-16 sm:py-24 bg-[#f7f9fb]">
      <div className="px-4 sm:px-8 lg:px-16 w-full max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center">
        <div>
          <h2 className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold leading-[1.3] sm:leading-[40px] text-[#081534] mb-4 sm:mb-6">
            A Sanctuary for Modern Souls
          </h2>
          <p className="text-[15px] sm:text-[16px] lg:text-[18px] leading-[24px] sm:leading-[26px] lg:leading-[28px] text-[#45464e] mb-6 sm:mb-8">
           We make Christ Known, Manifesting the Character of the Holy Spirit, Helping many find Purpose and through
           God&apos;s lifting Power Fulfilling It.
          </p>
          <div className="flex items-start gap-4">
            <div className="bg-[#1e2a4a] p-3 rounded-lg text-[#fdc425] shrink-0">
              <span className="material-symbols-outlined">location_on</span>
            </div>
            <div>
              <h4 className="text-[18px] sm:text-[22px] lg:text-[24px] font-semibold text-[#081534]">Join us in person</h4>
              <p className="text-[14px] sm:text-[15px] lg:text-[16px] text-[#45464e]">
                Ado Guest house event centre, Ado secretariat junction, Abuja-Keffi road, Karu
                <br />
                Sunday 8:30 AM - 10:30 AM
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-4 sm:space-y-6 mt-8 sm:mt-12">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTuADFGULSK_90YFVDxdiCK2sPyTjqAUnqU08JyaHjwjfSnbJygSolxW9nLDsRd-KHq_d6j_NshbO6LhnTpnfCnOxXsf0o7TuNbYLwB0MgNkwytq1nXsvkHNwjJ5ND7EhffTEy7p-b-Gdah7IpOTKdUr6ITUTQw2mxwtmyU9mQI_wYmlMYMGXg3SMHP1Swf7XfOd2xulznrcN40PfIoQ3OcDkSOcg9KeJPOJTSsFAw44cvVjr0jt_844mwL0Z4CXMgwU0lHGsi3W8"
              alt="Church exterior" className="rounded-lg sm:rounded-xl w-full aspect-[4/5] object-cover shadow-sm" />
            <div className="bg-[#fdc425] p-4 sm:p-6 rounded-lg sm:rounded-xl">
              <h3 className="text-[16px] sm:text-[20px] lg:text-[24px] font-semibold text-[#6d5200] mb-1 sm:mb-2">Our Mission</h3>
              <p className="text-[11px] sm:text-[13px] lg:text-[14px] font-semibold text-[#6d5200] opacity-80 leading-snug">
                Manifesting the Character of the Holy Spirit, Helping many find Purpose and through God&apos;s lifting Power Fulfilling It.
              </p>
            </div>
          </div>
          <div className="space-y-4 sm:space-y-6">
            <img src="/images/gallery/gallery-3.webp"
              alt="Community" className="rounded-lg sm:rounded-xl w-full aspect-[4/5] object-cover shadow-sm" />
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAO2xjXf2xjGElj9c-sSaN8mK2mKDbuXihrEItmDwWrb1VEx5lmSJlBbBalOS6Pvri-qJdtrCcegXcGl4MlJeXqKJpdOqhIMXRRSU2NdTn_45UJ_-QlE_hoRMym7N6yu0HINxmNlHrf6gX7uF8h2TwLgiYc7zSwUSQn92bfXCLfU0dITvvCUQkm5OQEGk2o_iAe3yx3XcGVxwt1OSA35jVP-MaGa_nZAeM2F3AnMfno8SAMJKIG3-LHlUsgZyfFHmA1RqMxK0qKESk"
              alt="Service" className="rounded-lg sm:rounded-xl w-full aspect-square object-cover shadow-sm" />
          </div>
        </div>
      </div>
    </section>
  )
}