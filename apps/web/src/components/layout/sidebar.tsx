"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  BarChart3,
  CreditCard,
  Landmark,
  Tag,
  FileText,
  Settings,
  ChevronDown,
  Frame,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

const navItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Lançamentos",
    icon: CreditCard,
    children: [
      { label: "Contas a Receber", href: "/financeiro/receber", icon: TrendingUp },
      { label: "Contas a Pagar",   href: "/financeiro/pagar",   icon: TrendingDown },
    ],
  },
  {
    label: "Gestão",
    icon: BarChart3,
    children: [
      { label: "Fluxo de Caixa",    href: "/financeiro/fluxo",    icon: BarChart3   },
      { label: "DRE",               href: "/financeiro/dre",      icon: FileText    },
      { label: "Contas Bancárias",  href: "/financeiro/contas",   icon: Landmark    },
      { label: "Centro de Custo",   href: "/financeiro/centros",  icon: Tag         },
    ],
  },
  {
    label: "Relatórios",
    icon: FileText,
    href: "/relatorios",
  },
  {
    label: "Configurações",
    icon: Settings,
    href: "/configuracoes",
  },
];

function iniciais(nome: string): string {
  const partes = nome.trim().split(" ");
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { usuarioAtual, fazerLogout } = useAuth();
  const [openGroups, setOpenGroups] = useState<string[]>(["Lançamentos", "Gestão"]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

  function handleLogout() {
    fazerLogout();
    router.replace("/login");
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Frame className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold leading-none text-foreground">Edu Quadros</p>
          <p className="text-xs text-muted-foreground">Financeiro</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            if (item.children) {
              const isOpen = openGroups.includes(item.label);
              const isActive = item.children.some((c) => pathname.startsWith(c.href));
              return (
                <li key={item.label}>
                  <button
                    onClick={() => toggleGroup(item.label)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
                  </button>
                  {isOpen && (
                    <ul className="mt-1 space-y-1 pl-4">
                      {item.children.map((child) => {
                        const childActive = pathname.startsWith(child.href);
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                                childActive
                                  ? "bg-primary text-primary-foreground font-medium"
                                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
                              )}
                            >
                              <child.icon className="h-3.5 w-3.5 shrink-0" />
                              {child.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href!}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">
            {usuarioAtual ? iniciais(usuarioAtual.nome) : "EQ"}
          </div>
          <div className="flex-1 overflow-hidden min-w-0">
            <p className="truncate text-sm font-medium leading-tight">
              {usuarioAtual?.nome ?? "Edu Quadros"}
            </p>
            <div className="mt-0.5">
              <Badge
                variant={usuarioAtual?.perfil === "admin" ? "default" : "secondary"}
                className="text-[10px] px-1.5 py-0 h-4 font-normal"
              >
                {usuarioAtual?.perfil === "admin" ? "Admin" : "Operador"}
              </Badge>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sair do sistema"
            className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
