import { AppError } from "./appError";
import { parseCsv } from "./csv";

/** Aceita tanto o ID puro quanto o link completo do Google Sheets. */
function extrairSpreadsheetId(entrada: string): string {
  const match = entrada.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : entrada.trim();
}

/**
 * Baixa uma planilha do Google Sheets publica (compartilhada como
 * "Qualquer pessoa com o link pode visualizar") via export CSV, sem
 * precisar de credenciais/conta de servico do Google.
 */
export async function baixarPlanilhaPublicaComoCsv(spreadsheetIdOuUrl: string): Promise<string[][]> {
  const id = extrairSpreadsheetId(spreadsheetIdOuUrl);
  const url = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;

  let resposta: Response;
  try {
    resposta = await fetch(url);
  } catch {
    throw new AppError(400, "Nao foi possivel acessar a planilha. Verifique o ID/link e sua conexao.");
  }

  if (!resposta.ok) {
    throw new AppError(
      400,
      "Nao foi possivel acessar a planilha. Verifique se o ID/link esta correto e se ela esta publica.",
    );
  }

  const contentType = resposta.headers.get("content-type") ?? "";
  if (!contentType.includes("csv")) {
    throw new AppError(
      400,
      'A planilha nao esta publica. No Google Sheets, va em Compartilhar > Acesso geral > "Qualquer pessoa com o link" (Leitor).',
    );
  }

  const texto = await resposta.text();
  return parseCsv(texto);
}
