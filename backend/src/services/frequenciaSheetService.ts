import { sheets_v4 } from "googleapis";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { batchUpdate, escreverValores, limparValores, obterPrimeiraAbaId } from "../lib/googleSheets";
import { ORDEM_DIAS_SEMANA } from "../utils/diasSemana";
import { DiaSemana } from "@prisma/client";

type StatusCelula = "verde" | "amarelo" | "vermelho" | null;

const COR_VERDE = { red: 0.72, green: 0.88, blue: 0.72 };
const COR_AMARELA = { red: 0.99, green: 0.9, blue: 0.6 };
const COR_VERMELHA = { red: 0.96, green: 0.71, blue: 0.71 };
const COR_NEUTRA = { red: 1, green: 1, blue: 1 };

const COLUNA_NOME = 1; // A=RGM, B=Nome
const COLUNAS_FIXAS = 2; // RGM, Nome

const LIMITE_LINHAS_LIMPEZA = 2000;
const LIMITE_COLUNAS_LIMPEZA = 700;

/** Verde = 0 faltas, amarelo = 1-2 faltas, vermelho = 3+ faltas. */
function corPorFaltas(faltas: number): StatusCelula {
  if (faltas === 0) return "verde";
  if (faltas <= 2) return "amarelo";
  return "vermelho";
}

function formatarDataCurta(data: Date): string {
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Reconstroi a planilha de frequencia inteira: uma linha por aluno, e uma
 * coluna por AULA NORMAL JA FINALIZADA (nao por dia da semana fixo) - a
 * cada aula finalizada, uma coluna nova entra a direita com a data dela,
 * preservando o historico completo em vez de sobrescrever a ultima aula
 * do dia. A celula fica verde se o aluno (matriculado naquele dia) marcou
 * presenca nessa aula, vermelha se faltou, e em branco se a aula nao e do
 * dia dele. A celula do NOME reflete o total de faltas acumuladas no dia
 * dele: verde sem faltas, amarela com 1-2, vermelha com 3+.
 */
export async function sincronizarPlanilhaFrequencia(): Promise<void> {
  const spreadsheetId = env.google.planilhaFrequenciaId;
  if (!spreadsheetId) return;

  const usuarios = await prisma.usuario.findMany({
    where: { eAdmin: false },
    orderBy: { nome: "asc" },
  });

  const aulasFinalizadas = await prisma.aula.findMany({
    where: { finalizada: true },
    orderBy: { dataAula: "asc" },
  });

  const presencas = await prisma.presenca.findMany({
    where: { aulaUuid: { in: aulasFinalizadas.map((a) => a.uuid) } },
  });
  const presencaSet = new Set(presencas.map((p) => `${p.aulaUuid}:${p.usuarioUuid}`));

  const totalFinalizadasPorDia = new Map<DiaSemana, number>();
  for (const dia of ORDEM_DIAS_SEMANA) {
    const total = await prisma.aula.count({ where: { diaAula: dia, finalizada: true } });
    totalFinalizadasPorDia.set(dia, total);
  }

  const cabecalho = ["RGM", "Nome", ...aulasFinalizadas.map((a) => formatarDataCurta(a.dataAula))];
  const linhas: string[][] = [cabecalho];
  const statusColunasPorLinha: StatusCelula[][] = [];
  const statusNomePorLinha: StatusCelula[] = [];

  for (const usuario of usuarios) {
    const linha = [usuario.rgm, usuario.nome];
    const statusLinha: StatusCelula[] = [];

    for (const aula of aulasFinalizadas) {
      if (usuario.diaAula !== aula.diaAula) {
        linha.push("");
        statusLinha.push(null);
        continue;
      }

      const presente = presencaSet.has(`${aula.uuid}:${usuario.uuid}`);
      linha.push(formatarDataCurta(aula.dataAula));
      statusLinha.push(presente ? "verde" : "vermelho");
    }

    const totalFinalizadas = usuario.diaAula ? (totalFinalizadasPorDia.get(usuario.diaAula) ?? 0) : 0;
    const faltas = Math.max(0, totalFinalizadas - usuario.frequencia);
    statusNomePorLinha.push(usuario.diaAula ? corPorFaltas(faltas) : null);

    linhas.push(linha);
    statusColunasPorLinha.push(statusLinha);
  }

  const sheetId = await obterPrimeiraAbaId(spreadsheetId);
  // Limpa tudo antes de reescrever: como o numero de colunas agora cresce
  // e encolhe (1 por aula), sem isso colunas/cores antigas ficam presas a
  // direita quando a planilha atual tem menos aulas do que ja teve.
  await limparPlanilha(spreadsheetId, sheetId);
  await escreverValores(spreadsheetId, "A1", linhas);
  await aplicarCores(spreadsheetId, sheetId, statusColunasPorLinha, statusNomePorLinha);
}

async function limparPlanilha(spreadsheetId: string, sheetId: number): Promise<void> {
  await limparValores(spreadsheetId, "A1:ZZ2000");
  await batchUpdate(spreadsheetId, [
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: LIMITE_LINHAS_LIMPEZA,
          startColumnIndex: 0,
          endColumnIndex: LIMITE_COLUNAS_LIMPEZA,
        },
        cell: { userEnteredFormat: { backgroundColor: COR_NEUTRA } },
        fields: "userEnteredFormat.backgroundColor",
      },
    },
  ]);
}

async function aplicarCores(
  spreadsheetId: string,
  sheetId: number,
  statusColunasPorLinha: StatusCelula[][],
  statusNomePorLinha: StatusCelula[],
): Promise<void> {
  if (statusColunasPorLinha.length === 0) return;

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

  statusColunasPorLinha.forEach((statusLinha, indiceLinha) => {
    statusLinha.forEach((status, indiceColuna) => {
      requisitarCor(indiceLinha, indiceColuna + COLUNAS_FIXAS, status);
    });
  });

  statusNomePorLinha.forEach((status, indiceLinha) => {
    requisitarCor(indiceLinha, COLUNA_NOME, status);
  });

  await batchUpdate(spreadsheetId, requests);
}
