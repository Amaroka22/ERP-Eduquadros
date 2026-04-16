"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Frame, Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const { fazerLogin, usuarioAtual, isReady } = useAuth();

  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Se já está logado, redireciona
  useEffect(() => {
    if (isReady && usuarioAtual) {
      router.replace("/dashboard");
    }
  }, [isReady, usuarioAtual, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!login.trim() || !senha) return;

    setCarregando(true);
    setErro("");

    const ok = await fazerLogin(login.trim(), senha);
    if (ok) {
      router.replace("/dashboard");
    } else {
      setErro("E-mail ou senha incorretos.");
      setCarregando(false);
    }
  }

  // Aguarda hydration antes de exibir
  if (!isReady) return null;
  if (usuarioAtual) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-border/60 overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-8 py-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <Frame className="h-6 w-6 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">Edu Quadros</h1>
            <p className="text-sm text-white/70 mt-0.5">Sistema de Gestão Financeira</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5 text-slate-900">
          <div className="space-y-1.5">
            <p className="text-lg font-semibold text-slate-900">Entrar no sistema</p>
            <p className="text-sm text-slate-500">Digite suas credenciais de acesso</p>
          </div>

          <div className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="login" className="text-slate-700 font-medium">Usuário</Label>
              <Input
                id="login"
                type="text"
                value={login}
                onChange={(e) => { setLogin(e.target.value); setErro(""); }}
                placeholder="Seu login de acesso"
                autoComplete="username"
                autoFocus
                disabled={carregando}
                className="bg-white text-slate-900 border-slate-300 placeholder:text-slate-400 focus-visible:ring-blue-500"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="senha" className="text-slate-700 font-medium">Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => { setSenha(e.target.value); setErro(""); }}
                  placeholder="Sua senha"
                  autoComplete="current-password"
                  disabled={carregando}
                  className="pr-10 bg-white text-slate-900 border-slate-300 placeholder:text-slate-400 focus-visible:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {mostrarSenha
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {erro && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {erro}
            </div>
          )}

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={!login.trim() || !senha || carregando}
          >
            {carregando ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Entrando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Entrar
              </span>
            )}
          </Button>
        </form>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Edu Quadros Estamparia &mdash; Acesso restrito
      </p>
    </div>
  );
}
