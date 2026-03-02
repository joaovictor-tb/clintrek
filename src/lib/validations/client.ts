import { z } from "zod/v4";

export const clientSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(255, "Nome deve ter no máximo 255 caracteres"),
  email: z.email("Email inválido"),
  phone: z
    .string()
    .max(20, "Telefone deve ter no máximo 20 caracteres")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(5000, "Observações devem ter no máximo 5000 caracteres")
    .optional()
    .or(z.literal("")),
});

export const portalLoginSchema = z.object({
  email: z.email("Email inválido"),
  orgSlug: z.string().min(1),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
export type PortalLoginValues = z.infer<typeof portalLoginSchema>;
