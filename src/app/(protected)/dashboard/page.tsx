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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Clock,
  UserCheck,
  CalendarPlus,
  Plus,
  ArrowRight,
  Settings,
} from "lucide-react";

const statusMap: Record<
  string,
  { label: string; variant: "outline" | "secondary" | "default" }
> = {
  none: { label: "Nao convidado", variant: "outline" },
  pending: { label: "Pendente", variant: "secondary" },
  accepted: { label: "Aceito", variant: "default" },
};

async function DashboardContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/signin");
  }

  const orgId = session.session.activeOrganizationId;

  const [org, clientCount, pendingCount, acceptedCount, thisMonthCount, recentClients] =
    await Promise.all([
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
      orgId
        ? prisma.client.count({
            where: {
              organizationId: orgId,
              deletedAt: null,
              invitationStatus: "pending",
            },
          })
        : 0,
      orgId
        ? prisma.client.count({
            where: {
              organizationId: orgId,
              deletedAt: null,
              invitationStatus: "accepted",
            },
          })
        : 0,
      orgId
        ? prisma.client.count({
            where: {
              organizationId: orgId,
              deletedAt: null,
              createdAt: {
                gte: new Date(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  1
                ),
              },
            },
          })
        : 0,
      orgId
        ? prisma.client.findMany({
            where: { organizationId: orgId, deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true,
              name: true,
              email: true,
              invitationStatus: true,
              createdAt: true,
            },
          })
        : [],
    ]);

  const orgName = org?.name ?? "ClinTrek";

  const stats = [
    {
      title: "Total de Clientes",
      value: clientCount,
      description: "Clientes cadastrados",
      icon: Users,
    },
    {
      title: "Convites Pendentes",
      value: pendingCount,
      description: "Aguardando aceitacao",
      icon: Clock,
    },
    {
      title: "Convites Aceitos",
      value: acceptedCount,
      description: "Clientes que aceitaram",
      icon: UserCheck,
    },
    {
      title: "Clientes este mes",
      value: thisMonthCount,
      description: "Novos cadastros no mes",
      icon: CalendarPlus,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Bem-vindo ao {orgName}
          </h1>
          <p className="text-muted-foreground">
            Aqui esta um resumo da sua organizacao.
          </p>
        </div>
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>{stat.title}</CardDescription>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Clientes Recentes</CardTitle>
            <CardDescription>
              Ultimos 5 clientes cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentClients.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum cliente cadastrado ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {recentClients.map((client) => {
                  const status =
                    statusMap[client.invitationStatus] ?? statusMap.none;
                  return (
                    <Link
                      key={client.id}
                      href={`/clients/${client.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {client.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {client.email}
                        </p>
                      </div>
                      <Badge variant={status.variant} className="ml-3 shrink-0">
                        {status.label}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acoes Rapidas</CardTitle>
            <CardDescription>Atalhos para tarefas comuns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/clients/new">
                <Plus className="mr-2 h-4 w-4" />
                Criar cliente
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/clients">
                <ArrowRight className="mr-2 h-4 w-4" />
                Ver todos os clientes
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/settings/organization">
                <Settings className="mr-2 h-4 w-4" />
                Configuracoes
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Carregando painel">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded bg-muted" />
          <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-9 w-32 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border bg-muted"
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 h-64 animate-pulse rounded-xl border bg-muted" />
        <div className="h-64 animate-pulse rounded-xl border bg-muted" />
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
