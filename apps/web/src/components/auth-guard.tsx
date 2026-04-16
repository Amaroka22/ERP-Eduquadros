"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { usuarioAtual, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isReady && !usuarioAtual) {
      router.replace("/login");
    }
  }, [isReady, usuarioAtual, router]);

  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!usuarioAtual) return null;

  return <>{children}</>;
}
