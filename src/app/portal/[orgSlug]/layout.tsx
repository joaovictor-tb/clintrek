import { notFound } from "next/navigation";
import { BrandingProvider } from "@/components/features/organization/branding-provider";
import { PortalHeader } from "@/components/features/portal/portal-header";
import prisma from "@/lib/prisma";

interface PortalLayoutProps {
  params: Promise<{ orgSlug: string }>;
  children: React.ReactNode;
}

export default async function PortalLayout({
  params,
  children,
}: PortalLayoutProps) {
  const { orgSlug } = await params;

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: {
      name: true,
      slug: true,
      logo: true,
      primaryColor: true,
      accentColor: true,
    },
  });

  if (!org) {
    notFound();
  }

  return (
    <BrandingProvider primaryColor={org.primaryColor} accentColor={org.accentColor}>
      <div className="min-h-screen bg-background">
        <PortalHeader orgName={org.name} orgLogo={org.logo} orgSlug={org.slug} />
        <main className="mx-auto max-w-4xl px-4 py-8">
          {children}
        </main>
      </div>
    </BrandingProvider>
  );
}
