import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { Plus } from "lucide-react";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientTable } from "@/components/features/clients/client-table";
import { ClientSearch } from "@/components/features/clients/client-search";
import { Pagination } from "@/components/features/clients/pagination";

const PAGE_SIZE = 20;

interface ClientsPageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

async function ClientsContent({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/signin");
  }

  const organizationId = session.session.activeOrganizationId;

  if (!organizationId) {
    redirect("/onboarding/organization");
  }

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const search = params.search?.trim() ?? "";

  const where = {
    organizationId,
    deletedAt: null,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        invitationStatus: true,
        createdAt: true,
      },
    }),
    prisma.client.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Novo cliente
          </Link>
        </Button>
      </div>

      <ClientSearch />

      <ClientTable clients={clients} />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        searchQuery={search || undefined}
      />
    </div>
  );
}

function ClientsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-9 w-full max-w-sm" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function ClientsPage({ searchParams }: ClientsPageProps) {
  return (
    <Suspense fallback={<ClientsLoading />}>
      <ClientsContent searchParams={searchParams} />
    </Suspense>
  );
}
