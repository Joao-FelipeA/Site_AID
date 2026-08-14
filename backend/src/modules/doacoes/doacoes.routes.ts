import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { autenticar } from "../../middlewares/auth";
import * as doacoesController from "./doacoes.controller";

export const doacoesRouter = Router();

// Registrar uma doacao e publico: o doador nao tem conta no sistema.
doacoesRouter.post("/", asyncHandler(doacoesController.criar));

// Gerenciar doacoes ja registradas exige login (uso interno/admin).
doacoesRouter.get("/", autenticar, asyncHandler(doacoesController.listar));
doacoesRouter.get("/:uuid", autenticar, asyncHandler(doacoesController.obterPorId));
doacoesRouter.put("/:uuid", autenticar, asyncHandler(doacoesController.atualizar));
doacoesRouter.delete("/:uuid", autenticar, asyncHandler(doacoesController.remover));
doacoesRouter.post("/:uuid/materiais", autenticar, asyncHandler(doacoesController.adicionarMaterial));
doacoesRouter.delete("/:uuid/materiais/:materialUuid", autenticar, asyncHandler(doacoesController.removerMaterial));
