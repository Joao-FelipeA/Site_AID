import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { autenticar, exigirAdmin } from "../../middlewares/auth";
import * as aulasController from "./aulas.controller";

export const aulasRouter = Router();
aulasRouter.use(autenticar);

aulasRouter.get("/", asyncHandler(aulasController.listar));
aulasRouter.get("/:uuid", asyncHandler(aulasController.obterPorId));
aulasRouter.post("/", exigirAdmin, asyncHandler(aulasController.criar));
aulasRouter.put("/:uuid", exigirAdmin, asyncHandler(aulasController.atualizar));
aulasRouter.delete("/:uuid", exigirAdmin, asyncHandler(aulasController.remover));
aulasRouter.get("/:uuid/qrcode", exigirAdmin, asyncHandler(aulasController.qrcode));
aulasRouter.post("/:uuid/presenca", asyncHandler(aulasController.marcarPresenca));
aulasRouter.post("/:uuid/finalizar", exigirAdmin, asyncHandler(aulasController.finalizar));
