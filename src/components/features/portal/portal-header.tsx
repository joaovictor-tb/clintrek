import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface PortalHeaderProps {
  orgName: string;
  orgLogo: string | null;
  orgSlug: string;
}

export function PortalHeader({ orgName, orgLogo, orgSlug }: PortalHeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b bg-background px-4 py-3">
      <div className="flex items-center gap-3">
        {orgLogo ? (
          <img
            src={`/api${orgLogo}`}
            alt={`Logo de ${orgName}`}
            className="h-8 w-auto object-contain"
          />
        ) : (
          <span className="text-lg font-semibold">{orgName}</span>
        )}
      </div>

      <form action={`/api/portal/logout`} method="POST">
        <input type="hidden" name="orgSlug" value={orgSlug} />
        <Button type="submit" variant="ghost" size="sm">
          <LogOut className="size-4" aria-hidden="true" />
          Sair
        </Button>
      </form>
    </header>
  );
}
