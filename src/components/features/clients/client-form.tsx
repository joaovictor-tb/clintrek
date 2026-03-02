"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { clientSchema, type ClientFormValues } from "@/lib/validations/client";
import { phoneMask, phoneUnmask } from "@/lib/masks/phone";
import { createClient, updateClient } from "@/actions/clients";
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

interface ClientFormProps {
  mode: "create" | "edit";
  defaultValues?: ClientFormValues;
  clientId?: string;
}

export function ClientForm({ mode, defaultValues, clientId }: ClientFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: defaultValues ?? {
      name: "",
      email: "",
      phone: "",
      notes: "",
    },
  });

  async function onSubmit(values: ClientFormValues) {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("name", values.name);
    formData.set("email", values.email);
    formData.set("phone", values.phone ?? "");
    formData.set("notes", values.notes ?? "");

    try {
      if (mode === "create") {
        const result = await createClient(formData);

        if ("error" in result) {
          toast.error(result.error);
          setIsSubmitting(false);
          return;
        }

        router.push("/clients");
      } else {
        if (!clientId) {
          toast.error("ID do cliente nao encontrado");
          setIsSubmitting(false);
          return;
        }

        const result = await updateClient(clientId, formData);

        if ("error" in result) {
          toast.error(result.error);
          setIsSubmitting(false);
          return;
        }

        router.push(`/clients/${clientId}`);
      }
    } catch {
      toast.error("Erro inesperado. Tente novamente.");
      setIsSubmitting(false);
    }
  }

  const cancelHref = mode === "edit" && clientId ? `/clients/${clientId}` : "/clients";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome do cliente" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@exemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input
                  placeholder="(00) 00000-0000"
                  value={phoneMask(field.value ?? "")}
                  onChange={(e) => field.onChange(phoneUnmask(e.target.value))}
                  maxLength={15}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observacoes</FormLabel>
              <FormControl>
                <textarea
                  placeholder="Observacoes sobre o cliente..."
                  className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 min-h-[80px] resize-y"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {mode === "create" ? "Criar cliente" : "Salvar alteracoes"}
          </Button>
          <Button variant="outline" asChild>
            <Link href={cancelHref}>Cancelar</Link>
          </Button>
        </div>
      </form>
    </Form>
  );
}
