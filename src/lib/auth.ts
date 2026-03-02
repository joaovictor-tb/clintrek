import sgMail from "@sendgrid/mail";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins/magic-link";
import { organization } from "better-auth/plugins/organization";
import prisma from "@/lib/prisma";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  session: {
    expiresIn: 604800,
  },
  plugins: [
    nextCookies(),
    magicLink({
      expiresIn: 900,
      sendMagicLink: async ({ email, url }) => {
        await sgMail.send({
          to: email,
          from: process.env.EMAIL_FROM!,
          subject: "Entrar no ClinTrek",
          html: `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;max-width:480px;width:100%">
<tr><td style="padding:32px 32px 0;text-align:center">
<h1 style="margin:0;font-size:24px;font-weight:700;color:#18181b">ClinTrek</h1>
</td></tr>
<tr><td style="padding:24px 32px;text-align:center">
<p style="margin:0 0 24px;font-size:16px;line-height:1.5;color:#3f3f46">
Clique no botao abaixo para acessar sua conta. Este link expira em <strong>15 minutos</strong>.
</p>
<a href="${url}" style="display:inline-block;padding:12px 32px;background-color:#7c3aed;color:#ffffff;text-decoration:none;border-radius:6px;font-size:16px;font-weight:600">
Entrar no ClinTrek
</a>
<p style="margin:24px 0 0;font-size:13px;color:#71717a;line-height:1.5">
Se o botao nao funcionar, copie e cole este link no navegador:<br>
<a href="${url}" style="color:#7c3aed;word-break:break-all">${url}</a>
</p>
</td></tr>
<tr><td style="padding:24px 32px;border-top:1px solid #e4e4e7;text-align:center">
<p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.5">
Se voce nao solicitou este email, ignore-o com seguranca.<br>
ClinTrek - Gestao de clinicas simplificada
</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`,
        });
      },
    }),
    organization({
      allowUserToCreateOrganization: true,
      creatorRole: "owner",
    }),
  ],
});
