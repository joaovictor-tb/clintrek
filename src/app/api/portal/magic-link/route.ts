import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import prisma from "@/lib/prisma";
import { portalLoginSchema } from "@/lib/validations/client";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = portalLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: true });
    }

    const { email, orgSlug } = parsed.data;

    // Look up organization by slug
    const org = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        primaryColor: true,
      },
    });

    if (!org) {
      return NextResponse.json({ success: true });
    }

    // Look up active client by email + organization
    const client = await prisma.client.findFirst({
      where: {
        organizationId: org.id,
        email,
        deletedAt: null,
      },
    });

    if (!client) {
      return NextResponse.json({ success: true });
    }

    // Rate limiting: max 3 invitations per hour per client
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.clientInvitation.count({
      where: { clientId: client.id, createdAt: { gte: oneHourAgo } },
    });

    if (recentCount >= 3) {
      return NextResponse.json({ success: true });
    }

    // Create invitation with 15-minute expiry
    const token = crypto.randomUUID();
    await prisma.clientInvitation.create({
      data: {
        clientId: client.id,
        organizationId: org.id,
        token,
        status: "pending",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    // Build branded email
    const primaryColor = org.primaryColor || "#7c3aed";
    const magicLink = `${process.env.NEXT_PUBLIC_APP_URL}/portal/${org.slug}/verify?token=${token}`;

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
          Clique no botao abaixo para acessar o portal da ${org.name}.
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
        subject: `Acesso ao portal - ${org.name}`,
        html: emailHtml,
      });
    } catch (error) {
      console.error("Erro ao enviar email de acesso ao portal:", error);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
