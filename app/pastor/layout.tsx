import type { Metadata } from "next";

const description =
  "Meet Apostle Edet Kingsley, Lead Pastor of theSpotlightChurch, and explore his ministry, teachings, and live prayer.";

export const metadata: Metadata = {
  title: "Apostle Edet Kingsley",
  description,
  openGraph: {
    title: "Apostle Edet Kingsley | Lead Pastor",
    description,
    url: "/pastor",
    siteName: "theSpotlightChurch",
    images: [
      {
        url: "/pastor-og-v2.png",
        width: 1200,
        height: 630,
        alt: "Apostle Edet Kingsley, Lead Pastor of theSpotlightChurch",
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Apostle Edet Kingsley | Lead Pastor",
    description,
    images: ["/pastor-og-v2.png"],
  },
};

export default function PastorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
