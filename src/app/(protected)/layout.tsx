import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
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

  return <>{children}</>;
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
