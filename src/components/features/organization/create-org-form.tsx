"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { organizationNameSchema, type OrgFormValues } from "@/lib/validations/auth";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CreateOrgForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<OrgFormValues>({
    resolver: zodResolver(organizationNameSchema),
    defaultValues: { name: "" },
  });

  const isLoading = form.formState.isSubmitting;

  async function onSubmit(values: OrgFormValues) {
    setError(null);

    const slug = generateSlug(values.name);

    const { data, error: createError } =
      await authClient.organization.create({
        name: values.name,
        slug,
      });

    if (createError || !data) {
      setError("Erro ao criar organizacao. Tente novamente.");
      return;
    }

    await authClient.organization.setActive({
      organizationId: data.id,
    });

    router.push("/dashboard");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da organizacao</FormLabel>
              <FormControl>
                <Input placeholder="Minha Clinica" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && (
          <p className="text-sm text-destructive" role="alert" aria-live="polite">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar organizacao
        </Button>
      </form>
    </Form>
  );
}
