import type { DiaSemana, OrigemDiaAula } from "./types";

// Sexta-feira e exclusiva pra robotica: nao entra mais nas opcoes de dia
// de aula normal (so aparece se um registro antigo ainda tiver ela, via
// labelDiaSemana).
export const ORDEM_DIAS_SEMANA: DiaSemana[] = ["SEGUNDA", "TERCA", "QUARTA", "QUINTA"];

const LABEL_DIA_SEMANA: Record<DiaSemana, string> = {
  SEGUNDA: "Segunda-Feira",
  TERCA: "Terça-Feira",
  QUARTA: "Quarta-Feira",
  QUINTA: "Quinta-Feira",
  SEXTA: "Sexta-Feira",
};

export function labelDiaSemana(dia: DiaSemana | string): string {
  return LABEL_DIA_SEMANA[dia as DiaSemana] ?? dia;
}

const LABEL_ORIGEM_DIA_AULA: Record<OrigemDiaAula, string> = {
  PRIMEIRA_OPCAO: "1ª opção",
  SEGUNDA_OPCAO: "2ª opção",
  REALOCADO: "realocado",
};

export function labelOrigemDiaAula(origem: OrigemDiaAula | string | null): string {
  if (!origem) return "";
  return LABEL_ORIGEM_DIA_AULA[origem as OrigemDiaAula] ?? origem;
}

export function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function hojeISO(): string {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}
