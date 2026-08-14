import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/appError";
import { gerarQrCodeDataUrl, gerarTokenQrCode } from "../../lib/qrcode";
import { diaSemanaDaData } from "../../utils/diasSemana";
import { env } from "../../config/env";

export function listarAulas() {
  return prisma.aula.findMany({ orderBy: { dataAula: "desc" } });
}

export function obterAula(uuid: string) {
  return prisma.aula.findUniqueOrThrow({
    where: { uuid },
    include: { presencas: { include: { usuario: true } } },
  });
}

function parseData(dataIso: string): Date {
  const data = new Date(dataIso);
  if (Number.isNaN(data.getTime())) {
    throw new AppError(400, "Data invalida.");
  }
  return data;
}

export async function criarAula(dataAulaIso: string) {
  const dataAula = parseData(dataAulaIso);
  const diaAula = diaSemanaDaData(dataAula);
  const qtdAluno = await prisma.usuario.count({ where: { diaAula } });

  return prisma.aula.create({
    data: {
      dataAula,
      diaAula,
      qrCodePresenca: gerarTokenQrCode(),
      qtdAluno,
    },
  });
}

export async function atualizarAula(uuid: string, dataAulaIso: string) {
  const aulaAtual = await prisma.aula.findUniqueOrThrow({ where: { uuid } });
  if (aulaAtual.finalizada) {
    throw new AppError(409, "Aula ja finalizada nao pode ser alterada.");
  }

  const dataAula = parseData(dataAulaIso);
  const diaAula = diaSemanaDaData(dataAula);
  const qtdAluno = await prisma.usuario.count({ where: { diaAula } });

  return prisma.aula.update({ where: { uuid }, data: { dataAula, diaAula, qtdAluno } });
}

export function deletarAula(uuid: string) {
  return prisma.aula.delete({ where: { uuid } });
}

export async function gerarQrCodeDaAula(uuid: string) {
  const aula = await prisma.aula.findUniqueOrThrow({ where: { uuid } });
  const url = `${env.frontendUrl}/presenca-confirmar?aula=${aula.uuid}&token=${aula.qrCodePresenca}`;
  const qrCodeDataUrl = await gerarQrCodeDataUrl(url);
  return { token: aula.qrCodePresenca, url, qrCodeDataUrl };
}

export async function marcarPresenca(aulaUuid: string, usuarioUuid: string, token: string) {
  const aula = await prisma.aula.findUniqueOrThrow({ where: { uuid: aulaUuid } });

  if (aula.qrCodePresenca !== token) {
    throw new AppError(400, "QR code invalido para esta aula.");
  }
  if (aula.finalizada) {
    throw new AppError(409, "Esta aula ja foi finalizada.");
  }

  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { uuid: usuarioUuid } });
  if (usuario.diaAula !== aula.diaAula) {
    throw new AppError(403, "Voce nao esta matriculado neste dia de aula.");
  }

  const jaMarcou = await prisma.presenca.findUnique({
    where: { aulaUuid_usuarioUuid: { aulaUuid, usuarioUuid } },
  });
  if (jaMarcou) {
    throw new AppError(409, "Presenca ja registrada para esta aula.");
  }

  return prisma.$transaction(async (tx) => {
    const presenca = await tx.presenca.create({ data: { aulaUuid, usuarioUuid } });
    await tx.aula.update({ where: { uuid: aulaUuid }, data: { qtdPresenca: { increment: 1 } } });
    return presenca;
  });
}

export async function finalizarAula(uuid: string) {
  return prisma.$transaction(async (tx) => {
    const aula = await tx.aula.findUniqueOrThrow({ where: { uuid }, include: { presencas: true } });
    if (aula.finalizada) {
      throw new AppError(409, "Aula ja finalizada.");
    }

    const matriculados = await tx.usuario.findMany({ where: { diaAula: aula.diaAula } });
    const presentesUuids = new Set(aula.presencas.map((p) => p.usuarioUuid));

    const presentes = matriculados.filter((m) => presentesUuids.has(m.uuid));
    const ausentes = matriculados.filter((m) => !presentesUuids.has(m.uuid));

    for (const usuario of presentes) {
      await tx.usuario.update({ where: { uuid: usuario.uuid }, data: { frequencia: { increment: 1 } } });
    }

    const aulaFinalizada = await tx.aula.update({
      where: { uuid },
      data: { finalizada: true, qtdPresenca: presentes.length },
    });

    return { aula: aulaFinalizada, presentes, ausentes };
  });
}
