import { z } from "zod";
import { DiaSemana, HorarioRobotica } from "@prisma/client";

const diaSemanaEnum = z.nativeEnum(DiaSemana);
const horarioRoboticaEnum = z.nativeEnum(HorarioRobotica);

/** Sexta-feira e exclusiva pra robotica: nao e mais uma opcao valida pra aula normal. */
const diaUtilRegularEnum = diaSemanaEnum.refine((dia) => dia !== DiaSemana.SEXTA, {
  message: "Sexta-feira e exclusiva para robotica, nao esta mais disponivel para aula normal.",
});

const doisDiasPedidosSchema = z
  .object({
    diaPedido1: diaUtilRegularEnum,
    diaPedido2: diaUtilRegularEnum,
  })
  .refine((dias) => dias.diaPedido1 !== dias.diaPedido2, {
    message: "A 1a e a 2a opcao de dia devem ser diferentes.",
    path: ["diaPedido2"],
  });

export const criarUsuarioSchema = z
  .object({
    nome: z.string().trim().min(1, "Nome e obrigatorio."),
    rgm: z.string().trim().min(1, "RGM e obrigatorio."),
    eAdmin: z.boolean().optional().default(false),
    /** Se omitido, a senha padrao (3 letras do nome + 4 digitos do RGM) e usada. */
    senha: z.string().min(4).optional(),
    diaPedido1: diaUtilRegularEnum.optional(),
    diaPedido2: diaUtilRegularEnum.optional(),
    interesseRobotica: z.boolean().optional().default(false),
    horarioRoboticaPedido: horarioRoboticaEnum.optional(),
  })
  .refine((dados) => !dados.diaPedido1 === !dados.diaPedido2, {
    message: "Informe as 2 opcoes de dia, ou nenhuma.",
    path: ["diaPedido2"],
  })
  .refine((dados) => !dados.diaPedido1 || dados.diaPedido1 !== dados.diaPedido2, {
    message: "A 1a e a 2a opcao de dia devem ser diferentes.",
    path: ["diaPedido2"],
  })
  .refine((dados) => !dados.interesseRobotica || !!dados.horarioRoboticaPedido, {
    message: "Informe o horario de robotica pedido quando houver interesse.",
    path: ["horarioRoboticaPedido"],
  });
export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>;

export const atualizarUsuarioSchema = z.object({
  nome: z.string().trim().min(1).optional(),
  rgm: z.string().trim().min(1).optional(),
  eAdmin: z.boolean().optional(),
  senha: z.string().min(4).optional(),
});
export type AtualizarUsuarioInput = z.infer<typeof atualizarUsuarioSchema>;

export const substituirDiaAulaSchema = doisDiasPedidosSchema;
export type SubstituirDiaAulaInput = z.infer<typeof substituirDiaAulaSchema>;

export const substituirRoboticaSchema = z
  .object({
    interesse: z.boolean(),
    horarioPedido: horarioRoboticaEnum.optional(),
  })
  .refine((dados) => !dados.interesse || !!dados.horarioPedido, {
    message: "Informe o horario pedido quando houver interesse na robotica.",
    path: ["horarioPedido"],
  });
export type SubstituirRoboticaInput = z.infer<typeof substituirRoboticaSchema>;

export const loginSchema = z.object({
  rgm: z.string().trim().min(1, "RGM e obrigatorio."),
  senha: z.string().min(1, "Senha e obrigatoria."),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const alterarSenhaSchema = z.object({
  senhaAtual: z.string().min(1, "Senha atual e obrigatoria."),
  novaSenha: z.string().min(4, "Nova senha deve ter pelo menos 4 caracteres."),
});
export type AlterarSenhaInput = z.infer<typeof alterarSenhaSchema>;

export const esqueciSenhaSchema = z.object({
  rgm: z.string().trim().min(1, "RGM e obrigatorio."),
});
export type EsqueciSenhaInput = z.infer<typeof esqueciSenhaSchema>;

export const importarUsuariosSchema = z.object({
  spreadsheetIdOuUrl: z.string().trim().min(1, "Informe o ID ou o link da planilha."),
});
export type ImportarUsuariosInput = z.infer<typeof importarUsuariosSchema>;
