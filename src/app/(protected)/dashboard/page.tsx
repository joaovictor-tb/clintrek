import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Settings } from "lucide-react";

async function DashboardContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/signin");
  }

  const orgId = session.session.activeOrganizationId;

  const [org, clientCount] = await Promise.all([
    orgId
      ? prisma.organization.findUnique({
          where: { id: orgId },
          select: { name: true },
        })
      : null,
    orgId
      ? prisma.client.count({
          where: { organizationId: orgId, deletedAt: null },
        })
      : 0,
  ]);

  const orgName = org?.name ?? "ClinTrek";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bem-vindo ao {orgName}
        </h1>
        <p className="text-muted-foreground">
          Aqui esta um resumo da sua organizacao.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total de Clientes</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {clientCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Clientes cadastrados na organizacao
            </p>
          </CardContent>
        </Card>

        <Link href="/clients" className="group">
          <Card className="h-full transition-shadow group-hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <CardTitle>Gerenciar Clientes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Visualize, adicione e gerencie os clientes da sua organizacao.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings/organization" className="group">
          <Card className="h-full transition-shadow group-hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <CardTitle>Configurações</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ajuste as configuracoes da organizacao, branding e membros.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8" role="status" aria-label="Carregando painel">
      <div className="space-y-2">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-xl border bg-muted"
          />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
