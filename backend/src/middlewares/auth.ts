import { NextFunction, Request, Response } from "express";
import { verificarToken } from "../lib/jwt";
import { AppError } from "../lib/appError";

/** Exige um JWT valido no header Authorization: Bearer <token>. */
export function autenticar(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError(401, "Token de autenticacao ausente.");
  }

  const token = header.slice("Bearer ".length);
  try {
    req.usuario = verificarToken(token);
  } catch {
    throw new AppError(401, "Token de autenticacao invalido ou expirado.");
  }

  next();
}

/** Exige que o usuario autenticado seja administrador. Use depois de `autenticar`. */
export function exigirAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.usuario?.eAdmin) {
    throw new AppError(403, "Acao restrita a administradores.");
  }
  next();
}
