import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteClientDialog } from "@/components/features/clients/delete-client-dialog";
import { InviteButton } from "@/components/features/clients/invite-button";

const statusMap: Record<
  string,
  { label: string; variant: "outline" | "secondary" | "default" }
> = {
  none: { label: "Nao convidado", variant: "outline" },
  pending: { label: "Pendente", variant: "secondary" },
  accepted: { label: "Aceito", variant: "default" },
};

interface ClientDetailPageProps {
  params: Promise<{ id: string }>;
}

async function ClientDetailContent({
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

  const lastInvitation = await prisma.clientInvitation.findFirst({
    where: { clientId: client.id },
    orderBy: { createdAt: "desc" },
  });

  const status = statusMap[client.invitationStatus] ?? statusMap.none;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/clients">
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Voltar
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{client.name}</CardTitle>
            <div className="flex items-center gap-2">
              <InviteButton clientId={client.id} clientName={client.name} />
              <Button variant="outline" size="sm" asChild>
                <Link href={`/clients/${client.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                  Editar
                </Link>
              </Button>
              <DeleteClientDialog
                clientId={client.id}
                clientName={client.name}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Email
              </dt>
              <dd className="mt-1 text-sm">{client.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Telefone
              </dt>
              <dd className="mt-1 text-sm">{client.phone ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Status do convite
              </dt>
              <dd className="mt-1">
                <Badge variant={status.variant}>{status.label}</Badge>
                {lastInvitation && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ultimo convite:{" "}
                    {lastInvitation.createdAt.toLocaleDateString("pt-BR")}
                  </p>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Criado em
              </dt>
              <dd className="mt-1 text-sm">
                {client.createdAt.toLocaleDateString("pt-BR")}
              </dd>
            </div>
            {client.notes && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-muted-foreground">
                  Observacoes
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm">
                  {client.notes}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

function ClientDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6" role="status" aria-label="Carregando detalhes do cliente">
      <Skeleton className="h-8 w-24" />
      <div className="space-y-4 rounded-lg border p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function ClientDetailPage({ params }: ClientDetailPageProps) {
  return (
    <Suspense fallback={<ClientDetailLoading />}>
      <ClientDetailContent params={params} />
    </Suspense>
  );
}
