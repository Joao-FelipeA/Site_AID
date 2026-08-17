import { Request, Response } from "express";
import { AppError } from "../../lib/appError";
import { sincronizarPlanilhaFrequencia } from "../../services/frequenciaSheetService";
import { atualizarAulaSchema, criarAulaSchema, marcarPresencaSchema } from "./aulas.schema";
import * as aulasService from "./aulas.service";

function sanitizarUsuario<T extends { senha: string }>(usuario: T) {
  const { senha: _senha, ...resto } = usuario;
  return resto;
}

export async function listar(_req: Request, res: Response): Promise<void> {
  res.json(await aulasService.listarAulas());
}

export async function obterPorId(req: Request, res: Response): Promise<void> {
  const aula = await aulasService.obterAula(req.params.uuid);
  res.json({
    ...aula,
    presencas: aula.presencas.map((p) => ({ ...p, usuario: sanitizarUsuario(p.usuario) })),
  });
}

export async function criar(req: Request, res: Response): Promise<void> {
  const { dataAula } = criarAulaSchema.parse(req.body);
  const aula = await aulasService.criarAula(dataAula);
  res.status(201).json(aula);
}

export async function atualizar(req: Request, res: Response): Promise<void> {
  const { dataAula } = atualizarAulaSchema.parse(req.body);
  const aula = await aulasService.atualizarAula(req.params.uuid, dataAula);
  res.json(aula);
}

export async function remover(req: Request, res: Response): Promise<void> {
  await aulasService.deletarAula(req.params.uuid);
  res.status(204).send();
}

export async function qrcode(req: Request, res: Response): Promise<void> {
  const resultado = await aulasService.gerarQrCodeDaAula(req.params.uuid);
  res.json(resultado);
}

export async function marcarPresenca(req: Request, res: Response): Promise<void> {
  if (!req.usuario) throw new AppError(401, "Nao autenticado.");
  const { token } = marcarPresencaSchema.parse(req.body);
  const presenca = await aulasService.marcarPresenca(req.params.uuid, req.usuario.sub, token);
  res.status(201).json(presenca);
}

export async function finalizar(req: Request, res: Response): Promise<void> {
  const resultado = await aulasService.finalizarAula(req.params.uuid);

  let avisoPlanilha: string | undefined;
  try {
    await sincronizarPlanilhaFrequencia();
  } catch (erro) {
    avisoPlanilha = `Aula finalizada, mas falhou ao sincronizar a planilha de frequencia: ${(erro as Error).message}`;
  }

  res.json({
    aula: resultado.aula,
    presentes: resultado.presentes.map(sanitizarUsuario),
    ausentes: resultado.ausentes.map(sanitizarUsuario),
    avisoPlanilha,
  });
}

/** Forca uma resincronizacao da planilha de frequencia sem precisar finalizar uma aula. */
export async function sincronizarFrequencia(_req: Request, res: Response): Promise<void> {
  await sincronizarPlanilhaFrequencia();
  res.json({ mensagem: "Planilha de frequencia sincronizada." });
}
