"use client";

import { Loader2 } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateOrganizationBranding } from "@/actions/organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OrgSettingsFormProps {
  currentLogo?: string | null;
  currentPrimaryColor?: string | null;
  currentAccentColor?: string | null;
}

export function OrgSettingsForm({
  currentLogo,
  currentPrimaryColor,
  currentAccentColor,
}: OrgSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState(
    currentPrimaryColor ?? "#7c3aed",
  );
  const [accentColor, setAccentColor] = useState(
    currentAccentColor ?? "#ede9fe",
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    } else {
      setLogoPreview(null);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData();

    const fileInput = fileInputRef.current;
    if (fileInput?.files?.[0]) {
      formData.append("logo", fileInput.files[0]);
    }

    formData.append("primaryColor", primaryColor);
    formData.append("accentColor", accentColor);

    startTransition(async () => {
      const result = await updateOrganizationBranding(formData);

      if ("success" in result) {
        toast.success("Branding atualizado com sucesso");
        // Clear the file input after successful upload
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setLogoPreview(null);
      } else {
        toast.error(result.error);
      }
    });
  }

  const displayLogo =
    logoPreview ?? (currentLogo ? `/api${currentLogo}` : null);

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Formulario de branding da organizacao"
      className="space-y-8"
    >
      {/* Logo Upload */}
      <div className="space-y-3">
        <Label htmlFor="logo">Logo da Organização</Label>
        {displayLogo && (
          <div className="mb-3">
            <img
              src={displayLogo}
              alt="Logo da organização"
              className="h-20 w-20 rounded-lg border object-contain"
            />
          </div>
        )}
        <Input
          id="logo"
          name="logo"
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          ref={fileInputRef}
          onChange={handleLogoChange}
          aria-describedby="logo-hint"
        />
        <p id="logo-hint" className="text-sm text-muted-foreground">
          PNG, JPG ou SVG. Tamanho maximo: 2MB.
        </p>
      </div>

      {/* Primary Color */}
      <div className="space-y-3">
        <Label htmlFor="primaryColor">Cor Primaria</Label>
        <div className="flex items-center gap-3">
          <input
            id="primaryColor"
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="h-10 w-12 cursor-pointer rounded border p-1"
            aria-label="Seletor de cor primaria"
          />
          <Input
            type="text"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            placeholder="#7c3aed"
            className="max-w-40"
            aria-label="Valor hexadecimal da cor primaria"
          />
        </div>
      </div>

      {/* Accent Color */}
      <div className="space-y-3">
        <Label htmlFor="accentColor">Cor Secundaria</Label>
        <div className="flex items-center gap-3">
          <input
            id="accentColor"
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="h-10 w-12 cursor-pointer rounded border p-1"
            aria-label="Seletor de cor secundaria"
          />
          <Input
            type="text"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            placeholder="#ede9fe"
            className="max-w-40"
            aria-label="Valor hexadecimal da cor secundaria"
          />
        </div>
      </div>

      {/* Submit */}
      <Button type="submit" disabled={isPending} aria-busy={isPending}>
        {isPending && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        Salvar Branding
      </Button>
    </form>
  );
}
