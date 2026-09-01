import { HorarioRobotica, OrigemHorarioRobotica } from "@prisma/client";
import { ORDEM_HORARIOS_ROBOTICA } from "../utils/horarioRobotica";

export interface PedidoAlocacaoRobotica {
  /** Identificador do aluno dentro da leva de importacao (ex: RGM). */
  chave: string;
  horarioPedido: HorarioRobotica;
}

export interface ResultadoAlocacaoRobotica {
  chave: string;
  horarioPedido: HorarioRobotica;
  /** null quando nenhum horario tinha vaga. */
  horario: HorarioRobotica | null;
  origem: OrigemHorarioRobotica | null;
}

export type OcupacaoPorHorario = Record<HorarioRobotica, number>;

export function ocupacaoRoboticaVazia(): OcupacaoPorHorario {
  return { H13: 0, H14: 0, H15: 0, H16: 0 };
}

function horarioComMaisVagas(ocupacao: OcupacaoPorHorario, capacidade: number): HorarioRobotica | null {
  let melhorHorario: HorarioRobotica | null = null;
  let melhorVagas = 0;

  for (const horario of ORDEM_HORARIOS_ROBOTICA) {
    const vagas = capacidade - ocupacao[horario];
    if (vagas > melhorVagas) {
      melhorHorario = horario;
      melhorVagas = vagas;
    }
  }

  return melhorHorario;
}

/**
 * Aloca cada aluno no horario de robotica pedido (1 preferencia so, sem 2a
 * opcao). Se o horario pedido estiver cheio, realoca pro horario com mais
 * vagas disponiveis entre os 4. Se todos estiverem cheios, horario fica
 * null e deve ser reportado ao admin.
 */
export function alocarHorariosRobotica(
  pedidos: PedidoAlocacaoRobotica[],
  ocupacaoInicial: OcupacaoPorHorario,
  capacidadeMaximaPorHorario: number,
): { resultados: ResultadoAlocacaoRobotica[]; ocupacaoFinal: OcupacaoPorHorario } {
  const ocupacao: OcupacaoPorHorario = { ...ocupacaoInicial };
  const resultados: ResultadoAlocacaoRobotica[] = [];

  for (const pedido of pedidos) {
    let horario: HorarioRobotica | null = null;
    let origem: OrigemHorarioRobotica | null = null;

    if (ocupacao[pedido.horarioPedido] < capacidadeMaximaPorHorario) {
      horario = pedido.horarioPedido;
      origem = OrigemHorarioRobotica.PEDIDO;
    } else {
      const alternativa = horarioComMaisVagas(ocupacao, capacidadeMaximaPorHorario);
      if (alternativa) {
        horario = alternativa;
        origem = OrigemHorarioRobotica.REALOCADO;
      }
    }

    if (horario) {
      ocupacao[horario] += 1;
    }

    resultados.push({ chave: pedido.chave, horarioPedido: pedido.horarioPedido, horario, origem });
  }

  return { resultados, ocupacaoFinal: ocupacao };
}
