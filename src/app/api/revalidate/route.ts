import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const secret =
      searchParams.get("secret") ||
      req.headers.get("x-revalidation-secret") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    const expectedSecret = process.env.REVALIDATION_SECRET;

    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid or missing revalidation secret" },
        { status: 401 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      paths?: unknown;
      path?: unknown;
    };
    let paths: string[] = [];

    if (Array.isArray(body.paths)) {
      paths = body.paths.filter(
        (p): p is string => typeof p === "string" && p.trim().length > 0
      );
    } else if (typeof body.path === "string" && body.path.trim().length > 0) {
      paths = [body.path.trim()];
    }

    if (paths.length === 0) {
      return NextResponse.json(
        {
          message:
            "Bad Request: No valid paths provided (expected 'path' string or 'paths' array)",
        },
        { status: 400 }
      );
    }

    revalidateTag("store-settings", { expire: 0 });
    revalidateTag("categories", { expire: 0 });
    revalidateTag("products", { expire: 0 });
    revalidateTag("pages", { expire: 0 });
    revalidateTag("google-reviews", { expire: 0 });

    for (const path of paths) {
      try {
        revalidatePath(path, "layout");
      } catch (err) {
        console.error(`Error revalidating path "${path}":`, err);
      }
    }

    return NextResponse.json({
      revalidated: true,
      paths,
      count: paths.length,
      mode: "layout",
      now: Date.now(),
    });
  } catch (error: unknown) {
    console.error("REVALIDATION_ROUTE_ERROR:", error);
    return NextResponse.json(
      {
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const secret =
      searchParams.get("secret") ||
      req.headers.get("x-revalidation-secret") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    const expectedSecret = process.env.REVALIDATION_SECRET;

    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid or missing revalidation secret" },
        { status: 401 }
      );
    }

    const path = searchParams.get("path");
    const rawPaths = searchParams.get("paths");

    let paths: string[] = [];
    if (rawPaths) {
      paths = rawPaths
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
    } else if (path) {
      paths = [path.trim()];
    }

    if (paths.length === 0) {
      return NextResponse.json(
        { message: "Bad Request: 'path' or 'paths' query parameter required" },
        { status: 400 }
      );
    }

    revalidateTag("store-settings", { expire: 0 });
    revalidateTag("categories", { expire: 0 });
    revalidateTag("products", { expire: 0 });
    revalidateTag("pages", { expire: 0 });
    revalidateTag("google-reviews", { expire: 0 });

    for (const p of paths) {
      try {
        revalidatePath(p, "layout");
      } catch (err) {
        console.error(`Error revalidating path "${p}":`, err);
      }
    }

    return NextResponse.json({
      revalidated: true,
      paths,
      count: paths.length,
      mode: "layout",
      now: Date.now(),
    });
  } catch (error: unknown) {
    console.error("REVALIDATION_ROUTE_ERROR:", error);
    return NextResponse.json(
      {
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
