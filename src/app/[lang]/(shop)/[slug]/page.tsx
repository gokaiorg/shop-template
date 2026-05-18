import React from "react";
import { adminDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import parse from "html-react-parser";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

// ⚡ Bolt: Deduplicate Firebase Admin queries using React.cache()
// Reduces database reads by 50% since Next.js doesn't auto-dedupe non-fetch DB calls
// called in both generateMetadata and the page component.
const getPage = React.cache(async (slug: string) => {
  const doc = await adminDb.collection("pages").doc(slug).get();
  if (!doc.exists) return null;
  return doc.data();
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const page = await getPage(slug);

  if (!page) return {};

  return {
    title: lang === "fr" ? page.meta_title_fr : page.meta_title_en,
    description: lang === "fr" ? page.meta_description_fr : page.meta_description_en,
  };
}

import { ContactForm } from "@/components/forms/ContactForm";

export default async function DynamicPage({ params }: PageProps) {
  const { lang, slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    notFound();
  }

  const title = lang === "fr" ? page.title_fr : page.title_en;
  const content = lang === "fr" ? page.content_fr : page.content_en;

  // Check if this is the contact page (handling both localized and default slugs)
  const isContactPage = slug === "contact" || page.slug_fr === "contact" || page.slug_en === "contact";

  return (
    <main className="flex-1 bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-7xl mx-auto py-16 px-6 md:px-16">
        <h1 className="text-4xl font-bold mb-8">{title}</h1>
        <article className="prose prose-zinc dark:prose-invert max-w-none">
          {parse(content)}
        </article>
        
        {isContactPage && (
          <div className="mt-12">
            <ContactForm />
          </div>
        )}
      </div>
    </main>
  );
}
