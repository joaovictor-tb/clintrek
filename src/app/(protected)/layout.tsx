import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignOutButton } from "@/components/features/auth/sign-out-button";
import { BrandingProvider } from "@/components/features/organization/branding-provider";
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

  return (
    <BrandingProvider
      primaryColor={org?.primaryColor}
      accentColor={org?.accentColor}
    >
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-2">
                {org?.logo ? (
                  <img
                    src={`/api${org.logo}`}
                    alt={org.name}
                    className="h-8 w-auto object-contain"
                  />
                ) : (
                  <span className="text-lg font-semibold">
                    {org?.name ?? "ClinTrek"}
                  </span>
                )}
              </Link>

              <nav
                className="hidden items-center gap-4 sm:flex"
                aria-label="Navegacao principal"
              >
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Dashboard
                </Link>
                <Link
                  href="/clients"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Clientes
                </Link>
                <Link
                  href="/settings/organization"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Configurações
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {session.user.email}
              </span>
              <SignOutButton />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
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
