import { cache } from "react";
import { unstable_cache } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { getActiveBrandKey } from "@/config/brand.config";
import { Page } from "@/types/database";

interface TimestampLike {
  toDate?: () => Date;
  _seconds?: number;
}

function getCacheScopeKey(): string {
  const brandKey = getActiveBrandKey();
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "default";
  const dbId =
    process.env.FIREBASE_DATABASE_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID ||
    "default";
  return `${brandKey}:${projectId}:${dbId}`;
}

function serializePageTimestamp(ts: unknown): string | undefined {
  if (!ts) return undefined;
  if (typeof ts === "string") return ts;
  if (ts instanceof Date) {
    return isNaN(ts.getTime()) ? undefined : ts.toISOString();
  }
  if (typeof ts === "object") {
    const candidate = ts as TimestampLike;
    if (typeof candidate.toDate === "function") {
      const converted = candidate.toDate();
      return isNaN(converted.getTime()) ? undefined : converted.toISOString();
    }
    if (typeof candidate._seconds === "number") {
      const converted = new Date(candidate._seconds * 1000);
      return isNaN(converted.getTime()) ? undefined : converted.toISOString();
    }
  }
  return undefined;
}

export function formatPageDoc(doc: FirebaseFirestore.DocumentSnapshot): Page {
  const data = doc.data() || {};

  let title: Record<string, string> = {};
  if (data.title && typeof data.title === "object") {
    title = data.title as Record<string, string>;
  } else {
    if (data.title_en) title.en = String(data.title_en);
    if (data.title_fr) title.fr = String(data.title_fr);
  }

  let content: Record<string, string> = {};
  if (data.content && typeof data.content === "object") {
    content = data.content as Record<string, string>;
  } else {
    if (data.content_en) content.en = String(data.content_en);
    if (data.content_fr) content.fr = String(data.content_fr);
  }

  let subtitle: Record<string, string> = {};
  if (data.subtitle && typeof data.subtitle === "object") {
    subtitle = data.subtitle as Record<string, string>;
  } else {
    if (data.subtitle_en) subtitle.en = String(data.subtitle_en);
    if (data.subtitle_fr) subtitle.fr = String(data.subtitle_fr);
  }

  let slug: Record<string, string> = {};
  if (data.slug && typeof data.slug === "object") {
    slug = { ...(data.slug as Record<string, string>) };
  } else if (typeof data.slug === "string" && data.slug.trim()) {
    slug = { en: data.slug, fr: data.slug };
  } else {
    const fallback = doc.id;
    slug = { en: fallback, fr: fallback };
  }
  if (data.slug_en && !slug.en) slug.en = String(data.slug_en);
  if (data.slug_fr && !slug.fr) slug.fr = String(data.slug_fr);

  const status =
    data.status === "draft" || data.status === "published"
      ? data.status
      : "published";
  const imageUrl =
    data.imageUrl ||
    data.image_url ||
    data.coverImageUrl ||
    data.banner_image ||
    null;

  return {
    id: doc.id,
    slug,
    title,
    subtitle,
    content,
    status,
    showInHeader: Boolean(data.showInHeader),
    showInFooter: Boolean(data.showInFooter),
    order: typeof data.order === "number" ? data.order : 0,
    activeBlocks: Array.isArray(data.activeBlocks) ? data.activeBlocks : [],
    imageUrl,
    image_url: imageUrl,
    coverImageUrl: imageUrl,
    banner_image: imageUrl,
    metaTitle: data.metaTitle,
    metaDescription: data.metaDescription,
    slug_en: data.slug_en || slug.en,
    slug_fr: data.slug_fr || slug.fr,
    title_en: data.title_en || title.en,
    title_fr: data.title_fr || title.fr,
    subtitle_en: data.subtitle_en || subtitle.en,
    subtitle_fr: data.subtitle_fr || subtitle.fr,
    content_en: data.content_en || content.en,
    content_fr: data.content_fr || content.fr,
    meta_title_en: data.meta_title_en,
    meta_title_fr: data.meta_title_fr,
    meta_description_en: data.meta_description_en,
    meta_description_fr: data.meta_description_fr,
    createdAt: serializePageTimestamp(data.createdAt),
    updatedAt: serializePageTimestamp(data.updatedAt),
  };
}

async function fetchPublishedPagesFromFirestore(
  _scopeKey: string
): Promise<Page[]> {
  void _scopeKey;
  try {
    const snapshot = await adminDb
      .collection("pages")
      .where("status", "==", "published")
      .get();

    return snapshot.docs
      .map(formatPageDoc)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch (error) {
    console.error("[GET_PUBLISHED_PAGES_ERROR]", error);
    return [];
  }
}

async function fetchPageBySlugFromFirestore(
  _scopeKey: string,
  slug: string
): Promise<Page | null> {
  if (!slug) return null;

  try {
    const docRef = adminDb.collection("pages").doc(slug);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return formatPageDoc(docSnap);
    }

    const [enSnap, frSnap, querySnap, legacyFrSnap, legacyEnSnap] =
      await Promise.all([
        adminDb.collection("pages").where("slug.en", "==", slug).limit(1).get(),
        adminDb.collection("pages").where("slug.fr", "==", slug).limit(1).get(),
        adminDb.collection("pages").where("slug", "==", slug).limit(1).get(),
        adminDb.collection("pages").where("slug_fr", "==", slug).limit(1).get(),
        adminDb.collection("pages").where("slug_en", "==", slug).limit(1).get(),
      ]);

    const matchedSnap = [enSnap, frSnap, querySnap, legacyFrSnap, legacyEnSnap].find(
      (s) => !s.empty
    );
    if (matchedSnap) {
      return formatPageDoc(matchedSnap.docs[0]);
    }

    const allPages = await adminDb.collection("pages").get();
    for (const d of allPages.docs) {
      const dData = d.data();
      if (dData.slug && typeof dData.slug === "object") {
        if (Object.values(dData.slug).includes(slug)) {
          return formatPageDoc(d);
        }
      }
    }
  } catch (error) {
    console.error("[GET_PAGE_BY_SLUG_ERROR]", error);
  }

  return null;
}

const getCachedPublishedPages = unstable_cache(
  fetchPublishedPagesFromFirestore,
  ["published-pages"],
  {
    revalidate: 300,
    tags: ["pages"],
  }
);

const getCachedPageBySlug = unstable_cache(
  fetchPageBySlugFromFirestore,
  ["page-by-slug"],
  {
    revalidate: 300,
    tags: ["pages"],
  }
);

export const getPublishedPages = cache(async (): Promise<Page[]> => {
  return getCachedPublishedPages(getCacheScopeKey());
});

export const getPageBySlug = cache(
  async (slug: string): Promise<Page | null> => {
    if (!slug) return null;
    return getCachedPageBySlug(getCacheScopeKey(), slug);
  }
);
