"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const portalLoginSchema = z.object({
  email: z.email("Email invalido"),
});

type PortalLoginValues = z.infer<typeof portalLoginSchema>;

interface PortalLoginFormProps {
  orgSlug: string;
  error?: string | null;
}

const errorMessages: Record<string, string> = {
  expired: "Seu link expirou. Tente entrar novamente.",
  invalid: "Link invalido. Tente entrar novamente.",
  unavailable: "Acesso indisponivel. Entre em contato com a clinica.",
};

export function PortalLoginForm({ orgSlug, error }: PortalLoginFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<PortalLoginValues>({
    resolver: zodResolver(portalLoginSchema),
    defaultValues: { email: "" },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: PortalLoginValues) {
    setSubmitError(null);

    try {
      const response = await fetch("/api/portal/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email, orgSlug }),
      });

      if (!response.ok) {
        setSubmitError("Ocorreu um erro. Tente novamente.");
        return;
      }

      setSubmitted(true);
    } catch {
      setSubmitError("Ocorreu um erro. Tente novamente.");
    }
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent>
          <div className="flex flex-col items-center gap-3 py-4 text-center" role="status">
            <Mail className="h-10 w-10 text-primary" aria-hidden="true" />
            <p className="text-lg font-medium">Verifique seu email</p>
            <p className="text-sm text-muted-foreground">
              Se este email estiver cadastrado, enviamos um link de acesso.
              Ele expira em 15 minutos.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Acessar o portal</CardTitle>
      </CardHeader>
      <CardContent>
        {error && errorMessages[error] && (
          <p
            className="mb-4 text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            {errorMessages[error]}
          </p>
        )}

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

            {submitError && (
              <p
                className="text-sm text-destructive"
                role="alert"
                aria-live="polite"
              >
                {submitError}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              Entrar com email
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
