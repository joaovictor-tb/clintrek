import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Skeleton } from "@/components/ui/skeleton";
import { OrgSettingsForm } from "@/components/features/organization/org-settings-form";

async function OrganizationSettingsContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/signin");
  }

  const orgId = session.session.activeOrganizationId;

  if (!orgId) {
    redirect("/onboarding");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      logo: true,
      primaryColor: true,
      accentColor: true,
    },
  });

  return (
    <OrgSettingsForm
      currentLogo={organization?.logo}
      currentPrimaryColor={organization?.primaryColor}
      currentAccentColor={organization?.accentColor}
    />
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-8" role="status" aria-label="Carregando configuracoes">
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-20 w-20 rounded-lg" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-12" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-36" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-12" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
      <Skeleton className="h-10 w-36" />
    </div>
  );
}

export default function OrganizationSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">
        Configuracoes da Organizacao
      </h1>
      <Suspense fallback={<SettingsSkeleton />}>
        <OrganizationSettingsContent />
      </Suspense>
    </div>
  );
}
