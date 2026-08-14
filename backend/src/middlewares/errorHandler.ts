import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../lib/appError";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ erro: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ erro: "Dados invalidos.", detalhes: err.flatten() });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ erro: "Registro duplicado.", campos: err.meta?.target });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ erro: "Registro nao encontrado." });
      return;
    }
  }

  console.error(err);
  res.status(500).json({ erro: "Erro interno do servidor." });
}
