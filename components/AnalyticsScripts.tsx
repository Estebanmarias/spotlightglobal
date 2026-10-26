'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { GoogleAnalytics } from '@next/third-parties/google'
import { CONSENT_EVENT, readConsent } from '@/lib/consent'

const GA_ID = 'G-0RJHPQC0DY'
const CLARITY_ID = 'xiwzwawz8y'
const BREVO_CHAT_ID = '6a1d629d2814d1e2cd06573c'

export default function AnalyticsScripts() {
  const pathname = usePathname()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const sync = () => setAllowed(readConsent()?.analytics === true)
    sync()
    window.addEventListener(CONSENT_EVENT, sync)
    return () => window.removeEventListener(CONSENT_EVENT, sync)
  }, [])

  if (!allowed) return null

  const showChat = !pathname?.startsWith('/admin')

  return (
    <>
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

      {showChat && (
        <Script id="brevo-conversations" strategy="afterInteractive">
          {`
            (function(d, w, c) {
              w.BrevoConversationsID = '${BREVO_CHAT_ID}';
              w[c] = w[c] || function() {
                (w[c].q = w[c].q || []).push(arguments);
              };
              var s = d.createElement('script');
              s.async = true;
              s.src = 'https://conversations-widget.brevo.com/brevo-conversations.js';
              if (d.head) d.head.appendChild(s);
            })(document, window, 'BrevoConversations');
          `}
        </Script>
      )}
    </>
  )
}