import { DiaSemana, HorarioRobotica, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/appError";
import { assinarToken } from "../../lib/jwt";
import { compararSenha, gerarSenhaPadrao, hashSenha } from "../../lib/senha";
import { parseDiaSemana } from "../../utils/diasSemana";
import { parseHorarioRobotica, parseInteresseRobotica } from "../../utils/horarioRobotica";
import { baixarPlanilhaPublicaComoCsv } from "../../lib/planilhaPublica";
import { env } from "../../config/env";
import { alocarDias, ocupacaoVazia, OcupacaoPorDia, ResultadoAlocacaoAluno } from "../../services/alocacaoDias";
import {
  alocarHorariosRobotica,
  ocupacaoRoboticaVazia,
  OcupacaoPorHorario,
  ResultadoAlocacaoRobotica,
} from "../../services/alocacaoRobotica";
import { CriarUsuarioInput, AtualizarUsuarioInput } from "./usuarios.schema";

type ClientOuTx = PrismaClient | Prisma.TransactionClient;

async function obterOcupacaoAtual(client: ClientOuTx, excluirUsuarioUuid?: string): Promise<OcupacaoPorDia> {
  const grupos = await client.usuario.groupBy({
    by: ["diaAula"],
    _count: { _all: true },
    where: {
      diaAula: { not: null },
      ...(excluirUsuarioUuid ? { uuid: { not: excluirUsuarioUuid } } : {}),
    },
  });

  const ocupacao = ocupacaoVazia();
  for (const grupo of grupos) {
    if (grupo.diaAula) ocupacao[grupo.diaAula] = grupo._count._all;
  }
  return ocupacao;
}

async function obterOcupacaoRoboticaAtual(
  client: ClientOuTx,
  excluirUsuarioUuid?: string,
): Promise<OcupacaoPorHorario> {
  const grupos = await client.usuario.groupBy({
    by: ["horarioRobotica"],
    _count: { _all: true },
    where: {
      horarioRobotica: { not: null },
      ...(excluirUsuarioUuid ? { uuid: { not: excluirUsuarioUuid } } : {}),
    },
  });

  const ocupacao = ocupacaoRoboticaVazia();
  for (const grupo of grupos) {
    if (grupo.horarioRobotica) ocupacao[grupo.horarioRobotica] = grupo._count._all;
  }
  return ocupacao;
}

function dadosDoResultadoAlocacao(resultado: ResultadoAlocacaoAluno) {
  return {
    diaPedido1: resultado.diaPedido1,
    diaPedido2: resultado.diaPedido2,
    diaAula: resultado.diaAula,
    origemDiaAula: resultado.origem,
  };
}

function dadosDoResultadoRobotica(resultado: ResultadoAlocacaoRobotica) {
  return {
    interesseRobotica: true,
    horarioRoboticaPedido: resultado.horarioPedido,
    horarioRobotica: resultado.horario,
    origemHorarioRobotica: resultado.origem,
  };
}

export function listarUsuarios() {
  return prisma.usuario.findMany({ orderBy: { nome: "asc" } });
}

export function obterUsuarioPorId(uuid: string) {
  return prisma.usuario.findUniqueOrThrow({ where: { uuid } });
}

export async function criarUsuario(input: CriarUsuarioInput) {
  const senhaPlana = input.senha ?? gerarSenhaPadrao(input.nome, input.rgm);
  const senhaHash = await hashSenha(senhaPlana);

  return prisma.$transaction(async (tx) => {
    let dadosDia: ReturnType<typeof dadosDoResultadoAlocacao> | {} = {};
    if (input.diaPedido1 && input.diaPedido2) {
      const ocupacao = await obterOcupacaoAtual(tx);
      const { resultados } = alocarDias(
        [{ chave: "novo", diaPedido1: input.diaPedido1, diaPedido2: input.diaPedido2 }],
        ocupacao,
        env.capacidadeMaximaPorDia,
      );
      dadosDia = dadosDoResultadoAlocacao(resultados[0]);
    }

    let dadosRobotica: ReturnType<typeof dadosDoResultadoRobotica> | {} = {};
    if (input.interesseRobotica && input.horarioRoboticaPedido) {
      const ocupacaoRobotica = await obterOcupacaoRoboticaAtual(tx);
      const { resultados } = alocarHorariosRobotica(
        [{ chave: "novo", horarioPedido: input.horarioRoboticaPedido }],
        ocupacaoRobotica,
        env.capacidadeMaximaRobotica,
      );
      dadosRobotica = dadosDoResultadoRobotica(resultados[0]);
    }

    const usuario = await tx.usuario.create({
      data: {
        nome: input.nome,
        rgm: input.rgm,
        eAdmin: input.eAdmin,
        senha: senhaHash,
        ...dadosDia,
        ...dadosRobotica,
      },
    });

    return usuario;
  });
}

export async function atualizarUsuario(uuid: string, input: AtualizarUsuarioInput) {
  const data: Prisma.UsuarioUpdateInput = {};
  if (input.nome !== undefined) data.nome = input.nome;
  if (input.rgm !== undefined) data.rgm = input.rgm;
  if (input.eAdmin !== undefined) data.eAdmin = input.eAdmin;
  if (input.senha !== undefined) {
    data.senha = await hashSenha(input.senha);
    // Senha definida por um admin conta como senha temporaria: o usuario
    // precisa trocar de novo no proximo login.
    data.senhaAlterada = false;
  }

  return prisma.usuario.update({ where: { uuid }, data });
}

export async function alterarSenhaPropria(uuid: string, senhaAtual: string, novaSenha: string) {
  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { uuid } });

  const senhaValida = await compararSenha(senhaAtual, usuario.senha);
  if (!senhaValida) {
    throw new AppError(401, "Senha atual incorreta.");
  }

  const senhaHash = await hashSenha(novaSenha);
  return prisma.usuario.update({
    where: { uuid },
    data: { senha: senhaHash, senhaAlterada: true },
  });
}

