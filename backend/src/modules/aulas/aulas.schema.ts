import { z } from "zod";

export const criarAulaSchema = z.object({
  dataAula: z.string().datetime({ message: "dataAula deve ser uma data ISO valida." }),
});
export type CriarAulaInput = z.infer<typeof criarAulaSchema>;

export const atualizarAulaSchema = z.object({
  dataAula: z.string().datetime({ message: "dataAula deve ser uma data ISO valida." }),
});
export type AtualizarAulaInput = z.infer<typeof atualizarAulaSchema>;

export const marcarPresencaSchema = z.object({
  token: z.string().min(1, "token e obrigatorio."),
});
export type MarcarPresencaInput = z.infer<typeof marcarPresencaSchema>;
