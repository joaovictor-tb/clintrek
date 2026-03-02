"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  hexColorSchema,
  validateLogoFile,
} from "@/lib/validations/organization";

const EXTENSION_MAP: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/svg+xml": "svg",
};

export async function updateOrganizationBranding(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Nao autenticado" };
  }

  const orgId = session.session.activeOrganizationId;

  if (!orgId) {
    return { error: "Nenhuma organizacao selecionada" };
  }

  const logo = formData.get("logo") as File | null;
  const primaryColor = formData.get("primaryColor") as string | null;
  const accentColor = formData.get("accentColor") as string | null;

  // Validate colors if provided
  if (primaryColor && primaryColor.trim() !== "") {
    const result = hexColorSchema.safeParse(primaryColor);
    if (!result.success) {
      return { error: "Cor primaria invalida. Use o formato #RRGGBB" };
    }
  }

  if (accentColor && accentColor.trim() !== "") {
    const result = hexColorSchema.safeParse(accentColor);
    if (!result.success) {
      return { error: "Cor secundaria invalida. Use o formato #RRGGBB" };
    }
  }

  // Prepare update data
  const updateData: {
    logo?: string | null;
    primaryColor?: string | null;
    accentColor?: string | null;
  } = {};

  // Handle logo upload
  if (logo instanceof File && logo.size > 0) {
    const validation = validateLogoFile(logo);
    if (!validation.success) {
      return { error: validation.error };
    }

    const extension = EXTENSION_MAP[logo.type];
    if (!extension) {
      return { error: "Tipo de arquivo nao suportado" };
    }

    // Read current org to check for existing logo
    const currentOrg = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { logo: true },
    });

    // Create upload directory
    const uploadDir = path.join(
      process.cwd(),
      "data",
      "uploads",
      "organizations",
      orgId,
    );
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename and write file
    const filename = `logo-${crypto.randomUUID()}.${extension}`;
    const filepath = path.join(uploadDir, filename);
    const buffer = Buffer.from(await logo.arrayBuffer());
    await writeFile(filepath, buffer);

    // Delete old logo file if it exists
    if (currentOrg?.logo) {
      try {
        const oldFilePath = path.join(
          process.cwd(),
          "data",
          currentOrg.logo,
        );
        await unlink(oldFilePath);
      } catch {
        // Old file may not exist, ignore error
      }
    }

    updateData.logo = `/uploads/organizations/${orgId}/${filename}`;
  }

  // Handle colors: empty string resets to null
  updateData.primaryColor =
    primaryColor && primaryColor.trim() !== "" ? primaryColor.trim() : null;
  updateData.accentColor =
    accentColor && accentColor.trim() !== "" ? accentColor.trim() : null;

  // Update organization in database
  await prisma.organization.update({
    where: { id: orgId },
    data: updateData,
  });

  revalidatePath("/dashboard");
  revalidatePath("/settings/organization");

  return { success: true };
}

export async function setupOrganizationBranding(
  orgId: string,
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Nao autenticado" };
  }

  const logo = formData.get("logo") as File | null;
  const primaryColor = formData.get("primaryColor") as string | null;
  const accentColor = formData.get("accentColor") as string | null;

  if (primaryColor && primaryColor.trim() !== "") {
    const result = hexColorSchema.safeParse(primaryColor);
    if (!result.success) {
      return { error: "Cor primaria invalida. Use o formato #RRGGBB" };
    }
  }

  if (accentColor && accentColor.trim() !== "") {
    const result = hexColorSchema.safeParse(accentColor);
    if (!result.success) {
      return { error: "Cor secundaria invalida. Use o formato #RRGGBB" };
    }
  }

  const updateData: {
    logo?: string | null;
    primaryColor?: string | null;
    accentColor?: string | null;
  } = {};

  if (logo instanceof File && logo.size > 0) {
    const validation = validateLogoFile(logo);
    if (!validation.success) {
      return { error: validation.error };
    }

    const extension = EXTENSION_MAP[logo.type];
    if (!extension) {
      return { error: "Tipo de arquivo nao suportado" };
    }

    const uploadDir = path.join(
      process.cwd(),
      "data",
      "uploads",
      "organizations",
      orgId,
    );
    await mkdir(uploadDir, { recursive: true });

    const filename = `logo-${crypto.randomUUID()}.${extension}`;
    const filepath = path.join(uploadDir, filename);
    const buffer = Buffer.from(await logo.arrayBuffer());
    await writeFile(filepath, buffer);

    updateData.logo = `/uploads/organizations/${orgId}/${filename}`;
  }

  updateData.primaryColor =
    primaryColor && primaryColor.trim() !== "" ? primaryColor.trim() : null;
  updateData.accentColor =
    accentColor && accentColor.trim() !== "" ? accentColor.trim() : null;

  const hasUpdates =
    updateData.logo || updateData.primaryColor || updateData.accentColor;

  if (hasUpdates) {
    await prisma.organization.update({
      where: { id: orgId },
      data: updateData,
    });
  }

  return { success: true };
}
