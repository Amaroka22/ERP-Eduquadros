import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/** Converte um Date para "YYYY-MM-DD" usando hora local (evita shift UTC). */
export function toDateStr(d: Date): string {
  return (
    d.getFullYear() +
    "-" + String(d.getMonth() + 1).padStart(2, "0") +
    "-" + String(d.getDate()).padStart(2, "0")
  );
}

/** Data de hoje no fuso local como "YYYY-MM-DD". */
export function todayStr(): string {
  return toDateStr(new Date());
}

/**
 * Formata "YYYY-MM-DD" ou Date para exibição em pt-BR.
 * Parseia strings de data como hora local para evitar shift de UTC.
 */
export function formatDate(date: string | Date): string {
  let d: Date;
  if (typeof date === "string") {
    // "YYYY-MM-DD" → tratar como local, não UTC
    const [y, m, day] = date.split("-").map(Number);
    d = new Date(y, m - 1, day);
  } else {
    d = date;
  }
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

export function formatCPFCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}
