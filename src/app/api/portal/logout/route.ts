import { NextRequest, NextResponse } from "next/server";
import { deleteClientSession } from "@/lib/client-auth";

const COOKIE_NAME = "clintrek-client-session";

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
  // Delete session from DB if cookie exists
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (token) {
    await deleteClientSession(token);
  }

  // Determine orgSlug for redirect
  let orgSlug: string | null = null;

  // Try from referer header
  const referer = request.headers.get("referer");
  if (referer) {
    orgSlug = extractOrgSlugFromUrl(referer);
  }

  // Fallback: try from form body (HTML form sends urlencoded, not JSON)
  if (!orgSlug) {
    try {
      const formData = await request.formData();
      const value = formData.get("orgSlug");
      if (typeof value === "string" && value) {
        orgSlug = value;
      }
    } catch {
      // Body empty or not parseable — ignore
    }
  }

  const redirectUrl = orgSlug
    ? new URL(`/portal/${orgSlug}/login`, request.url)
    : new URL("/", request.url);

  // 303 See Other — browser follows with GET
  const response = NextResponse.redirect(redirectUrl, 303);

  // Clear the cookie on the response itself
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/portal",
    maxAge: 0,
  });

  return response;
}
