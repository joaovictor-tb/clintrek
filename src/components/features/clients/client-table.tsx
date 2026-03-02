import Link from "next/link";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ClientTableProps {
  clients: Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    invitationStatus: string;
    createdAt: Date;
  }>;
}

const statusMap: Record<
  string,
  { label: string; variant: "outline" | "secondary" | "default" }
> = {
  none: { label: "Nao convidado", variant: "outline" },
  pending: { label: "Pendente", variant: "secondary" },
  accepted: { label: "Aceito", variant: "default" },
};

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
              <TableCell>{client.phone ?? "-"}</TableCell>
              <TableCell>
                <Badge variant={status.variant}>{status.label}</Badge>
              </TableCell>
              <TableCell>
                {client.createdAt.toLocaleDateString("pt-BR")}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
