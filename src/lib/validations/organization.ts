import { z } from "zod/v4";

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_LOGO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/svg+xml",
] as const;

export const hexColorSchema = z
  .string()
  .regex(HEX_COLOR_REGEX, "Cor deve estar no formato hexadecimal (#RRGGBB)");

export const brandingSchema = z.object({
  primaryColor: hexColorSchema.optional(),
  accentColor: hexColorSchema.optional(),
});

export function validateLogoFile(
  file: File,
): { success: true } | { success: false; error: string } {
  if (file.size > MAX_LOGO_SIZE) {
    return { success: false, error: "Logo deve ter no máximo 2MB" };
  }
  if (
    !ALLOWED_LOGO_TYPES.includes(
      file.type as (typeof ALLOWED_LOGO_TYPES)[number],
    )
  ) {
    return {
      success: false,
      error: "Logo deve ser PNG, JPG ou SVG",
    };
  }
  return { success: true };
}

export type BrandingFormValues = z.infer<typeof brandingSchema>;
