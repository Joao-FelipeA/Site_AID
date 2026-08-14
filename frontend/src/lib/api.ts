import type { Usuario } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

const TOKEN_KEY = "aid_token";
const USUARIO_KEY = "aid_usuario";

export class ApiError extends Error {
  status: number;
  detalhes?: unknown;

  constructor(status: number, message: string, detalhes?: unknown) {
    super(message);
    this.status = status;
    this.detalhes = detalhes;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUsuarioArmazenado(): Usuario | null {
  const bruto = localStorage.getItem(USUARIO_KEY);
  return bruto ? (JSON.parse(bruto) as Usuario) : null;
}

export function setSessao(token: string, usuario: Usuario): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
}

export function limparSessao(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USUARIO_KEY);
}

async function apiFetch<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((opcoes.headers as Record<string, string>) ?? {}),
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const resposta = await fetch(`${API_BASE_URL}${caminho}`, { ...opcoes, headers });

  if (resposta.status === 204) {
    return undefined as T;
  }

  const corpo = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const mensagem = corpo?.erro ?? `Erro ${resposta.status}`;
    throw new ApiError(resposta.status, mensagem, corpo?.detalhes);
  }

  return corpo as T;
}

export const api = {
  get: <T>(caminho: string) => apiFetch<T>(caminho, { method: "GET" }),
  post: <T>(caminho: string, body?: unknown) =>
    apiFetch<T>(caminho, { method: "POST", body: JSON.stringify(body ?? {}) }),
  put: <T>(caminho: string, body?: unknown) =>
    apiFetch<T>(caminho, { method: "PUT", body: JSON.stringify(body ?? {}) }),
  delete: <T>(caminho: string) => apiFetch<T>(caminho, { method: "DELETE" }),
};
