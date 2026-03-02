"use client";

import { LayoutDashboard, Settings, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavUser } from "./nav-user";

const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    match: (p: string) => p === "/dashboard",
  },
  {
    title: "Clientes",
    url: "/clients",
    icon: Users,
    match: (p: string) => p === "/clients" || p.startsWith("/clients/"),
  },
  {
    title: "Configuracoes",
    url: "/settings/organization",
    icon: Settings,
    match: (p: string) => p.startsWith("/settings"),
  },
];

interface AppSidebarProps {
  org: {
    name: string;
    logo: string | null;
  } | null;
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
}

export function AppSidebar({ org, user }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                {org?.logo ? (
                  <Image
                    src={`/api${org.logo}`}
                    alt={org.name}
                    width={120}
                    height={20}
                    className="h-5 w-auto max-w-[120px] object-contain"
                    unoptimized
                  />
                ) : (
                  <span className="truncate text-sm font-semibold">
                    {org?.name ?? "ClinTrek"}
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.match(pathname)}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
