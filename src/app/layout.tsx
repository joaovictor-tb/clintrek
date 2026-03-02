import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClinTrek",
  description: "Gerencie sua clinica de forma simples e eficiente",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
