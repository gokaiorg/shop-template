import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "404",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function NotFound() {
  const headersList = await headers();
  const headerLocale = headersList.get("x-locale");
  const pathname = headersList.get("x-pathname") || "";

  let locale = headerLocale || "en";
  if (!headerLocale && pathname) {
    const firstSegment = pathname.split("/").filter(Boolean)[0];
    if (firstSegment === "fr" || firstSegment === "en") {
      locale = firstSegment;
    }
  }

  const isFr = locale === "fr";
  const homeHref = locale ? `/${locale}` : "/";

  return (
    <section aria-labelledby="error-404-heading" className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16">
      {/* Visual 404 Display */}
      <div className="relative flex items-center justify-center mb-2 select-none pointer-events-none">
        <span className="text-7xl sm:text-8xl md:text-9xl font-extrabold tracking-tighter text-primary">
          404
        </span>
      </div>

      {/* Main Error Heading */}
      <h1 id="error-404-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">
        {isFr ? "Page introuvable" : "Page not found"}
      </h1>

      {/* Descriptive Paragraph */}
      <p className="max-w-md text-base sm:text-lg text-muted-foreground mb-8 leading-relaxed">
        {isFr
          ? "Désolé, la page que vous recherchez n'existe pas, a été déplacée ou est temporairement indisponible."
          : "Sorry, the page you are looking for does not exist, has been removed, or is temporarily unavailable."}
      </p>

      {/* Return to Homepage CTA */}
      <Button asChild size="lg" className="rounded-full px-8 shadow-xs cursor-pointer group">
        <Link href={homeHref}>
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>{isFr ? "Retour à l'accueil" : "Back to home"}</span>
        </Link>
      </Button>
    </section>
  );
}
