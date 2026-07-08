import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";
import ChurchStructuredData from "@/components/ChurchStructuredData";
import { GoogleAnalytics } from '@next/third-parties/google'
import Script from 'next/script'

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://spotlightglobal.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  verification: {
    google: 'zdQt_AVg-C3k0O7iBpkEL5b-cZ11tSRzQx8xf8cEAgE',
  },
  title: {
    default: "theSpotlightChurch | Welcome Home",
    template: "%s | theSpotlightChurch",
  },
  description: "THIS IS CHURCH - the best place to be.",
  keywords: ["church in Abuja", "theSpotlightChurch", "FCT church", "Sunday service Abuja", "Christian community Abuja", "church events Abuja", "churches in mararaba", "spiritual growth Abuja", "worship services Abuja", "Christian fellowship Abuja", "church in Karu"],
  openGraph: {
    title: "theSpotlightChurch | Welcome Home",
    description: "THIS IS CHURCH - the best place to be.",
    url: baseUrl,
    siteName: "theSpotlightChurch",
    images: [{ url: `${baseUrl}/og-image.jpg`, width: 1200, height: 630 }],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "theSpotlightChurch | Welcome Home",
    description: "THIS IS CHURCH - the best place to be.",
    images: [`${baseUrl}/og-image.jpg`],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${jakarta.variable} font-sans bg-[#f7f9fb] text-[#191c1e] flex flex-col min-h-screen`}
      >
        <ChurchStructuredData />
        <LayoutWrapper>{children}</LayoutWrapper>
        <GoogleAnalytics gaId="G-0RJHPQC0DY" />
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "xiwzwawz8y");
          `}
        </Script>
      </body>
    </html>
  );
}