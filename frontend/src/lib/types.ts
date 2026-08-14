export type DiaSemana = "SEGUNDA" | "TERCA" | "QUARTA" | "QUINTA" | "SEXTA";

export type OrigemDiaAula = "PRIMEIRA_OPCAO" | "SEGUNDA_OPCAO" | "REALOCADO";

export interface Usuario {
  uuid: string;
  nome: string;
  email: string;
  rgm: string;
  senhaAlterada: boolean;
  resetSenhaSolicitado: boolean;
  resetSenhaSolicitadoEm: string | null;
  diaPedido1: DiaSemana | null;
  diaPedido2: DiaSemana | null;
  diaAula: DiaSemana | null;
  origemDiaAula: OrigemDiaAula | null;
  frequencia: number;
  eAdmin: boolean;
  dtaCriacao: string;
  dtaAtualizacao: string;
}

export interface Aula {
  uuid: string;
  dataAula: string;
  diaAula: DiaSemana;
  qrCodePresenca: string;
  qtdAluno: number;
  qtdPresenca: number;
  finalizada: boolean;
  dtaCriacao: string;
  dtaAtualizacao: string;
}

export interface Presenca {
  uuid: string;
  aulaUuid: string;
  usuarioUuid: string;
  marcadoEm: string;
  usuario: Usuario;
}

export interface AulaComPresencas extends Aula {
  presencas: Presenca[];
}

export interface MaterialDoado {
  uuid: string;
  doacaoUuid: string;
  materialDoado: string;
  dtaCriacao: string;
}

export interface Doacao {
  uuid: string;
  nome: string;
  contato: string;
  dtaCriacao: string;
  materiais: MaterialDoado[];
}

export interface ResultadoAlocacaoAluno {
  diaPedido1: DiaSemana;
  diaPedido2: DiaSemana;
  diaAula: DiaSemana | null;
  origem: OrigemDiaAula | null;
}

export interface RelatorioImportacaoUsuario {
  nome: string;
  email: string;
  rgm: string;
  diaPedido1: DiaSemana;
  diaPedido2: DiaSemana;
  diaAula: DiaSemana | null;
  origem: OrigemDiaAula | null;
}

export interface LinhaImportacaoInvalida {
  linha: number;
  motivo: string;
}

export interface ResultadoImportacao {
  totalNaPlanilha: number;
  totalApagados: number;
  totalImportadosAgora: number;
  relatorio: RelatorioImportacaoUsuario[];
  linhasInvalidas: LinhaImportacaoInvalida[];
}
