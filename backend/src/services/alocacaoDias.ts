import { DiaSemana, OrigemDiaAula } from "@prisma/client";
import { ORDEM_DIAS_SEMANA } from "../utils/diasSemana";

export interface PedidoAlocacao {
  /** Identificador do aluno dentro da leva de importacao (ex: RGM). */
  chave: string;
  diaPedido1: DiaSemana;
  diaPedido2: DiaSemana;
}

export interface ResultadoAlocacaoAluno {
  chave: string;
  diaPedido1: DiaSemana;
  diaPedido2: DiaSemana;
  /** null quando nenhum dia (Seg-Sex) tinha vaga para esse aluno. */
  diaAula: DiaSemana | null;
  origem: OrigemDiaAula | null;
}

export type OcupacaoPorDia = Record<DiaSemana, number>;

export function ocupacaoVazia(): OcupacaoPorDia {
  return {
    SEGUNDA: 0,
    TERCA: 0,
    QUARTA: 0,
    QUINTA: 0,
    SEXTA: 0,
  };
}

function diaComMaisVagas(ocupacao: OcupacaoPorDia, capacidade: number): DiaSemana | null {
  let melhorDia: DiaSemana | null = null;
  let melhorVagas = 0;

  for (const dia of ORDEM_DIAS_SEMANA) {
    const vagas = capacidade - ocupacao[dia];
    if (vagas > melhorVagas) {
      melhorDia = dia;
      melhorVagas = vagas;
    }
  }

  return melhorDia;
}

/**
 * Aloca cada aluno em UM UNICO dia final (Seg-Sex), respeitando a
 * capacidade maxima por dia, processando na ordem recebida (equivale a
 * ordem da planilha, ou seja FCFS). Tenta a 1a opcao pedida; se estiver
 * cheia, tenta a 2a opcao; se as duas estiverem cheias, realoca para o dia
 * com mais vagas disponiveis entre Seg-Sex. Se nenhum dia tiver vaga
 * (capacidade total esgotada), diaAula fica null e deve ser reportado ao
 * admin.
 */
export function alocarDias(
  pedidos: PedidoAlocacao[],
  ocupacaoInicial: OcupacaoPorDia,
  capacidadeMaximaPorDia: number,
): { resultados: ResultadoAlocacaoAluno[]; ocupacaoFinal: OcupacaoPorDia } {
  const ocupacao: OcupacaoPorDia = { ...ocupacaoInicial };
  const resultados: ResultadoAlocacaoAluno[] = [];

  for (const pedido of pedidos) {
    let diaAula: DiaSemana | null = null;
    let origem: OrigemDiaAula | null = null;

    if (ocupacao[pedido.diaPedido1] < capacidadeMaximaPorDia) {
      diaAula = pedido.diaPedido1;
      origem = OrigemDiaAula.PRIMEIRA_OPCAO;
    } else if (ocupacao[pedido.diaPedido2] < capacidadeMaximaPorDia) {
      diaAula = pedido.diaPedido2;
      origem = OrigemDiaAula.SEGUNDA_OPCAO;
    } else {
      const alternativa = diaComMaisVagas(ocupacao, capacidadeMaximaPorDia);
      if (alternativa) {
        diaAula = alternativa;
        origem = OrigemDiaAula.REALOCADO;
      }
    }

    if (diaAula) {
      ocupacao[diaAula] += 1;
    }

    resultados.push({
      chave: pedido.chave,
      diaPedido1: pedido.diaPedido1,
      diaPedido2: pedido.diaPedido2,
      diaAula,
      origem,
    });
  }

  return { resultados, ocupacaoFinal: ocupacao };
}
