import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignOutButton } from "@/components/features/auth/sign-out-button";

async function DashboardContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/signin");
  }

  const orgName =
    (session.session as Record<string, unknown>).activeOrganizationId
      ? "Organizacao ativa"
      : "Sem organizacao";

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold">ClinTrek</h1>
            <p className="text-sm text-muted-foreground">{orgName}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session.user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo ao ClinTrek</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Seu painel de controle esta pronto. Em breve voce podera gerenciar
              pacientes, agendamentos e muito mais.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
