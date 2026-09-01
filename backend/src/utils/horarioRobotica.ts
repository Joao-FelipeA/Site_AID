import { HorarioRobotica } from "@prisma/client";

export const ORDEM_HORARIOS_ROBOTICA: HorarioRobotica[] = [
  HorarioRobotica.H13,
  HorarioRobotica.H14,
  HorarioRobotica.H15,
  HorarioRobotica.H16,
];

const LABEL_POR_HORARIO: Record<HorarioRobotica, string> = {
  H13: "13:00",
  H14: "14:00",
  H15: "15:00",
  H16: "16:00",
};

export function labelHorarioRobotica(horario: HorarioRobotica): string {
  return LABEL_POR_HORARIO[horario];
}

/** Converte texto livre ("13:00", "13h", "13") pro enum HorarioRobotica. */
export function parseHorarioRobotica(textoOriginal: string): HorarioRobotica {
  const texto = textoOriginal.trim().replace(/[^0-9]/g, "");
  const mapa: Record<string, HorarioRobotica> = {
    "13": HorarioRobotica.H13,
    "1300": HorarioRobotica.H13,
    "14": HorarioRobotica.H14,
    "1400": HorarioRobotica.H14,
    "15": HorarioRobotica.H15,
    "1500": HorarioRobotica.H15,
    "16": HorarioRobotica.H16,
    "1600": HorarioRobotica.H16,
  };

  const horario = mapa[texto];
  if (!horario) {
    throw new Error(`Horario de robotica invalido: "${textoOriginal}". Use 13:00, 14:00, 15:00 ou 16:00.`);
  }
  return horario;
}

/** Converte texto livre ("sim"/"não"/"yes"/vazio) pra booleano de interesse. */
export function parseInteresseRobotica(textoOriginal: string | undefined): boolean {
  if (!textoOriginal) return false;
  const texto = textoOriginal.trim().toLowerCase();
  return texto === "sim" || texto === "yes" || texto === "true" || texto === "1";
}
