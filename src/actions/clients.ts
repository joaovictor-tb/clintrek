"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import sgMail from "@sendgrid/mail";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { clientSchema } from "@/lib/validations/client";
import { Prisma } from "@/generated/prisma/client";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function createClient(
  formData: FormData,
): Promise<{ success: true; clientId: string } | { error: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Nao autenticado" };
  }

  const organizationId = session.session.activeOrganizationId;

  if (!organizationId) {
    return { error: "Nenhuma organizacao selecionada" };
  }

  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: (formData.get("phone") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
  };

  const parsed = clientSchema.safeParse(raw);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Dados invalidos";
    return { error: firstError };
  }

  const { name, email, phone, notes } = parsed.data;

  // Check email uniqueness among active clients in this org
  const existing = await prisma.client.findFirst({
    where: {
      organizationId,
      email,
      deletedAt: null,
    },
  });

  if (existing) {
    return { error: "Ja existe um cliente com este email nesta organizacao" };
  }

  try {
    const client = await prisma.client.create({
      data: {
        organizationId,
        name,
        email,
        phone: phone || null,
        notes: notes || null,
      },
    });

    revalidatePath("/clients");
    return { success: true, clientId: client.id };
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { error: "Ja existe um cliente com este email nesta organizacao" };
    }
    return { error: "Erro ao criar cliente. Tente novamente." };
  }
}

export async function updateClient(
  clientId: string,
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Nao autenticado" };
  }

  const organizationId = session.session.activeOrganizationId;

  if (!organizationId) {
    return { error: "Nenhuma organizacao selecionada" };
  }

  // Verify ownership
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      organizationId,
      deletedAt: null,
    },
  });

  if (!client) {
    return { error: "Cliente nao encontrado" };
  }

  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: (formData.get("phone") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
  };

  const parsed = clientSchema.safeParse(raw);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Dados invalidos";
    return { error: firstError };
  }

  const { name, email, phone, notes } = parsed.data;

  // Check email uniqueness if email changed (exclude current client)
  if (email !== client.email) {
    const existing = await prisma.client.findFirst({
      where: {
        organizationId,
        email,
        deletedAt: null,
        id: { not: clientId },
      },
    });

    if (existing) {
      return { error: "Ja existe um cliente com este email nesta organizacao" };
    }
  }

  try {
    await prisma.client.update({
      where: { id: clientId },
      data: {
        name,
        email,
        phone: phone || null,
        notes: notes || null,
      },
    });

    revalidatePath("/clients");
    revalidatePath(`/clients/${clientId}`);
    return { success: true };
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { error: "Ja existe um cliente com este email nesta organizacao" };
    }
    return { error: "Erro ao atualizar cliente. Tente novamente." };
  }
}

export async function deleteClient(
  clientId: string,
): Promise<{ success: true } | { error: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Nao autenticado" };
  }

  const organizationId = session.session.activeOrganizationId;

  if (!organizationId) {
    return { error: "Nenhuma organizacao selecionada" };
  }

  // Verify ownership
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      organizationId,
      deletedAt: null,
    },
  });

  if (!client) {
    return { error: "Cliente nao encontrado" };
  }

  try {
    // Soft delete the client
    await prisma.client.update({
      where: { id: clientId },
      data: { deletedAt: new Date() },
    });

    // Delete all client sessions for this client
    await prisma.clientSession.deleteMany({
      where: { clientId },
    });

    revalidatePath("/clients");
    return { success: true };
  } catch {
    return { error: "Erro ao remover cliente. Tente novamente." };
  }
}

export async function inviteClient(
  clientId: string,
): Promise<{ success: true } | { error: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Nao autenticado" };
  }

  const organizationId = session.session.activeOrganizationId;

  if (!organizationId) {
    return { error: "Nenhuma organizacao selecionada" };
  }

  // Verify ownership and that client is not soft-deleted
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      organizationId,
      deletedAt: null,
    },
  });

  if (!client) {
    return { error: "Cliente nao encontrado" };
  }

  // Invalidate existing pending invitations for this client
  await prisma.clientInvitation.updateMany({
    where: {
      clientId,
      status: "pending",
    },
    data: {
      status: "expired",
    },
  });

  // Create new invitation with 15-minute expiry
  const invitation = await prisma.clientInvitation.create({
    data: {
      clientId,
      organizationId,
      token: crypto.randomUUID(),
      status: "pending",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  // Load organization data for branded email
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true, slug: true, logo: true, primaryColor: true },
  });

  if (!org) {
    return { error: "Organizacao nao encontrada" };
  }

  const primaryColor = org.primaryColor || "#7c3aed";
  const magicLink = `${process.env.NEXT_PUBLIC_APP_URL}/portal/${org.slug}/verify?token=${invitation.token}`;

  const logoHtml = org.logo
    ? `<img src="${process.env.NEXT_PUBLIC_APP_URL}/api${org.logo}" alt="${org.name}" style="max-height:48px;margin-bottom:16px;" />`
    : "";

  const emailHtml = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
      <div style="text-align:center;margin-bottom:24px;">
        ${logoHtml}
        <h1 style="color:${primaryColor};font-size:20px;margin:0;">${org.name}</h1>
      </div>
      <p style="font-size:16px;color:#333;line-height:1.5;">
        Voce foi convidado(a) para o portal da ${org.name}. Clique no botao abaixo para acessar.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${magicLink}" style="background-color:${primaryColor};color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:16px;display:inline-block;">
          Acessar o Portal
        </a>
      </div>
      <p style="font-size:13px;color:#888;text-align:center;">
        Este link expira em 15 minutos.
      </p>
    </div>
  `;

  try {
    await sgMail.send({
      to: client.email,
      from: process.env.EMAIL_FROM!,
      subject: `Convite para o portal - ${org.name}`,
      html: emailHtml,
    });
  } catch {
    return { error: "Erro ao enviar convite. Tente novamente." };
  }

  // Update client invitation status
  await prisma.client.update({
    where: { id: clientId },
    data: { invitationStatus: "pending" },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);

  return { success: true };
}
