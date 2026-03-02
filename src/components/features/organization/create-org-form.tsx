"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { organizationNameSchema, type OrgFormValues } from "@/lib/validations/auth";
import { authClient } from "@/lib/auth-client";
import { setupOrganizationBranding } from "@/actions/organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

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
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#7c3aed");
  const [accentColor, setAccentColor] = useState("#ede9fe");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<OrgFormValues>({
    resolver: zodResolver(organizationNameSchema),
    defaultValues: { name: "" },
  });

  const isLoading = form.formState.isSubmitting;

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setLogoPreview(null);
    }
  }

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

    // Upload branding if provided
    const hasLogo = fileInputRef.current?.files?.[0];
    const hasColors =
      primaryColor !== "#7c3aed" || accentColor !== "#ede9fe";

    if (hasLogo || hasColors) {
      const formData = new FormData();
      if (hasLogo) {
        formData.append("logo", fileInputRef.current!.files![0]);
      }
      formData.append("primaryColor", primaryColor);
      formData.append("accentColor", accentColor);

      await setupOrganizationBranding(data.id, formData);
    }

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

        <div className="space-y-2">
          <Label htmlFor="onboard-logo">Logo</Label>
          {logoPreview && (
            <img
              src={logoPreview}
              alt="Preview do logo"
              className="h-16 w-16 rounded border object-contain"
            />
          )}
          <Input
            id="onboard-logo"
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            ref={fileInputRef}
            onChange={handleLogoChange}
          />
          <p className="text-xs text-muted-foreground">
            PNG, JPG ou SVG. Max 2MB.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="onboard-primary">Cor primaria</Label>
          <div className="flex items-center gap-2">
            <input
              id="onboard-primary"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-9 w-10 cursor-pointer rounded border p-1"
            />
            <Input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#7c3aed"
              className="max-w-32"
              aria-label="Valor hexadecimal da cor primaria"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="onboard-accent">Cor secundaria</Label>
          <div className="flex items-center gap-2">
            <input
              id="onboard-accent"
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="h-9 w-10 cursor-pointer rounded border p-1"
            />
            <Input
              type="text"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              placeholder="#ede9fe"
              className="max-w-32"
              aria-label="Valor hexadecimal da cor secundaria"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert" aria-live="polite">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={isLoading} aria-busy={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
          Criar organizacao
        </Button>
      </form>
    </Form>
  );
}
