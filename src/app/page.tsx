import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { HeroSection } from "@/components/features/landing/hero-section";
import { auth } from "@/lib/auth";

async function LandingContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  return <HeroSection />;
}

export default function Home() {
  return (
    <main>
      <Suspense fallback={null}>
        <LandingContent />
      </Suspense>
    </main>
  );
}
