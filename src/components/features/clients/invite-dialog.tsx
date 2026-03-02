"use client";

import { useState, useCallback, useEffect } from "react";
import { Check, Copy, Loader2, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { generateInviteLink, sendInviteEmail } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InviteDialogProps {
  clientId: string;
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteDialog({
  clientId,
  clientName,
  open,
  onOpenChange,
}: InviteDialogProps) {
  const [link, setLink] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchLink = useCallback(
    async (forceNew: boolean) => {
      setIsGenerating(true);
      setLink(null);
      setCopied(false);

      try {
        const result = await generateInviteLink(clientId, { forceNew });
        if ("error" in result) {
          toast.error(result.error);
          onOpenChange(false);
        } else {
          setLink(result.link);
        }
      } catch {
        toast.error("Erro ao gerar link. Tente novamente.");
        onOpenChange(false);
      } finally {
        setIsGenerating(false);
      }
    },
    [clientId, onOpenChange],
  );

  useEffect(() => {
    if (open) {
      fetchLink(false);
    } else {
      setLink(null);
      setCopied(false);
    }
  }, [open, fetchLink]);

  async function handleCopy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar. Tente manualmente.");
    }
  }

  async function handleSendEmail() {
    setIsSendingEmail(true);
    try {
      const result = await sendInviteEmail(clientId);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Convite enviado por email!");
        onOpenChange(false);
      }
    } catch {
      toast.error("Erro ao enviar email. Tente novamente.");
    } finally {
      setIsSendingEmail(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar {clientName}</DialogTitle>
          <DialogDescription>
            Compartilhe o link abaixo com o cliente para que ele acesse o portal.
            O link expira em 15 minutos.
          </DialogDescription>
        </DialogHeader>

        {isGenerating ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-9 shrink-0" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-9 w-36" />
            </div>
          </div>
        ) : link ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input value={link} readOnly className="text-sm" />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="sr-only">Copiar link</span>
              </Button>
            </div>

            <DialogFooter className="sm:justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchLink(true)}
                disabled={isGenerating}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Gerar novo link
              </Button>

              <Button
                variant="outline"
                onClick={handleSendEmail}
                disabled={isSendingEmail}
              >
                {isSendingEmail ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Enviar por email
              </Button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
