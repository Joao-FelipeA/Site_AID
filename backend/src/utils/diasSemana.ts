import { DiaSemana } from "@prisma/client";

// Sexta-feira nao entra mais aqui: virou dia exclusivo da robotica, entao
// nao faz parte do pool de dias pra matricula/realocacao de aula normal
// nem das colunas da planilha de frequencia normal.
export const ORDEM_DIAS_SEMANA: DiaSemana[] = [
  DiaSemana.SEGUNDA,
  DiaSemana.TERCA,
  DiaSemana.QUARTA,
  DiaSemana.QUINTA,
];

const LABEL_POR_DIA: Record<DiaSemana, string> = {
  SEGUNDA: "Segunda-Feira",
  TERCA: "Terça-Feira",
  QUARTA: "Quarta-Feira",
  QUINTA: "Quinta-Feira",
  SEXTA: "Sexta-Feira",
};

export function labelDiaSemana(dia: DiaSemana): string {
  return LABEL_POR_DIA[dia];
}

function removerAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Converte texto livre vindo da planilha ("Terca-feira", "terca", "TER")
 * para o enum DiaSemana. Lanca erro descritivo se nao reconhecer.
 */
export function parseDiaSemana(textoOriginal: string): DiaSemana {
  const texto = removerAcentos(textoOriginal.trim().toLowerCase());

  if (texto.startsWith("seg")) return DiaSemana.SEGUNDA;
  if (texto.startsWith("ter")) return DiaSemana.TERCA;
  if (texto.startsWith("qua")) return DiaSemana.QUARTA;
  if (texto.startsWith("qui")) return DiaSemana.QUINTA;
  if (texto.startsWith("sex")) return DiaSemana.SEXTA;

  throw new Error(`Dia da semana invalido: "${textoOriginal}". Use Segunda a Sexta.`);
}

const JS_WEEKDAY_PARA_DIA_SEMANA: Record<number, DiaSemana | null> = {
  0: null, // domingo
  1: DiaSemana.SEGUNDA,
  2: DiaSemana.TERCA,
  3: DiaSemana.QUARTA,
  4: DiaSemana.QUINTA,
  5: DiaSemana.SEXTA,
  6: null, // sabado
};

/** Deriva o DiaSemana a partir de uma data de calendario (deve ser dia util Seg-Sex). */
export function diaSemanaDaData(data: Date): DiaSemana {
  const dia = JS_WEEKDAY_PARA_DIA_SEMANA[data.getDay()];
  if (!dia) {
    throw new Error("Data_aula deve cair em um dia util (Segunda a Sexta).");
  }
  return dia;
}
