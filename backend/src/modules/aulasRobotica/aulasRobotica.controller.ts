import { Request, Response } from "express";
import { AppError } from "../../lib/appError";
import { atualizarAulaRoboticaSchema, criarAulaRoboticaSchema, marcarPresencaRoboticaSchema } from "./aulasRobotica.schema";
import * as aulasRoboticaService from "./aulasRobotica.service";

function sanitizarUsuario<T extends { senha: string }>(usuario: T) {
  const { senha: _senha, ...resto } = usuario;
  return resto;
}

export async function listar(_req: Request, res: Response): Promise<void> {
  res.json(await aulasRoboticaService.listarAulasRobotica());
}

export async function obterPorId(req: Request, res: Response): Promise<void> {
  const aula = await aulasRoboticaService.obterAulaRobotica(req.params.uuid);
  res.json({
    ...aula,
    presencas: aula.presencas.map((p) => ({ ...p, usuario: sanitizarUsuario(p.usuario) })),
  });
}

export async function criar(req: Request, res: Response): Promise<void> {
  const { dataAula, horario } = criarAulaRoboticaSchema.parse(req.body);
  const aula = await aulasRoboticaService.criarAulaRobotica(dataAula, horario);
  res.status(201).json(aula);
}

export async function atualizar(req: Request, res: Response): Promise<void> {
  const { dataAula } = atualizarAulaRoboticaSchema.parse(req.body);
  const aula = await aulasRoboticaService.atualizarAulaRobotica(req.params.uuid, dataAula);
  res.json(aula);
}

export async function remover(req: Request, res: Response): Promise<void> {
  await aulasRoboticaService.deletarAulaRobotica(req.params.uuid);
  res.status(204).send();
}

export async function qrcode(req: Request, res: Response): Promise<void> {
  const resultado = await aulasRoboticaService.gerarQrCodeDaAulaRobotica(req.params.uuid);
  res.json(resultado);
}

export async function marcarPresenca(req: Request, res: Response): Promise<void> {
  if (!req.usuario) throw new AppError(401, "Nao autenticado.");
  const { token } = marcarPresencaRoboticaSchema.parse(req.body);
  const presenca = await aulasRoboticaService.marcarPresencaRobotica(req.params.uuid, req.usuario.sub, token);
  res.status(201).json(presenca);
}

export async function finalizar(req: Request, res: Response): Promise<void> {
  const resultado = await aulasRoboticaService.finalizarAulaRobotica(req.params.uuid);
  res.json({
    aula: resultado.aula,
    presentes: resultado.presentes.map(sanitizarUsuario),
    ausentes: resultado.ausentes.map(sanitizarUsuario),
  });
}
