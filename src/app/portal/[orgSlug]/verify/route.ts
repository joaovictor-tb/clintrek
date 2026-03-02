import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  createClientSession,
  setClientSessionCookie,
} from "@/lib/client-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  const { orgSlug } = await params;
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL(`/portal/${orgSlug}/login?error=invalid`, request.url),
    );
  }

  // Look up invitation by token, including client and organization
  const invitation = await prisma.clientInvitation.findUnique({
    where: { token },
    include: { client: true, organization: true },
  });

  if (!invitation) {
    return NextResponse.redirect(
      new URL(`/portal/${orgSlug}/login?error=invalid`, request.url),
    );
  }

  // Invitation must be pending
  if (invitation.status !== "pending") {
    return NextResponse.redirect(
      new URL(`/portal/${orgSlug}/login?error=invalid`, request.url),
    );
  }

  // Check if invitation has expired
  if (invitation.expiresAt < new Date()) {
    return NextResponse.redirect(
      new URL(`/portal/${orgSlug}/login?error=expired`, request.url),
    );
  }

  // Check if client is soft-deleted
  if (invitation.client.deletedAt) {
    return NextResponse.redirect(
      new URL(`/portal/${orgSlug}/login?error=unavailable`, request.url),
    );
  }

  // Mark invitation as accepted
  await prisma.clientInvitation.update({
    where: { id: invitation.id },
    data: { status: "accepted", acceptedAt: new Date() },
  });

  // Update client invitationStatus to accepted
  await prisma.client.update({
    where: { id: invitation.clientId },
    data: { invitationStatus: "accepted" },
  });

  // Create client session and set cookie
  const sessionToken = await createClientSession(
    invitation.clientId,
    invitation.organizationId,
  );
  await setClientSessionCookie(sessionToken);

  // Redirect to the portal dashboard
  return NextResponse.redirect(
    new URL(`/portal/${orgSlug}`, request.url),
  );
}
