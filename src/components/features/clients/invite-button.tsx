"use client";

import { useState } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InviteDialog } from "@/components/features/clients/invite-dialog";

interface InviteButtonProps {
  clientId: string;
  clientName: string;
}

export function InviteButton({ clientId, clientName }: InviteButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Send className="mr-2 h-4 w-4" aria-hidden="true" />
        Convidar para o portal
      </Button>
      <InviteDialog
        clientId={clientId}
        clientName={clientName}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
