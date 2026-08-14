import { google, sheets_v4 } from "googleapis";
import { env } from "../config/env";

let clientePromise: Promise<sheets_v4.Sheets> | null = null;

function obterCliente(): Promise<sheets_v4.Sheets> {
  if (!clientePromise) {
    const auth = new google.auth.JWT({
      email: env.google.clientEmail,
      key: env.google.privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      // gaxios (usado por baixo) so usa o fetch nativo do Node se detectar
      // `window.fetch`; fora disso cai pro node-fetch, cujo stream de gzip
      // quebra com "Premature close" em certas redes. Forcar o fetch nativo
      // aqui evita esse bug sem depender de deteccao de ambiente.
      transporterOptions: { fetchImplementation: fetch },
    });
    clientePromise = Promise.resolve(google.sheets({ version: "v4", auth }));
  }
  return clientePromise;
}

export async function escreverValores(
  spreadsheetId: string,
  range: string,
  valores: (string | number)[][],
): Promise<void> {
  const sheets = await obterCliente();
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values: valores },
  });
}

export async function anexarValores(
  spreadsheetId: string,
  range: string,
  valores: (string | number)[][],
): Promise<void> {
  const sheets = await obterCliente();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: valores },
  });
}

export async function batchUpdate(
  spreadsheetId: string,
  requests: sheets_v4.Schema$Request[],
): Promise<void> {
  if (requests.length === 0) return;
  const sheets = await obterCliente();
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests },
  });
}

export async function obterPrimeiraAbaId(spreadsheetId: string): Promise<number> {
  const sheets = await obterCliente();
  const resposta = await sheets.spreadsheets.get({ spreadsheetId });
  const primeiraAba = resposta.data.sheets?.[0]?.properties?.sheetId;
  if (primeiraAba === undefined || primeiraAba === null) {
    throw new Error("Nao foi possivel localizar a aba da planilha.");
  }
  return primeiraAba;
}
