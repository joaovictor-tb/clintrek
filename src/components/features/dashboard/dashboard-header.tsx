"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const routeMap: Record<string, { label: string; href: string }> = {
  "/dashboard": { label: "Dashboard", href: "/dashboard" },
  "/clients": { label: "Clientes", href: "/clients" },
  "/clients/new": { label: "Novo Cliente", href: "/clients/new" },
  "/settings/organization": {
    label: "Configuracoes",
    href: "/settings/organization",
  },
};

function isDynamicSegment(segment: string) {
  return /^[a-z0-9]{20,}$/i.test(segment) || /^[0-9a-f-]{36}$/i.test(segment);
}

interface Crumb {
  href: string;
  label: string;
}

function buildBreadcrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < segments.length; i++) {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const segment = segments[i];

    if (isDynamicSegment(segment)) {
      crumbs.push({ href, label: "Detalhes" });
      continue;
    }

    if (segment === "edit") {
      crumbs.push({ href, label: "Editar" });
      continue;
    }

    const route = routeMap[href];
    if (route && !seen.has(route.href)) {
      seen.add(route.href);
      crumbs.push({ href: route.href, label: route.label });
    }
    // skip segments without a route (e.g. "/settings" alone)
  }

  return crumbs;
}

export function DashboardHeader() {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4!" />
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <span key={crumb.href} className="contents">
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.href}>
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
