import { sheets_v4 } from "googleapis";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { batchUpdate, escreverValores, obterPrimeiraAbaId } from "../lib/googleSheets";
import { labelDiaSemana, ORDEM_DIAS_SEMANA } from "../utils/diasSemana";

type StatusCelula = "verde" | "amarelo" | "vermelho" | null;

const COR_VERDE = { red: 0.72, green: 0.88, blue: 0.72 };
const COR_AMARELA = { red: 0.99, green: 0.9, blue: 0.6 };
const COR_VERMELHA = { red: 0.96, green: 0.71, blue: 0.71 };
const COR_NEUTRA = { red: 1, green: 1, blue: 1 };

const COLUNA_NOME = 1; // A=RGM, B=Nome
const COLUNAS_FIXAS = 2; // RGM, Nome

/** Verde = 0 faltas, amarelo = 1-2 faltas, vermelho = 3+ faltas. */
function corPorFaltas(faltas: number): StatusCelula {
  if (faltas === 0) return "verde";
  if (faltas <= 2) return "amarelo";
  return "vermelho";
}

/**
 * Reconstroi a planilha de frequencia inteira: uma linha por aluno, uma
 * coluna por dia da semana (Seg-Sex) mais o nome. A celula do dia fica
 * verde se o aluno marcou presenca na ultima aula finalizada daquele dia,
 * vermelha se estava matriculado e faltou, e em branco se ele nao tem
 * aula naquele dia. A celula do NOME reflete o total de faltas acumuladas
 * no dia dele: verde sem faltas, amarela com 1-2, vermelha com 3+.
 */
export async function sincronizarPlanilhaFrequencia(): Promise<void> {
  const spreadsheetId = env.google.planilhaFrequenciaId;
  if (!spreadsheetId) return;

  const usuarios = await prisma.usuario.findMany({
    where: { eAdmin: false },
    orderBy: { nome: "asc" },
  });

  const ultimaAulaPorDia = new Map<string, string>(); // diaAula -> aulaUuid
  const totalFinalizadasPorDia = new Map<string, number>(); // diaAula -> qtd aulas finalizadas
  for (const dia of ORDEM_DIAS_SEMANA) {
    const ultima = await prisma.aula.findFirst({
      where: { diaAula: dia, finalizada: true },
      orderBy: { dataAula: "desc" },
    });
    if (ultima) ultimaAulaPorDia.set(dia, ultima.uuid);

    const total = await prisma.aula.count({ where: { diaAula: dia, finalizada: true } });
    totalFinalizadasPorDia.set(dia, total);
  }

  const aulaUuids = [...ultimaAulaPorDia.values()];
  const presencas = await prisma.presenca.findMany({ where: { aulaUuid: { in: aulaUuids } } });
  const presencaSet = new Set(presencas.map((p) => `${p.aulaUuid}:${p.usuarioUuid}`));

  const cabecalho = ["RGM", "Nome", ...ORDEM_DIAS_SEMANA.map(labelDiaSemana)];
  const linhas: string[][] = [cabecalho];
  const statusDiasPorLinha: StatusCelula[][] = [];
  const statusNomePorLinha: StatusCelula[] = [];

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

    const totalFinalizadas = usuario.diaAula ? (totalFinalizadasPorDia.get(usuario.diaAula) ?? 0) : 0;
    const faltas = Math.max(0, totalFinalizadas - usuario.frequencia);
    statusNomePorLinha.push(usuario.diaAula ? corPorFaltas(faltas) : null);

    linhas.push(linha);
    statusDiasPorLinha.push(statusLinha);
  }

  await escreverValores(spreadsheetId, "A1", linhas);
  await aplicarCores(spreadsheetId, statusDiasPorLinha, statusNomePorLinha);
}

async function aplicarCores(
  spreadsheetId: string,
  statusDiasPorLinha: StatusCelula[][],
  statusNomePorLinha: StatusCelula[],
): Promise<void> {
  if (statusDiasPorLinha.length === 0) return;

  const sheetId = await obterPrimeiraAbaId(spreadsheetId);
  const requests: sheets_v4.Schema$Request[] = [];

  function corDe(status: StatusCelula) {
    if (status === "verde") return COR_VERDE;
    if (status === "amarelo") return COR_AMARELA;
    if (status === "vermelho") return COR_VERMELHA;
    return COR_NEUTRA;
  }

  function requisitarCor(indiceLinha: number, indiceColuna: number, status: StatusCelula) {
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: indiceLinha + 1,
          endRowIndex: indiceLinha + 2,
          startColumnIndex: indiceColuna,
          endColumnIndex: indiceColuna + 1,
        },
        cell: { userEnteredFormat: { backgroundColor: corDe(status) } },
        fields: "userEnteredFormat.backgroundColor",
      },
    });
  }

  statusDiasPorLinha.forEach((statusLinha, indiceLinha) => {
    statusLinha.forEach((status, indiceColuna) => {
      requisitarCor(indiceLinha, indiceColuna + COLUNAS_FIXAS, status);
    });
  });

  statusNomePorLinha.forEach((status, indiceLinha) => {
    requisitarCor(indiceLinha, COLUNA_NOME, status);
  });

  await batchUpdate(spreadsheetId, requests);
}
