import { DiaSemana, HorarioRobotica } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/appError";
import { gerarQrCodeDataUrl, gerarTokenQrCode } from "../../lib/qrcode";
import { diaSemanaDaData } from "../../utils/diasSemana";
import { env } from "../../config/env";

export function listarAulasRobotica() {
  return prisma.aulaRobotica.findMany({ orderBy: { dataAula: "desc" } });
}

export function obterAulaRobotica(uuid: string) {
  return prisma.aulaRobotica.findUniqueOrThrow({
    where: { uuid },
    include: { presencas: { include: { usuario: true } } },
  });
}

function parseDataDeSexta(dataIso: string): Date {
  const data = new Date(dataIso);
  if (Number.isNaN(data.getTime())) {
    throw new AppError(400, "Data invalida.");
  }
  if (diaSemanaDaData(data) !== DiaSemana.SEXTA) {
    throw new AppError(400, "Aula de robotica so pode ser criada numa sexta-feira.");
  }
  return data;
}

export async function criarAulaRobotica(dataAulaIso: string, horario: HorarioRobotica) {
  const dataAula = parseDataDeSexta(dataAulaIso);
  const qtdAluno = await prisma.usuario.count({ where: { horarioRobotica: horario } });

  return prisma.aulaRobotica.create({
    data: {
      dataAula,
      horario,
      qrCodePresenca: gerarTokenQrCode(),
      qtdAluno,
    },
  });
}

export async function atualizarAulaRobotica(uuid: string, dataAulaIso: string) {
  const aulaAtual = await prisma.aulaRobotica.findUniqueOrThrow({ where: { uuid } });
  if (aulaAtual.finalizada) {
    throw new AppError(409, "Aula ja finalizada nao pode ser alterada.");
  }

  const dataAula = parseDataDeSexta(dataAulaIso);
  const qtdAluno = await prisma.usuario.count({ where: { horarioRobotica: aulaAtual.horario } });

  return prisma.aulaRobotica.update({ where: { uuid }, data: { dataAula, qtdAluno } });
}

export function deletarAulaRobotica(uuid: string) {
  return prisma.aulaRobotica.delete({ where: { uuid } });
}

export async function gerarQrCodeDaAulaRobotica(uuid: string) {
  const aula = await prisma.aulaRobotica.findUniqueOrThrow({ where: { uuid } });
  const url = `${env.frontendUrl}/presenca-confirmar-robotica?aula=${aula.uuid}&token=${aula.qrCodePresenca}`;
  const qrCodeDataUrl = await gerarQrCodeDataUrl(url);
  return { token: aula.qrCodePresenca, url, qrCodeDataUrl };
}

export async function marcarPresencaRobotica(aulaUuid: string, usuarioUuid: string, token: string) {
  const aula = await prisma.aulaRobotica.findUniqueOrThrow({ where: { uuid: aulaUuid } });

  if (aula.qrCodePresenca !== token) {
    throw new AppError(400, "QR code invalido para esta aula.");
  }
  if (aula.finalizada) {
    throw new AppError(409, "Esta aula ja foi finalizada.");
  }

  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { uuid: usuarioUuid } });
  if (usuario.horarioRobotica !== aula.horario) {
    throw new AppError(403, "Voce nao esta matriculado neste horario de robotica.");
  }

  const jaMarcou = await prisma.presencaRobotica.findUnique({
    where: { aulaRoboticaUuid_usuarioUuid: { aulaRoboticaUuid: aulaUuid, usuarioUuid } },
  });
  if (jaMarcou) {
    throw new AppError(409, "Presenca ja registrada para esta aula.");
  }

  return prisma.$transaction(async (tx) => {
    const presenca = await tx.presencaRobotica.create({ data: { aulaRoboticaUuid: aulaUuid, usuarioUuid } });
    await tx.aulaRobotica.update({ where: { uuid: aulaUuid }, data: { qtdPresenca: { increment: 1 } } });
    return presenca;
  });
}

export async function finalizarAulaRobotica(uuid: string) {
  return prisma.$transaction(async (tx) => {
    const aula = await tx.aulaRobotica.findUniqueOrThrow({ where: { uuid }, include: { presencas: true } });
    if (aula.finalizada) {
      throw new AppError(409, "Aula ja finalizada.");
    }

    const matriculados = await tx.usuario.findMany({ where: { horarioRobotica: aula.horario } });
    const presentesUuids = new Set(aula.presencas.map((p) => p.usuarioUuid));

    const presentes = matriculados.filter((m) => presentesUuids.has(m.uuid));
    const ausentes = matriculados.filter((m) => !presentesUuids.has(m.uuid));

    for (const usuario of presentes) {
      await tx.usuario.update({ where: { uuid: usuario.uuid }, data: { frequenciaRobotica: { increment: 1 } } });
    }

    const aulaFinalizada = await tx.aulaRobotica.update({
      where: { uuid },
      data: { finalizada: true, qtdPresenca: presentes.length },
    });

    return { aula: aulaFinalizada, presentes, ausentes };
  });
}
