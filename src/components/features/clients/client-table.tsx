"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, MoreHorizontal, Pencil, Send, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { deleteClient } from "@/actions/clients";
import { phoneMask } from "@/lib/masks/phone";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { InviteDialog } from "@/components/features/clients/invite-dialog";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  invitationStatus: string;
  createdAt: Date;
}

interface ClientTableProps {
  clients: Client[];
}

const statusMap: Record<
  string,
  { label: string; variant: "outline" | "secondary" | "default" }
> = {
  none: { label: "Nao convidado", variant: "outline" },
  pending: { label: "Pendente", variant: "secondary" },
  accepted: { label: "Aceito", variant: "default" },
};

function ClientRowActions({ client }: { client: Client }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result = await deleteClient(client.id);
      if ("error" in result) {
        toast.error(result.error);
        setIsDeleting(false);
        return;
      }
      toast.success("Cliente removido com sucesso");
      router.refresh();
    } catch {
      toast.error("Erro ao remover cliente. Tente novamente.");
      setIsDeleting(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/clients/${client.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalhes
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/clients/${client.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setInviteOpen(true)}>
            <Send className="mr-2 h-4 w-4" />
            Convidar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remover
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <InviteDialog
        clientId={client.id}
        clientName={client.name}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {client.name}? Esta acao pode ser
              desfeita pelo suporte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function ClientTable({ clients }: ClientTableProps) {
  if (clients.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Nenhum cliente encontrado
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Telefone</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Criado em</TableHead>
          <TableHead className="text-right">Acoes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => {
          const status = statusMap[client.invitationStatus] ?? statusMap.none;
          return (
            <TableRow key={client.id}>
              <TableCell>
                <Link
                  href={`/clients/${client.id}`}
                  className="font-medium hover:underline"
                >
                  {client.name}
                </Link>
              </TableCell>
              <TableCell>{client.email}</TableCell>
              <TableCell>
                {client.phone ? phoneMask(client.phone) : "-"}
              </TableCell>
              <TableCell>
                <Badge variant={status.variant}>{status.label}</Badge>
              </TableCell>
              <TableCell>
                {client.createdAt.toLocaleDateString("pt-BR")}
              </TableCell>
              <TableCell className="text-right">
                <ClientRowActions client={client} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
