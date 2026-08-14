import { Request, Response } from "express";
import { sincronizarPlanilhaDoacoes } from "../../services/doacoesSheetService";
import {
  atualizarDoacaoSchema,
  criarDoacaoSchema,
  criarMaterialSchema,
} from "./doacoes.schema";
import * as doacoesService from "./doacoes.service";

async function sincronizarPlanilhaComAviso(): Promise<string | undefined> {
  try {
    await sincronizarPlanilhaDoacoes();
    return undefined;
  } catch (erro) {
    return `Falha ao sincronizar planilha de doacoes: ${(erro as Error).message}`;
  }
}

export async function listar(_req: Request, res: Response): Promise<void> {
  res.json(await doacoesService.listarDoacoes());
}

export async function obterPorId(req: Request, res: Response): Promise<void> {
  res.json(await doacoesService.obterDoacao(req.params.uuid));
}

export async function criar(req: Request, res: Response): Promise<void> {
  const input = criarDoacaoSchema.parse(req.body);
  const doacao = await doacoesService.criarDoacao(input);
  const avisoPlanilha = await sincronizarPlanilhaComAviso();
  res.status(201).json({ doacao, avisoPlanilha });
}

export async function atualizar(req: Request, res: Response): Promise<void> {
  const input = atualizarDoacaoSchema.parse(req.body);
  const doacao = await doacoesService.atualizarDoacao(req.params.uuid, input);
  const avisoPlanilha = await sincronizarPlanilhaComAviso();
  res.json({ doacao, avisoPlanilha });
}

export async function remover(req: Request, res: Response): Promise<void> {
  await doacoesService.deletarDoacao(req.params.uuid);
  const avisoPlanilha = await sincronizarPlanilhaComAviso();
  res.status(200).json({ avisoPlanilha });
}

export async function adicionarMaterial(req: Request, res: Response): Promise<void> {
  const { materialDoado } = criarMaterialSchema.parse(req.body);
  const materiais = await doacoesService.adicionarMaterial(req.params.uuid, materialDoado);
  const avisoPlanilha = await sincronizarPlanilhaComAviso();
  res.status(201).json({ materiais, avisoPlanilha });
}

export async function removerMaterial(req: Request, res: Response): Promise<void> {
  await doacoesService.removerMaterial(req.params.materialUuid);
  const avisoPlanilha = await sincronizarPlanilhaComAviso();
  res.status(200).json({ avisoPlanilha });
}
