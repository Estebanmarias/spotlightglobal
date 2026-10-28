"use client";

import { usePathname } from "next/navigation";
import { MotionConfig } from "framer-motion";
import Navbar from "./Navbar";
import Footer from "./Footer";
import FeaturedEventPromo from "./FeaturedEventPromo";
import FaqChat from "./FaqChat";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
  }

  return (
    <MotionConfig reducedMotion="user">
      <Navbar />
      <FeaturedEventPromo />
      <div className="flex-grow">{children}</div>
      <Footer />
      {!pathname.startsWith("/conference") && <FaqChat />}
     </MotionConfig>
  );
}
