import { NextRequest, NextResponse } from "next/server";
import {
  deleteClientSession,
  clearClientSessionCookie,
} from "@/lib/client-auth";

function extractOrgSlugFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/^\/portal\/([^/]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  // Delete session if cookie exists
  const token = request.cookies.get("clintrek-client-session")?.value;
  if (token) {
    await deleteClientSession(token);
    await clearClientSessionCookie();
  }

  // Determine orgSlug for redirect
  let orgSlug: string | null = null;

  // Try from referer header
  const referer = request.headers.get("referer");
  if (referer) {
    orgSlug = extractOrgSlugFromUrl(referer);
  }

  // Fallback: try from request body
  if (!orgSlug) {
    try {
      const body = await request.json();
      if (body?.orgSlug && typeof body.orgSlug === "string") {
        orgSlug = body.orgSlug;
      }
    } catch {
      // Body is not JSON or empty — ignore
    }
  }

  // Final fallback: redirect to root
  if (!orgSlug) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.redirect(
    new URL(`/portal/${orgSlug}/login`, request.url),
  );
}
