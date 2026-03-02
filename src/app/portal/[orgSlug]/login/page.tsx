import { notFound, redirect } from "next/navigation";
import { PortalLoginForm } from "@/components/features/portal/portal-login-form";
import { getClientSessionCookie, getClientSession } from "@/lib/client-auth";
import prisma from "@/lib/prisma";

interface PortalLoginPageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function PortalLoginPage({
  params,
  searchParams,
}: PortalLoginPageProps) {
  const { orgSlug } = await params;
  const { error } = await searchParams;

  // Redirect already-authenticated clients to portal home
  const token = await getClientSessionCookie();
  if (token) {
    const session = await getClientSession(token);
    if (session && session.organization.slug === orgSlug) {
      redirect(`/portal/${orgSlug}`);
    }
  }

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { name: true },
  });

  if (!org) {
    notFound();
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <h1 className="text-2xl font-semibold">{org.name}</h1>
        <PortalLoginForm orgSlug={orgSlug} error={error} />
      </div>
    </div>
  );
}
