import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  searchQuery?: string;
}

function buildHref(page: number, searchQuery?: string): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (searchQuery) {
    params.set("search", searchQuery);
  }
  return `/clients?${params.toString()}`;
}

export function Pagination({
  currentPage,
  totalPages,
  searchQuery,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  // Build page numbers to display
  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <nav aria-label="Paginacao" className="flex items-center justify-center gap-1">
      {currentPage > 1 ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={buildHref(currentPage - 1, searchQuery)}>Anterior</Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Anterior
        </Button>
      )}

      {pages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "outline"}
          size="sm"
          asChild={page !== currentPage}
          disabled={page === currentPage}
          aria-label={`Pagina ${page}`}
          aria-current={page === currentPage ? "page" : undefined}
        >
          {page === currentPage ? (
            <span>{page}</span>
          ) : (
            <Link href={buildHref(page, searchQuery)}>{page}</Link>
          )}
        </Button>
      ))}

      {currentPage < totalPages ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={buildHref(currentPage + 1, searchQuery)}>Proximo</Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Proximo
        </Button>
      )}
    </nav>
  );
}
