import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";

export function HeroSection() {
  return (
    <section className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
        ClinTrek
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground sm:text-xl">
        Gerencie sua clinica de forma simples e eficiente. Organize pacientes,
        agendamentos e equipe em um so lugar.
      </p>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/signup">
            <UserPlus className="mr-2 h-5 w-5" />
            Cadastrar
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/signin">
            <LogIn className="mr-2 h-5 w-5" />
            Entrar
          </Link>
        </Button>
      </div>
    </section>
  );
}
