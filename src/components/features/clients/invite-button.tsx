"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { inviteClient } from "@/actions/clients";
import { Button } from "@/components/ui/button";

interface InviteButtonProps {
  clientId: string;
}

export function InviteButton({ clientId }: InviteButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleInvite() {
    setPending(true);

    try {
      const result = await inviteClient(clientId);

      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Convite enviado com sucesso!");
      }
    } catch {
      toast.error("Erro ao enviar convite. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleInvite}
      disabled={pending}
    >
      <Send className="mr-2 h-4 w-4" aria-hidden="true" />
      {pending ? "Enviando..." : "Convidar para o portal"}
    </Button>
  );
}
