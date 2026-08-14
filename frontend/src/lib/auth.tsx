import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { getToken, getUsuarioArmazenado, limparSessao, setSessao } from "./api";
import type { Usuario } from "./types";

interface AuthContextValue {
  usuario: Usuario | null;
  token: string | null;
  login: (token: string, usuario: Usuario) => void;
  logout: () => void;
  atualizarUsuario: (usuario: Usuario) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => getUsuarioArmazenado());
  const [token, setToken] = useState<string | null>(() => getToken());

  const login = useCallback((novoToken: string, novoUsuario: Usuario) => {
    setSessao(novoToken, novoUsuario);
    setToken(novoToken);
    setUsuario(novoUsuario);
  }, []);

  const logout = useCallback(() => {
    limparSessao();
    setToken(null);
    setUsuario(null);
  }, []);

  const atualizarUsuario = useCallback(
    (novoUsuario: Usuario) => {
      setUsuario(novoUsuario);
      if (token) setSessao(token, novoUsuario);
    },
    [token],
  );

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout, atualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>.");
  }
  return contexto;
}

export function paginaInicialParaUsuario(usuario: Usuario | null): string {
  return usuario?.eAdmin ? "/admin" : "/dashboard";
}
