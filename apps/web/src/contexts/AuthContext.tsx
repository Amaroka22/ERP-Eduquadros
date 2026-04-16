"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiLogin, apiMe, setToken, removeToken, getToken } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────

export type PerfilUsuario = "admin" | "financeiro" | "operador";

export type UsuarioSessao = {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
};

type AuthState = {
  usuarioAtual: UsuarioSessao | null;
  isReady: boolean;
  fazerLogin: (email: string, senha: string) => Promise<boolean>;
  fazerLogout: () => void;
};

const SESSION_KEY = "erp_eduquadros_session";
const LOCAL_SESSION_KEY = "erp_local_session";

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuarioAtual, setUsuarioAtual] = useState<UsuarioSessao | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Ao montar: tenta restaurar sessão usando o JWT armazenado ou sessão local
  useEffect(() => {
    async function restore() {
      // 1. Tenta sessão local (login sem backend)
      try {
        const raw = localStorage.getItem(LOCAL_SESSION_KEY);
        if (raw) {
          const sessao = JSON.parse(raw) as UsuarioSessao;
          setUsuarioAtual(sessao);
          setIsReady(true);
          return;
        }
      } catch {}

      // 2. Tenta restaurar via JWT
      const token = getToken();
      if (!token) {
        // Remove sessão legada antiga
        try { localStorage.removeItem(SESSION_KEY); } catch {}
        setIsReady(true);
        return;
      }

      try {
        const usuario = await apiMe();
        const sessao: UsuarioSessao = {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          perfil: (usuario.perfil?.toLowerCase() as PerfilUsuario) ?? "operador",
        };
        setUsuarioAtual(sessao);
      } catch {
        removeToken();
      } finally {
        setIsReady(true);
      }
    }

    restore();
  }, []);

  async function fazerLogin(email: string, senha: string): Promise<boolean> {
    const USUARIOS_LOCAL = [
      { id: "1", nome: "Gabriel", login: "gabriel", senha: "220904", perfil: "admin" as PerfilUsuario },
      { id: "2", nome: "Admin", login: "admin", senha: "admin123", perfil: "admin" as PerfilUsuario },
    ];

    // Verifica credenciais locais primeiro (funciona sem internet)
    const local = USUARIOS_LOCAL.find(
      (u) => u.login === email.toLowerCase() && u.senha === senha
    );
    if (local) {
      const sessao: UsuarioSessao = { id: local.id, nome: local.nome, email: local.login, perfil: local.perfil };
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(sessao));
      setUsuarioAtual(sessao);
      return true;
    }

    // Se não é usuário local, tenta o backend
    try {
      const { accessToken, usuario } = await apiLogin(email, senha);
      setToken(accessToken);
      setUsuarioAtual({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: (usuario.perfil?.toLowerCase() as PerfilUsuario) ?? "operador",
      });
      return true;
    } catch {
      return false;
    }
  }

  function fazerLogout() {
    removeToken();
    try { localStorage.removeItem(LOCAL_SESSION_KEY); } catch {}
    setUsuarioAtual(null);
  }

  return (
    <AuthContext.Provider value={{ usuarioAtual, isReady, fazerLogin, fazerLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
