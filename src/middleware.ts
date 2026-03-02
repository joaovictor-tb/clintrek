import { type NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const COOKIE_NAME = "clintrek-client-session";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Portal routes: check client session cookie
  if (pathname.startsWith("/portal/")) {
    // Extract orgSlug from path: /portal/[orgSlug]/...
    const segments = pathname.split("/");
    const orgSlug = segments[2];

    // Allow login and verify pages without auth
    const subPath = segments.slice(3).join("/");
    if (subPath === "login" || subPath === "verify") {
      return NextResponse.next();
    }

    // Check client session cookie
    const clientSession = request.cookies.get(COOKIE_NAME)?.value;
    if (!clientSession) {
      return NextResponse.redirect(
        new URL(`/portal/${orgSlug}/login`, request.url),
      );
    }

    return NextResponse.next();
  }

  // Protected admin routes: check Better Auth session
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }
  const response = NextResponse.next();
  response.headers.set("x-pathname", request.nextUrl.pathname);
  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/clients/:path*",
    "/settings/:path*",
    "/portal/:path*",
  ],
};