export function deletarUsuario(uuid: string) {
  return prisma.usuario.delete({ where: { uuid } });
}

/**
 * Registra o pedido de redefinicao de senha (sem enviar email: o sistema
 * nao tem infraestrutura de email). Fica visivel para o admin no painel,
 * que redefine manualmente. Sempre "silencioso": nao revela se o RGM
 * existe ou nao, pra nao vazar quais contas estao cadastradas.
 */
export async function solicitarResetSenha(rgm: string): Promise<void> {
  await prisma.usuario.updateMany({
    where: { rgm: rgm.trim() },
    data: { resetSenhaSolicitado: true, resetSenhaSolicitadoEm: new Date() },
  });
}

/** Admin: redefine a senha do usuario de volta pro padrao (3 letras do nome + 4 digitos do RGM). */
export async function resetarSenhaParaPadrao(uuid: string) {
  const usuarioAtual = await prisma.usuario.findUniqueOrThrow({ where: { uuid } });
  const senhaPlana = gerarSenhaPadrao(usuarioAtual.nome, usuarioAtual.rgm);
  const senhaHash = await hashSenha(senhaPlana);

  const usuario = await prisma.usuario.update({
    where: { uuid },
    data: {
      senha: senhaHash,
      senhaAlterada: false,
      resetSenhaSolicitado: false,
      resetSenhaSolicitadoEm: null,
    },
  });

  return { usuario, senhaPlana };
}

/**
 * Troca o dia de aula do usuario: libera o dia atual dele (se tiver) antes
 * de recalcular a ocupacao, tenta a 1a opcao pedida, depois a 2a, e realoca
 * pra outro dia se nenhuma das duas tiver vaga.
 */
export async function substituirDiaAula(uuid: string, diaPedido1: DiaSemana, diaPedido2: DiaSemana) {
  return prisma.$transaction(async (tx) => {
    const ocupacao = await obterOcupacaoAtual(tx, uuid);
    const { resultados } = alocarDias(
      [{ chave: uuid, diaPedido1, diaPedido2 }],
      ocupacao,
      env.capacidadeMaximaPorDia,
    );

    const usuario = await tx.usuario.update({
      where: { uuid },
      data: dadosDoResultadoAlocacao(resultados[0]),
    });

    return { usuario, resultado: resultados[0] };
  });
}

