"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { type EmailFormValues, emailSchema } from "@/lib/validations/auth";

interface MagicLinkFormProps {
  mode: "signup" | "signin";
}

export function MagicLinkForm({ mode }: MagicLinkFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const isLoading = form.formState.isSubmitting;

  async function onSubmit(values: EmailFormValues) {
    setError(null);

    const { error: authError } = await authClient.signIn.magicLink({
      email: values.email,
      callbackURL: "/dashboard",
      newUserCallbackURL: "/onboarding/organization",
    });

    if (authError) {
      if (authError.status === 429) {
        setError(
          "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
        );
      } else {
        setError("Ocorreu um erro. Tente novamente.");
      }
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <Mail className="h-10 w-10 text-primary" />
        <p className="text-lg font-medium">
          Verifique seu email para o link de acesso
        </p>
        <p className="text-sm text-muted-foreground">
          Enviamos um link para o email informado. Ele expira em 15 minutos.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && (
          <p
            className="text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "signup" ? "Criar conta" : "Entrar"}
        </Button>
      </form>
    </Form>
  );
}
