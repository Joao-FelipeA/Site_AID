import { sheets_v4 } from "googleapis";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { batchUpdate, escreverValores, obterPrimeiraAbaId } from "../lib/googleSheets";
import { labelDiaSemana, ORDEM_DIAS_SEMANA } from "../utils/diasSemana";

type StatusCelula = "verde" | "vermelho" | null;

const COR_VERDE = { red: 0.72, green: 0.88, blue: 0.72 };
const COR_VERMELHA = { red: 0.96, green: 0.71, blue: 0.71 };
const COR_NEUTRA = { red: 1, green: 1, blue: 1 };

const COLUNAS_FIXAS = 2; // RGM, Nome

/**
 * Reconstroi a planilha de frequencia inteira: uma linha por aluno, uma
 * coluna por dia da semana (Seg-Sex). A celula fica verde se o aluno
 * marcou presenca na ultima aula finalizada daquele dia, vermelha se
 * estava matriculado e faltou, e em branco se ele nao tem aula naquele dia.
 */
export async function sincronizarPlanilhaFrequencia(): Promise<void> {
  const spreadsheetId = env.google.planilhaFrequenciaId;
  if (!spreadsheetId) return;

  const usuarios = await prisma.usuario.findMany({
    where: { eAdmin: false },
    orderBy: { nome: "asc" },
  });

  const ultimaAulaPorDia = new Map<string, string>(); // diaAula -> aulaUuid
  for (const dia of ORDEM_DIAS_SEMANA) {
    const ultima = await prisma.aula.findFirst({
      where: { diaAula: dia, finalizada: true },
      orderBy: { dataAula: "desc" },
    });
    if (ultima) ultimaAulaPorDia.set(dia, ultima.uuid);
  }

  const aulaUuids = [...ultimaAulaPorDia.values()];
  const presencas = await prisma.presenca.findMany({ where: { aulaUuid: { in: aulaUuids } } });
  const presencaSet = new Set(presencas.map((p) => `${p.aulaUuid}:${p.usuarioUuid}`));

  const cabecalho = ["RGM", "Nome", ...ORDEM_DIAS_SEMANA.map(labelDiaSemana)];
  const linhas: string[][] = [cabecalho];
  const statusPorLinha: StatusCelula[][] = [];

  for (const usuario of usuarios) {
    const linha = [usuario.rgm, usuario.nome];
    const statusLinha: StatusCelula[] = [];

    for (const dia of ORDEM_DIAS_SEMANA) {
      if (usuario.diaAula !== dia) {
        linha.push("");
        statusLinha.push(null);
        continue;
      }

      const aulaUuid = ultimaAulaPorDia.get(dia);
      if (!aulaUuid) {
        linha.push("Sem aula finalizada");
        statusLinha.push(null);
        continue;
      }

      const presente = presencaSet.has(`${aulaUuid}:${usuario.uuid}`);
      linha.push(presente ? "Presente" : "Falta");
      statusLinha.push(presente ? "verde" : "vermelho");
    }

    linhas.push(linha);
    statusPorLinha.push(statusLinha);
  }

  await escreverValores(spreadsheetId, "A1", linhas);
  await aplicarCores(spreadsheetId, statusPorLinha);
}

async function aplicarCores(spreadsheetId: string, statusPorLinha: StatusCelula[][]): Promise<void> {
  if (statusPorLinha.length === 0) return;

  const sheetId = await obterPrimeiraAbaId(spreadsheetId);
  const requests: sheets_v4.Schema$Request[] = [];

  statusPorLinha.forEach((statusLinha, indiceLinha) => {
    statusLinha.forEach((status, indiceColuna) => {
      const cor = status === "verde" ? COR_VERDE : status === "vermelho" ? COR_VERMELHA : COR_NEUTRA;
      requests.push({
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: indiceLinha + 1,
            endRowIndex: indiceLinha + 2,
            startColumnIndex: indiceColuna + COLUNAS_FIXAS,
            endColumnIndex: indiceColuna + COLUNAS_FIXAS + 1,
          },
          cell: { userEnteredFormat: { backgroundColor: cor } },
          fields: "userEnteredFormat.backgroundColor",
        },
      });
    });
  });

  await batchUpdate(spreadsheetId, requests);
}