/**
 * Define/troca o interesse e horario de robotica do usuario. Se
 * `interesse` for false, limpa tudo (aluno sai da robotica). Se true,
 * libera o horario atual dele (se tiver) antes de recalcular a ocupacao e
 * tenta o horario pedido, realocando se estiver cheio.
 */
export async function substituirRobotica(uuid: string, interesse: boolean, horarioPedido: HorarioRobotica | null) {
  return prisma.$transaction(async (tx) => {
    if (!interesse || !horarioPedido) {
      const usuario = await tx.usuario.update({
        where: { uuid },
        data: {
          interesseRobotica: false,
          horarioRoboticaPedido: null,
          horarioRobotica: null,
          origemHorarioRobotica: null,
        },
      });
      return { usuario, resultado: null };
    }

    const ocupacao = await obterOcupacaoRoboticaAtual(tx, uuid);
    const { resultados } = alocarHorariosRobotica([{ chave: uuid, horarioPedido }], ocupacao, env.capacidadeMaximaRobotica);

    const usuario = await tx.usuario.update({
      where: { uuid },
      data: dadosDoResultadoRobotica(resultados[0]),
    });

    return { usuario, resultado: resultados[0] };
  });
}

export async function login(rgm: string, senhaPlana: string) {
  const usuario = await prisma.usuario.findUnique({ where: { rgm: rgm.trim() } });
  if (!usuario) {
    throw new AppError(401, "Credenciais invalidas.");
  }

  const senhaValida = await compararSenha(senhaPlana, usuario.senha);
  if (!senhaValida) {
    throw new AppError(401, "Credenciais invalidas.");
  }

  const token = assinarToken({ sub: usuario.uuid, eAdmin: usuario.eAdmin });
  return { token, usuario };
}

export interface LinhaImportacaoInvalida {
  linha: number;
  motivo: string;
}

export interface RelatorioImportacaoUsuario {
  nome: string;
  rgm: string;
  diaPedido1: DiaSemana;
  diaPedido2: DiaSemana;
  diaAula: DiaSemana | null;
  origem: string | null;
  interesseRobotica: boolean;
  horarioRobotica: HorarioRobotica | null;
  origemRobotica: string | null;
}

export interface ResultadoImportacao {
  totalNaPlanilha: number;
  totalApagados: number;
  totalImportadosAgora: number;
  relatorio: RelatorioImportacaoUsuario[];
  linhasInvalidas: LinhaImportacaoInvalida[];
}

/**
 * Le uma planilha publica do Google Sheets (colunas Nome | RGM | Dia1 |
 * Dia2 | InteresseRobotica | HorarioRobotica, a partir da linha 2) via
 * export CSV publico, e SUBSTITUI TODOS os alunos (nao-admin) pelos da
 * planilha: apaga todos e cria novos, alocando cada um em 1 dia final
 * (tenta Dia1, depois Dia2, ou realoca) e, se houver interesse em
 * robotica, em 1 horario final tambem. As 2 ultimas colunas sao opcionais:
 * se ausentes ou invalidas, o aluno e importado normalmente, so sem
 * robotica. Contas de administrador nao sao afetadas.
 */
