import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { escreverValores } from "../lib/googleSheets";

/**
 * Reconstroi a planilha de doacoes: uma linha por doador com Nome, Contato
 * e todos os materiais doados por ele concatenados em uma celula.
 */
export async function sincronizarPlanilhaDoacoes(): Promise<void> {
  const spreadsheetId = env.google.planilhaDoacoesId;
  if (!spreadsheetId) return;

  const doacoes = await prisma.doacao.findMany({
    include: { materiais: true },
    orderBy: { dtaCriacao: "asc" },
  });

  const cabecalho = ["Nome", "Contato", "Materiais Doados"];
  const linhas = [
    cabecalho,
    ...doacoes.map((doacao) => [
      doacao.nome,
      doacao.contato,
      doacao.materiais.map((m) => m.materialDoado).join("; "),
    ]),
  ];

  await escreverValores(spreadsheetId, "A1", linhas);
}
