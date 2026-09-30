"use client";

import { useAdminAccess } from "@/lib/use-admin-permissions";

export default function NewBlogPostPage() {
  const access = useAdminAccess("blog");

  if (access.loading) {
    return <div className="p-8 text-[#45464e]">Loading editor...</div>;
  }

  if (!access.canAccess("blog")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] p-6 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-6xl rounded-3xl border border-[#c6c6cf] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#fdc425]">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[#081534]">
          New Devotional
        </h1>
        <p className="mt-3 text-[#45464e]">
          The Tiptap editor and form scaffolding will go here.
        </p>
      </div>
    </div>
  );
}
