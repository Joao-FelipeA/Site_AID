import { z } from "zod";

export const criarDoacaoSchema = z.object({
  nome: z.string().trim().min(1, "Nome e obrigatorio."),
  contato: z.string().trim().min(1, "Contato e obrigatorio."),
  materiais: z.array(z.string().trim().min(1)).default([]),
});
export type CriarDoacaoInput = z.infer<typeof criarDoacaoSchema>;

export const atualizarDoacaoSchema = z.object({
  nome: z.string().trim().min(1).optional(),
  contato: z.string().trim().min(1).optional(),
});
export type AtualizarDoacaoInput = z.infer<typeof atualizarDoacaoSchema>;

export const criarMaterialSchema = z.object({
  materialDoado: z.string().trim().min(1, "materialDoado e obrigatorio."),
});
export type CriarMaterialInput = z.infer<typeof criarMaterialSchema>;
