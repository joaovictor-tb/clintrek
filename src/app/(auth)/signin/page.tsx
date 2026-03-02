import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MagicLinkForm } from "@/components/features/auth/magic-link-form";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Entrar</CardTitle>
          <CardDescription>
            Informe seu email e enviaremos um link de acesso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MagicLinkForm mode="signin" />
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Nao tem conta?{" "}
            <Link href="/signup" className="text-primary underline">
              Cadastrar
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
