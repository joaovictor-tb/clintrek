import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientForm } from "@/components/features/clients/client-form";

interface EditClientPageProps {
  params: Promise<{ id: string }>;
}

async function EditClientContent({
  params,
}: {
  params: Promise<{ id: string }>;
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

  const { id } = await params;

  const client = await prisma.client.findFirst({
    where: {
      id,
      organizationId,
      deletedAt: null,
    },
  });

  if (!client) {
    redirect("/clients");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/clients/${client.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editar Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm
            mode="edit"
            clientId={client.id}
            defaultValues={{
              name: client.name,
              email: client.email,
              phone: client.phone ?? "",
              notes: client.notes ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function EditClientLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Skeleton className="mb-6 h-8 w-24" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}

export default function EditClientPage({ params }: EditClientPageProps) {
  return (
    <Suspense fallback={<EditClientLoading />}>
      <EditClientContent params={params} />
    </Suspense>
  );
}
