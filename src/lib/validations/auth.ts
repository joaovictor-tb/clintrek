import { z } from "zod/v4";

export const emailSchema = z.object({
  email: z.email("Email invalido"),
});

export const organizationNameSchema = z.object({
  name: z.string().min(1, "Nome e obrigatorio"),
});

export type EmailFormValues = z.infer<typeof emailSchema>;
export type OrgFormValues = z.infer<typeof organizationNameSchema>;