export async function importarUsuariosDaPlanilha(spreadsheetIdOuUrl: string): Promise<ResultadoImportacao> {
  const todasLinhas = await baixarPlanilhaPublicaComoCsv(spreadsheetIdOuUrl);
  const linhas = todasLinhas.slice(1); // pula o cabecalho

  const novos: {
    nome: string;
    rgm: string;
    diaPedido1: DiaSemana;
    diaPedido2: DiaSemana;
    horarioRoboticaPedido: HorarioRobotica | null;
  }[] = [];
  const linhasInvalidas: LinhaImportacaoInvalida[] = [];
  const rgmsVistos = new Set<string>();
  let totalPreenchidas = 0;

  linhas.forEach((linha, index) => {
    const [nome, rgm, dia1Texto, dia2Texto, interesseRoboticaTexto, horarioRoboticaTexto] = linha;
    if (!nome?.trim() && !rgm?.trim()) return; // linha em branco

    totalPreenchidas += 1;
    const numeroLinha = index + 2;

    if (!nome?.trim() || !rgm?.trim() || !dia1Texto?.trim() || !dia2Texto?.trim()) {
      linhasInvalidas.push({ linha: numeroLinha, motivo: "Colunas obrigatorias ausentes (Nome, RGM, Dia1, Dia2)." });
      return;
    }

    const rgmLimpo = rgm.trim();

    if (rgmsVistos.has(rgmLimpo)) {
      linhasInvalidas.push({ linha: numeroLinha, motivo: "RGM duplicado dentro da propria planilha." });
      return;
    }

    try {
      const diaPedido1 = parseDiaSemana(dia1Texto);
      const diaPedido2 = parseDiaSemana(dia2Texto);
      if (diaPedido1 === DiaSemana.SEXTA || diaPedido2 === DiaSemana.SEXTA) {
        throw new Error("Sexta-feira e exclusiva para robotica, nao esta mais disponivel para aula normal.");
      }
      if (diaPedido1 === diaPedido2) {
        throw new Error("A 1a e a 2a opcao de dia devem ser diferentes.");
      }

      // Robotica e opcional e best-effort: se o texto vier ausente ou
      // invalido, o aluno e importado do mesmo jeito, so sem robotica.
      let horarioRoboticaPedido: HorarioRobotica | null = null;
      if (parseInteresseRobotica(interesseRoboticaTexto)) {
        try {
          horarioRoboticaPedido = parseHorarioRobotica(horarioRoboticaTexto ?? "");
        } catch {
          horarioRoboticaPedido = null;
        }
      }

      rgmsVistos.add(rgmLimpo);
      novos.push({ nome: nome.trim(), rgm: rgmLimpo, diaPedido1, diaPedido2, horarioRoboticaPedido });
    } catch (erro) {
      linhasInvalidas.push({ linha: numeroLinha, motivo: (erro as Error).message });
    }
  });

  const { resultados } = alocarDias(
    novos.map((n) => ({ chave: n.rgm, diaPedido1: n.diaPedido1, diaPedido2: n.diaPedido2 })),
    ocupacaoVazia(),
    env.capacidadeMaximaPorDia,
  );
  const resultadoPorRgm = new Map(resultados.map((r) => [r.chave, r]));

  const interessadosRobotica = novos.filter((n) => n.horarioRoboticaPedido);
  const { resultados: resultadosRobotica } = alocarHorariosRobotica(
    interessadosRobotica.map((n) => ({ chave: n.rgm, horarioPedido: n.horarioRoboticaPedido as HorarioRobotica })),
    ocupacaoRoboticaVazia(),
    env.capacidadeMaximaRobotica,
  );
  const resultadoRoboticaPorRgm = new Map(resultadosRobotica.map((r) => [r.chave, r]));

  const relatorio: RelatorioImportacaoUsuario[] = [];

  const totalApagados = await prisma.$transaction(async (tx) => {
    const apagados = await tx.usuario.deleteMany({ where: { eAdmin: false } });

    for (const novo of novos) {
      const senhaHash = await hashSenha(gerarSenhaPadrao(novo.nome, novo.rgm));
      const resultado = resultadoPorRgm.get(novo.rgm);
      const resultadoRobotica = resultadoRoboticaPorRgm.get(novo.rgm);

      await tx.usuario.create({
        data: {
          nome: novo.nome,
          rgm: novo.rgm,
          senha: senhaHash,
          ...(resultado ? dadosDoResultadoAlocacao(resultado) : {}),
          ...(resultadoRobotica ? dadosDoResultadoRobotica(resultadoRobotica) : {}),
        },
      });

      relatorio.push({
        nome: novo.nome,
        rgm: novo.rgm,
        diaPedido1: novo.diaPedido1,
        diaPedido2: novo.diaPedido2,
        diaAula: resultado?.diaAula ?? null,
        origem: resultado?.origem ?? null,
        interesseRobotica: !!novo.horarioRoboticaPedido,
        horarioRobotica: resultadoRobotica?.horario ?? null,
        origemRobotica: resultadoRobotica?.origem ?? null,
      });
    }

    return apagados.count;
  });

  return {
    totalNaPlanilha: totalPreenchidas,
    totalApagados,
    totalImportadosAgora: novos.length,
    relatorio,
    linhasInvalidas,
  };
}
