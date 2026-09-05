import { notFound } from "next/navigation";
import parse from "html-react-parser";
import { Metadata } from "next";
import { getPageBySlug } from "@/lib/services/pages";
import { getLocalizedField } from "@/lib/i18n";
import { ContactForm } from "@/components/forms/ContactForm";

interface PageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page || page.status === "draft") return {};

  const title = getLocalizedField(page.title, lang) || (lang === "fr" ? page.title_fr : page.title_en) || page.slug;
  const description = getLocalizedField(page.content, lang)
    ?.replace(/<[^>]*>?/gm, "")
    .slice(0, 160) || "";

  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const baseUrl = rawBaseUrl.replace(/\/+$/, "");
  const canonicalUrl = `${baseUrl}/${lang}/pages/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function PublicSlugPage({ params }: PageProps) {
  const { lang, slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page || page.status === "draft") {
    notFound();
  }

  const title = getLocalizedField(page.title, lang) || (lang === "fr" ? page.title_fr : page.title_en) || page.slug;
  const content = getLocalizedField(page.content, lang) || (lang === "fr" ? page.content_fr : page.content_en) || "";

  const isContactPage = slug === "contact" || page.slug === "contact";

  return (
    <main className="flex-1 bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-7xl mx-auto py-16 px-6 md:px-16">
        <h1 className="text-4xl font-bold tracking-tight mb-8">{title}</h1>
        <article className="prose prose-zinc dark:prose-invert max-w-none">
          {parse(content || "<p></p>")}
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
