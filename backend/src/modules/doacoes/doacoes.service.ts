import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/appError";
import { splitMateriais } from "../../utils/materiais";
import { CriarDoacaoInput, AtualizarDoacaoInput } from "./doacoes.schema";

export function listarDoacoes() {
  return prisma.doacao.findMany({ include: { materiais: true }, orderBy: { dtaCriacao: "desc" } });
}

export function obterDoacao(uuid: string) {
  return prisma.doacao.findUniqueOrThrow({ where: { uuid }, include: { materiais: true } });
}

export function criarDoacao(input: CriarDoacaoInput) {
  const materiais = input.materiais.flatMap(splitMateriais);

  return prisma.doacao.create({
    data: {
      nome: input.nome,
      contato: input.contato,
      materiais: { create: materiais.map((materialDoado) => ({ materialDoado })) },
    },
    include: { materiais: true },
  });
}

export function atualizarDoacao(uuid: string, input: AtualizarDoacaoInput) {
  return prisma.doacao.update({ where: { uuid }, data: input, include: { materiais: true } });
}

export function deletarDoacao(uuid: string) {
  return prisma.doacao.delete({ where: { uuid } });
}

export function adicionarMaterial(doacaoUuid: string, materialDoadoTexto: string) {
  const materiais = splitMateriais(materialDoadoTexto);
  if (materiais.length === 0) {
    throw new AppError(400, "Informe ao menos um material valido.");
  }

  return prisma.$transaction(
    materiais.map((materialDoado) => prisma.materialDoado.create({ data: { doacaoUuid, materialDoado } })),
  );
}

export function removerMaterial(materialUuid: string) {
  return prisma.materialDoado.delete({ where: { uuid: materialUuid } });
}
