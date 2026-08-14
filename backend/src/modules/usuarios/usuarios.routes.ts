import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { autenticar, exigirAdmin } from "../../middlewares/auth";
import * as usuariosController from "./usuarios.controller";

export const authRouter = Router();
authRouter.post("/login", asyncHandler(usuariosController.login));
authRouter.post("/esqueci-senha", asyncHandler(usuariosController.esqueciSenha));

export const usuariosRouter = Router();
usuariosRouter.use(autenticar);

usuariosRouter.get("/me", asyncHandler(usuariosController.obterPerfil));
usuariosRouter.put("/me/senha", asyncHandler(usuariosController.alterarSenha));

usuariosRouter.get("/", exigirAdmin, asyncHandler(usuariosController.listar));
usuariosRouter.get("/:uuid", exigirAdmin, asyncHandler(usuariosController.obterPorId));
usuariosRouter.post("/", exigirAdmin, asyncHandler(usuariosController.criar));
usuariosRouter.put("/:uuid", exigirAdmin, asyncHandler(usuariosController.atualizar));
usuariosRouter.delete("/:uuid", exigirAdmin, asyncHandler(usuariosController.remover));
usuariosRouter.put("/:uuid/dias-aula", exigirAdmin, asyncHandler(usuariosController.substituirDia));
usuariosRouter.post("/:uuid/resetar-senha", exigirAdmin, asyncHandler(usuariosController.resetarSenha));
usuariosRouter.post("/importar", exigirAdmin, asyncHandler(usuariosController.importar));
