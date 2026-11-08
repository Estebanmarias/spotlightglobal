'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google'
import { CONSENT_EVENT, readConsent } from '@/lib/consent'

const GA_ID = 'G-0RJHPQC0DY'
const GTM_ID = 'GTM-5FLMSZZ4'
const CLARITY_ID = 'xiwzwawz8y'
const BREVO_CLIENT_KEY = 'wp6s9vw0l457f3kbyrrt0q7w'

export default function AnalyticsScripts() {
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const sync = () => setAllowed(readConsent()?.analytics === true)
    sync()
    window.addEventListener(CONSENT_EVENT, sync)
    return () => window.removeEventListener(CONSENT_EVENT, sync)
  }, [])

  if (!allowed) return null

  return (
    <>
      <GoogleTagManager gtmId={GTM_ID} />
      <GoogleAnalytics gaId={GA_ID} />

      <Script id="microsoft-clarity" strategy="afterInteractive">
        {`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${CLARITY_ID}");
        `}
      </Script>

      {/* Brevo tracker (SDK v2) */}
      <Script
        id="brevo-sdk"
        src="https://cdn.brevo.com/js/sdk-loader.js"
        strategy="afterInteractive"
      />
      <Script id="brevo-init" strategy="afterInteractive">
        {`
          window.Brevo = window.Brevo || [];
          Brevo.push(["init", { client_key: "${BREVO_CLIENT_KEY}" }]);
        `}
      </Script>
    </>
  )
}