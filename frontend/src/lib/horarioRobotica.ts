import type { HorarioRobotica, OrigemHorarioRobotica } from "./types";

export const ORDEM_HORARIOS_ROBOTICA: HorarioRobotica[] = ["H13", "H14", "H15", "H16"];

const LABEL_HORARIO: Record<HorarioRobotica, string> = {
  H13: "13:00",
  H14: "14:00",
  H15: "15:00",
  H16: "16:00",
};

export function labelHorarioRobotica(horario: HorarioRobotica | string): string {
  return LABEL_HORARIO[horario as HorarioRobotica] ?? horario;
}

const LABEL_ORIGEM_ROBOTICA: Record<OrigemHorarioRobotica, string> = {
  PEDIDO: "horário pedido",
  REALOCADO: "realocado",
};

export function labelOrigemRobotica(origem: OrigemHorarioRobotica | string | null): string {
  if (!origem) return "";
  return LABEL_ORIGEM_ROBOTICA[origem as OrigemHorarioRobotica] ?? origem;
}

/** Proxima sexta-feira (hoje incluso) no formato yyyy-mm-dd, pra pre-preencher o campo de data. */
export function proximaSextaISO(): string {
  const agora = new Date();
  const diasAteSexta = (5 - agora.getDay() + 7) % 7;
  agora.setDate(agora.getDate() + diasAteSexta);
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}
