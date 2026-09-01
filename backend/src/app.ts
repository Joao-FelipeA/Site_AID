import express, { Request, Response } from "express";
import cors from "cors";
import { authRouter, usuariosRouter } from "./modules/usuarios/usuarios.routes";
import { aulasRouter } from "./modules/aulas/aulas.routes";
import { aulasRoboticaRouter } from "./modules/aulasRobotica/aulasRobotica.routes";
import { doacoesRouter } from "./modules/doacoes/doacoes.routes";
import { errorHandler } from "./middlewares/errorHandler";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/usuarios", usuariosRouter);
app.use("/aulas", aulasRouter);
app.use("/aulas-robotica", aulasRoboticaRouter);
app.use("/doacoes", doacoesRouter);

app.use(errorHandler);
