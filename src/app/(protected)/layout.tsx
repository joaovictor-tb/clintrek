import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BrandingProvider } from "@/components/features/organization/branding-provider";
import { AppSidebar } from "@/components/features/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/features/dashboard/dashboard-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function ProtectedContent({ children }: { children: React.ReactNode }) {
  const reqHeaders = await headers();

  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session) {
    redirect("/signin");
  }

  const pathname = reqHeaders.get("x-pathname") ?? "";
  const isOnboarding = pathname.startsWith("/onboarding");

  if (!isOnboarding && !session.session.activeOrganizationId) {
    const memberCount = await prisma.member.count({
      where: { userId: session.user.id },
    });

    if (memberCount === 0) {
      redirect("/onboarding/organization");
    }
  }

  const org = session.session.activeOrganizationId
    ? await prisma.organization.findUnique({
        where: { id: session.session.activeOrganizationId },
        select: {
          name: true,
          slug: true,
          logo: true,
          primaryColor: true,
          accentColor: true,
        },
      })
    : null;

  // Onboarding renders without sidebar (fullscreen centered)
  if (isOnboarding) {
    return (
      <BrandingProvider
        primaryColor={org?.primaryColor}
        accentColor={org?.accentColor}
      >
        <div className="min-h-screen bg-background">{children}</div>
      </BrandingProvider>
    );
  }

  return (
    <BrandingProvider
      primaryColor={org?.primaryColor}
      accentColor={org?.accentColor}
    >
      <SidebarProvider>
        <AppSidebar
          org={org ? { name: org.name, logo: org.logo } : null}
          user={{
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          }}
        />
        <div className="flex min-h-screen flex-1 flex-col">
          <DashboardHeader />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </SidebarProvider>
    </BrandingProvider>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <ProtectedContent>{children}</ProtectedContent>
    </Suspense>
  );
}
