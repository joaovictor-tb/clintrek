import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getClientSessionCookie, getClientSession } from "@/lib/client-auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

async function PortalHome({ orgSlug }: { orgSlug: string }) {
  const token = await getClientSessionCookie();
  if (!token) redirect(`/portal/${orgSlug}/login`);

  const session = await getClientSession(token);
  if (!session) redirect(`/portal/${orgSlug}/login`);

  const { client, organization } = session;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center">
          Bem-vindo(a), {client.name}!
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Seus dados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-medium">{client.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">E-mail</p>
              <p className="font-medium">{client.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Organização</p>
              <p className="font-medium">{organization.name}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PortalHomeSkeleton() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4" role="status" aria-label="Carregando portal">
      <div className="w-full max-w-md space-y-6">
        <Skeleton className="mx-auto h-8 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-48" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-36" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default async function PortalPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  return (
    <Suspense fallback={<PortalHomeSkeleton />}>
      <PortalHome orgSlug={orgSlug} />
    </Suspense>
  );
}
