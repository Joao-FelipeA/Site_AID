import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { autenticar, exigirAdmin } from "../../middlewares/auth";
import * as aulasRoboticaController from "./aulasRobotica.controller";

export const aulasRoboticaRouter = Router();
aulasRoboticaRouter.use(autenticar);

aulasRoboticaRouter.get("/", asyncHandler(aulasRoboticaController.listar));
aulasRoboticaRouter.get("/:uuid", asyncHandler(aulasRoboticaController.obterPorId));
aulasRoboticaRouter.post("/", exigirAdmin, asyncHandler(aulasRoboticaController.criar));
aulasRoboticaRouter.put("/:uuid", exigirAdmin, asyncHandler(aulasRoboticaController.atualizar));
aulasRoboticaRouter.delete("/:uuid", exigirAdmin, asyncHandler(aulasRoboticaController.remover));
aulasRoboticaRouter.get("/:uuid/qrcode", exigirAdmin, asyncHandler(aulasRoboticaController.qrcode));
aulasRoboticaRouter.post("/:uuid/presenca", asyncHandler(aulasRoboticaController.marcarPresenca));
aulasRoboticaRouter.post("/:uuid/finalizar", exigirAdmin, asyncHandler(aulasRoboticaController.finalizar));
