import { z } from "zod";
import { HorarioRobotica } from "@prisma/client";

export const criarAulaRoboticaSchema = z.object({
  dataAula: z.string().datetime({ message: "dataAula deve ser uma data ISO valida." }),
  horario: z.nativeEnum(HorarioRobotica),
});
export type CriarAulaRoboticaInput = z.infer<typeof criarAulaRoboticaSchema>;

export const atualizarAulaRoboticaSchema = z.object({
  dataAula: z.string().datetime({ message: "dataAula deve ser uma data ISO valida." }),
});
export type AtualizarAulaRoboticaInput = z.infer<typeof atualizarAulaRoboticaSchema>;

export const marcarPresencaRoboticaSchema = z.object({
  token: z.string().min(1, "token e obrigatorio."),
});
export type MarcarPresencaRoboticaInput = z.infer<typeof marcarPresencaRoboticaSchema>;

export const definirPresencaRoboticaAdminSchema = z.object({
  usuarioUuid: z.string().uuid("usuarioUuid deve ser um uuid valido."),
  presente: z.boolean(),
});
export type DefinirPresencaRoboticaAdminInput = z.infer<typeof definirPresencaRoboticaAdminSchema>;
