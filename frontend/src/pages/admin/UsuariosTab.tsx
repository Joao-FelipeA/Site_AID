import { useMemo, useState, type FormEvent } from "react";
import { Modal } from "../../components/Modal";
import { SelectDiaSemana } from "../../components/SelectDiaSemana";
import { SelectHorarioRobotica } from "../../components/SelectHorarioRobotica";
import { api, ApiError } from "../../lib/api";
import { ORDEM_DIAS_SEMANA, formatarData, labelDiaSemana, labelOrigemDiaAula } from "../../lib/diasSemana";
import { ORDEM_HORARIOS_ROBOTICA, labelHorarioRobotica, labelOrigemRobotica } from "../../lib/horarioRobotica";
import type {
  DiaSemana,
  HorarioRobotica,
  ResultadoAlocacaoAluno,
  ResultadoAlocacaoRobotica,
  ResultadoImportacao,
  Usuario,
} from "../../lib/types";
import type { MostrarMensagem } from "./AdminDashboard";

interface Props {
  usuarios: Usuario[];
  recarregar: () => Promise<void>;
  mostrarMensagem: MostrarMensagem;
}

type EstadoModal =
  | { tipo: "fechado" }
  | { tipo: "novo" }
  | { tipo: "editar"; usuario: Usuario }
  | { tipo: "trocar-dias"; usuario: Usuario }
  | { tipo: "robotica"; usuario: Usuario }
  | { tipo: "importar" }
  | { tipo: "relatorio-importacao"; resultado: ResultadoImportacao };

type ColunaOrdenacao = "dia" | "robotica";

function indiceOrdenacao(usuario: Usuario, coluna: ColunaOrdenacao): number {
  if (coluna === "dia") {
    const indice = usuario.diaAula ? ORDEM_DIAS_SEMANA.indexOf(usuario.diaAula) : -1;
    return indice === -1 ? Number.POSITIVE_INFINITY : indice;
  }
  const indice =
    usuario.interesseRobotica && usuario.horarioRobotica
      ? ORDEM_HORARIOS_ROBOTICA.indexOf(usuario.horarioRobotica)
      : -1;
  return indice === -1 ? Number.POSITIVE_INFINITY : indice;
}

export function UsuariosTab({ usuarios, recarregar, mostrarMensagem }: Props) {
  const [modal, setModal] = useState<EstadoModal>({ tipo: "fechado" });
  const [ordenarPor, setOrdenarPor] = useState<ColunaOrdenacao | null>(null);
  const [ordemAscendente, setOrdemAscendente] = useState(true);

  function alternarOrdenacao(coluna: ColunaOrdenacao) {
    if (ordenarPor === coluna) {
      setOrdemAscendente((atual) => !atual);
    } else {
      setOrdenarPor(coluna);
      setOrdemAscendente(true);
    }
  }

  const usuariosOrdenados = useMemo(() => {
    const copia = [...usuarios];
    copia.sort((a, b) => {
      // Admins sempre no topo, independente da ordenacao de coluna escolhida.
      const diferencaAdmin = Number(b.eAdmin) - Number(a.eAdmin);
      if (diferencaAdmin !== 0) return diferencaAdmin;
      if (!ordenarPor) return 0;
      const diferenca = indiceOrdenacao(a, ordenarPor) - indiceOrdenacao(b, ordenarPor);
      return ordemAscendente ? diferenca : -diferenca;
    });
    return copia;
  }, [usuarios, ordenarPor, ordemAscendente]);

  async function resetarSenha(usuario: Usuario) {
    if (!confirm(`Redefinir a senha de ${usuario.nome} para a senha padrão (3 letras do nome + RGM)?`)) return;
    try {
      const resultado = await api.post<{ usuario: Usuario; senhaPlana: string }>(
        `/usuarios/${usuario.uuid}/resetar-senha`,
      );
      await recarregar();
      mostrarMensagem(
        `Senha de ${usuario.nome} redefinida para "${resultado.senhaPlana}". Informe o aluno pessoalmente.`,
        "sucesso",
      );
    } catch (e) {
      mostrarMensagem(e instanceof ApiError ? e.message : "Falha ao redefinir senha.");
    }
  }

  async function removerUsuario(usuario: Usuario) {
    if (!confirm(`Remover o usuário ${usuario.nome}? Essa ação não pode ser desfeita.`)) return;
    try {
      await api.delete(`/usuarios/${usuario.uuid}`);
      await recarregar();
    } catch (e) {
      mostrarMensagem(e instanceof ApiError ? e.message : "Falha ao remover usuário.");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <h3 className="text-lg text-cyan font-headline uppercase tracking-widest">Gerenciar Usuários</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setModal({ tipo: "importar" })}
            className="bg-cyan/10 border border-cyan text-cyan hover:bg-cyan hover:text-black px-4 py-2 text-xs uppercase tracking-widest transition-colors rounded-sm"
          >
            📥 Importar Planilha
          </button>
          <button
            onClick={() => setModal({ tipo: "novo" })}
            className="bg-neon/10 border border-neon text-neon hover:bg-neon hover:text-black px-4 py-2 text-xs uppercase tracking-widest transition-colors rounded-sm"
          >
            ➕ Novo Usuário
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-cyan/20 rounded-md bg-panel/50">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-black/40 text-cyan uppercase text-xs tracking-widest">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">RGM</th>
              <th
                className="px-4 py-3 cursor-pointer select-none hover:text-white transition-colors"
                onClick={() => alternarOrdenacao("dia")}
                title="Ordenar por dia da semana"
              >
                Dia{ordenarPor === "dia" ? (ordemAscendente ? " ▲" : " ▼") : ""}
              </th>
              <th
                className="px-4 py-3 cursor-pointer select-none hover:text-white transition-colors"
                onClick={() => alternarOrdenacao("robotica")}
                title="Ordenar por horário de robótica"
              >
                Robótica{ordenarPor === "robotica" ? (ordemAscendente ? " ▲" : " ▼") : ""}
              </th>
              <th className="px-4 py-3">Freq.</th>
              <th className="px-4 py-3">Perfil</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyan/10">
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  Nenhum usuário cadastrado.
                </td>
              </tr>
            ) : (
              usuariosOrdenados.map((usuario) => (
                <tr key={usuario.uuid} className="hover:bg-cyan/5 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold">
                    {usuario.nome}
                    {usuario.resetSenhaSolicitado && (
                      <span
                        className="ml-2 text-[10px] uppercase px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
                        title={
                          usuario.resetSenhaSolicitadoEm
                            ? `Pediu redefinição de senha em ${formatarData(usuario.resetSenhaSolicitadoEm)}`
                            : undefined
                        }
                      >
                        🔔 Pediu reset
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">{usuario.rgm}</td>
                  <td className="px-4 py-2">
                    {usuario.diaAula ? (
                      <span
                        className="inline-block whitespace-nowrap text-[10px] bg-cyan/10 border border-cyan/40 text-cyan px-1.5 py-0.5 rounded"
                        title={usuario.origemDiaAula ? labelOrigemDiaAula(usuario.origemDiaAula) : undefined}
                      >
                        {labelDiaSemana(usuario.diaAula)}
                      </span>
                    ) : (
                      <span className="text-gray-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {usuario.interesseRobotica ? (
                      usuario.horarioRobotica ? (
                        <span
                          className="inline-block whitespace-nowrap text-[10px] bg-purple-500/10 border border-purple-400/40 text-purple-300 px-1.5 py-0.5 rounded"
                          title={usuario.origemHorarioRobotica ? labelOrigemRobotica(usuario.origemHorarioRobotica) : undefined}
                        >
                          Sex {labelHorarioRobotica(usuario.horarioRobotica)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-yellow-400">sem vaga</span>
                      )
                    ) : (
                      <span className="text-gray-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{usuario.frequencia}</td>
                  <td className="px-4 py-2">
                    {usuario.eAdmin ? (
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-neon/20 text-neon border border-neon/50">
                        Admin
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-cyan/10 text-cyan border border-cyan/40">
                        Aluno
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button
                      onClick={() => setModal({ tipo: "editar", usuario })}
                      className="bg-cyan/20 text-cyan text-xs uppercase px-2 py-1.5 border border-cyan hover:bg-cyan hover:text-black transition-colors rounded"
                    >
                      Editar
                    </button>{" "}
                    <button
                      onClick={() => setModal({ tipo: "trocar-dias", usuario })}
                      className="bg-yellow-500/10 text-yellow-400 text-xs uppercase px-2 py-1.5 border border-yellow-500/50 hover:bg-yellow-500 hover:text-black transition-colors rounded"
                    >
                      Dias
                    </button>{" "}
                    <button
                      onClick={() => setModal({ tipo: "robotica", usuario })}
                      className="bg-purple-500/10 text-purple-300 text-xs uppercase px-2 py-1.5 border border-purple-400/50 hover:bg-purple-400 hover:text-black transition-colors rounded"
                    >
                      Robótica
                    </button>{" "}
                    <button
                      onClick={() => resetarSenha(usuario)}
                      className="bg-purple-500/10 text-purple-300 text-xs uppercase px-2 py-1.5 border border-purple-400/50 hover:bg-purple-400 hover:text-black transition-colors rounded"
                    >
                      Resetar Senha
                    </button>{" "}
                    <button
                      onClick={() => removerUsuario(usuario)}
                      className="bg-red-900/30 text-red-400 text-xs uppercase px-2 py-1.5 border border-red-700 hover:bg-red-700 hover:text-white transition-colors rounded"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <NovoUsuarioModal
        aberto={modal.tipo === "novo"}
        onFechar={() => setModal({ tipo: "fechado" })}
        onCriado={async () => {
          setModal({ tipo: "fechado" });
          await recarregar();
        }}
      />

      {modal.tipo === "editar" && (
        <EditarUsuarioModal
          usuario={modal.usuario}
          onFechar={() => setModal({ tipo: "fechado" })}
          onSalvo={async () => {
            setModal({ tipo: "fechado" });
            await recarregar();
          }}
        />
      )}

      {modal.tipo === "trocar-dias" && (
        <TrocarDiasModal
          usuario={modal.usuario}
          onFechar={() => setModal({ tipo: "fechado" })}
          onTrocado={async (resultado) => {
            setModal({ tipo: "fechado" });
            await recarregar();
            if (resultado.diaAula) {
              mostrarMensagem(
                `${modal.usuario.nome} ficou matriculado em ${labelDiaSemana(resultado.diaAula)} (${labelOrigemDiaAula(resultado.origem)}).`,
                "sucesso",
              );
            } else {
              mostrarMensagem(`Nenhum dia com vaga disponível pra ${modal.usuario.nome}.`);
            }
          }}
        />
      )}

      {modal.tipo === "robotica" && (
        <RoboticaModal
          usuario={modal.usuario}
          onFechar={() => setModal({ tipo: "fechado" })}
          onSalvo={async (resultado) => {
            setModal({ tipo: "fechado" });
            await recarregar();
            if (!resultado) {
              mostrarMensagem(`${modal.usuario.nome} saiu da robótica.`, "sucesso");
            } else if (resultado.horario) {
              mostrarMensagem(
                `${modal.usuario.nome} ficou em Sexta ${labelHorarioRobotica(resultado.horario)} (${labelOrigemRobotica(resultado.origem)}).`,
                "sucesso",
              );
            } else {
              mostrarMensagem(`Nenhum horário de robótica com vaga disponível pra ${modal.usuario.nome}.`);
            }
          }}
        />
      )}

      <ImportarPlanilhaModal
        aberto={modal.tipo === "importar"}
        onFechar={() => setModal({ tipo: "fechado" })}
        onImportado={async (resultado) => {
          await recarregar();
          setModal({ tipo: "relatorio-importacao", resultado });
        }}
      />

      {modal.tipo === "relatorio-importacao" && (
        <RelatorioImportacaoModal resultado={modal.resultado} onFechar={() => setModal({ tipo: "fechado" })} />
      )}
    </div>
  );
}

// ---------- Novo Usuário ----------

function NovoUsuarioModal({
  aberto,
  onFechar,
  onCriado,
}: {
  aberto: boolean;
  onFechar: () => void;
  onCriado: () => void;
}) {
  const [nome, setNome] = useState("");
  const [rgm, setRgm] = useState("");
  const [senha, setSenha] = useState("");
  const [eAdmin, setEAdmin] = useState(false);
  const [dia1, setDia1] = useState<DiaSemana | "">("");
  const [dia2, setDia2] = useState<DiaSemana | "">("");
  const [interesseRobotica, setInteresseRobotica] = useState(false);
  const [horarioRobotica, setHorarioRobotica] = useState<HorarioRobotica | "">("");
  const [erro, setErro] = useState<string | null>(null);

  function limparEFechar() {
    setNome("");
    setRgm("");
    setSenha("");
    setEAdmin(false);
    setDia1("");
    setDia2("");
    setInteresseRobotica(false);
    setHorarioRobotica("");
    setErro(null);
    onFechar();
  }

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if ((dia1 && !dia2) || (!dia1 && dia2)) {
      setErro("Informe as 2 opções de dia, ou deixe ambas em branco.");
      return;
    }
    if (dia1 && dia2 && dia1 === dia2) {
      setErro("A 1ª e a 2ª opção de dia devem ser diferentes.");
      return;
    }
    if (interesseRobotica && !horarioRobotica) {
      setErro("Selecione o horário de robótica pedido.");
      return;
    }

    const corpo: Record<string, unknown> = { nome, rgm, eAdmin };
    if (senha) corpo.senha = senha;
    if (dia1 && dia2) {
      corpo.diaPedido1 = dia1;
      corpo.diaPedido2 = dia2;
    }
    if (interesseRobotica) {
      corpo.interesseRobotica = true;
      corpo.horarioRoboticaPedido = horarioRobotica;
    }

    try {
      await api.post("/usuarios", corpo);
      limparEFechar();
      onCriado();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Falha ao cadastrar usuário.");
    }
  }

  return (
    <Modal aberto={aberto} onFechar={limparEFechar} titulo="Cadastrar Novo Usuário" corTitulo="text-neon">
      {erro && <div className="text-red-400 text-xs mb-2">{erro}</div>}
      <form onSubmit={salvar} className="flex flex-col gap-3">
        <Campo label="Nome *" value={nome} onChange={setNome} required />
        <Campo label="RGM *" value={rgm} onChange={setRgm} required />
        <Campo
          label="Senha (opcional — padrão: 3 letras do nome + @ + 4 últimos do RGM)"
          value={senha}
          onChange={setSenha}
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-widest mb-1">1ª opção de dia</label>
            <SelectDiaSemana value={dia1} onChange={setDia1} placeholder="-- não definir --" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-widest mb-1">2ª opção de dia</label>
            <SelectDiaSemana value={dia2} onChange={setDia2} placeholder="-- não definir --" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-300">
          <input
            type="checkbox"
            checked={interesseRobotica}
            onChange={(e) => setInteresseRobotica(e.target.checked)}
            className="rounded border-purple-400/40 bg-black"
          />
          Tem interesse em participar da robótica
        </label>
        {interesseRobotica && (
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-widest mb-1">Horário de robótica pedido</label>
            <SelectHorarioRobotica
              value={horarioRobotica}
              onChange={setHorarioRobotica}
              placeholder="-- selecione --"
              className="bg-black border border-purple-400/40 text-purple-300 text-sm rounded block w-full p-2"
            />
          </div>
        )}
        <label className="flex items-center gap-2 text-xs text-gray-300 mt-1">
          <input
            type="checkbox"
            checked={eAdmin}
            onChange={(e) => setEAdmin(e.target.checked)}
            className="rounded border-cyan/40 bg-black"
          />
          É administrador
        </label>
        <div className="flex gap-2 mt-2">
          <button
            type="submit"
            className="flex-1 bg-neon/20 text-neon border border-neon hover:bg-neon hover:text-black uppercase text-xs tracking-widest py-2 transition-colors rounded"
          >
            ✅ Cadastrar
          </button>
          <button
            type="button"
            onClick={limparEFechar}
            className="flex-1 bg-gray-800 text-gray-400 border border-gray-600 hover:bg-gray-700 uppercase text-xs tracking-widest py-2 transition-colors rounded"
          >
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---------- Editar Usuário ----------

function EditarUsuarioModal({
  usuario,
  onFechar,
  onSalvo,
}: {
  usuario: Usuario;
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const [nome, setNome] = useState(usuario.nome);
  const [rgm, setRgm] = useState(usuario.rgm);
  const [senha, setSenha] = useState("");
  const [eAdmin, setEAdmin] = useState(usuario.eAdmin);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    const corpo: Record<string, unknown> = { nome, rgm, eAdmin };
    if (senha) corpo.senha = senha;

    try {
      await api.put(`/usuarios/${usuario.uuid}`, corpo);
      onSalvo();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Falha ao salvar usuário.");
    }
  }

  return (
    <Modal aberto onFechar={onFechar} titulo="Editar Usuário">
      {erro && <div className="text-red-400 text-xs mb-2">{erro}</div>}
      <form onSubmit={salvar} className="flex flex-col gap-3">
        <Campo label="Nome" value={nome} onChange={setNome} />
        <Campo label="RGM" value={rgm} onChange={setRgm} />
        <Campo label="Nova senha (deixe em branco para não alterar)" value={senha} onChange={setSenha} />
        <label className="flex items-center gap-2 text-xs text-gray-300 mt-1">
          <input
            type="checkbox"
            checked={eAdmin}
            onChange={(e) => setEAdmin(e.target.checked)}
            className="rounded border-cyan/40 bg-black"
          />
          É administrador
        </label>
        <div className="flex gap-2 mt-2">
          <button
            type="submit"
            className="flex-1 bg-cyan/20 text-cyan border border-cyan hover:bg-cyan hover:text-black uppercase text-xs tracking-widest py-2 transition-colors rounded"
          >
            💾 Salvar
          </button>
          <button
            type="button"
            onClick={onFechar}
            className="flex-1 bg-gray-800 text-gray-400 border border-gray-600 hover:bg-gray-700 uppercase text-xs tracking-widest py-2 transition-colors rounded"
          >
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---------- Trocar Dias ----------

function TrocarDiasModal({
  usuario,
  onFechar,
  onTrocado,
}: {
  usuario: Usuario;
  onFechar: () => void;
  onTrocado: (resultado: ResultadoAlocacaoAluno) => void;
}) {
  const [dia1, setDia1] = useState<DiaSemana | "">(usuario.diaPedido1 ?? "");
  const [dia2, setDia2] = useState<DiaSemana | "">(usuario.diaPedido2 ?? "");
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (dia1 === dia2) {
      setErro("A 1ª e a 2ª opção devem ser diferentes.");
      return;
    }

    try {
      const resposta = await api.put<{ usuario: Usuario; resultado: ResultadoAlocacaoAluno }>(
        `/usuarios/${usuario.uuid}/dias-aula`,
        { diaPedido1: dia1, diaPedido2: dia2 },
      );
      onTrocado(resposta.resultado);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Falha ao trocar dia.");
    }
  }

  return (
    <Modal aberto onFechar={onFechar} titulo={`Trocar Dia de Aula — ${usuario.nome}`} corTitulo="text-yellow-400">
      {erro && <div className="text-red-400 text-xs mb-2">{erro}</div>}
      <p className="text-xs text-gray-400 mb-3">
        O aluno fica matriculado em 1 dia só: tenta a 1ª opção, depois a 2ª, e se as duas estiverem cheias
        (11/11) o sistema realoca automaticamente pro dia com mais vagas.
      </p>
      <form onSubmit={salvar} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-widest mb-1">1ª opção *</label>
            <SelectDiaSemana
              value={dia1}
              onChange={setDia1}
              required
              className="bg-black border border-yellow-500/40 text-yellow-400 text-sm rounded block w-full p-2"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-widest mb-1">2ª opção *</label>
            <SelectDiaSemana
              value={dia2}
              onChange={setDia2}
              required
              className="bg-black border border-yellow-500/40 text-yellow-400 text-sm rounded block w-full p-2"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            type="submit"
            className="flex-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500 hover:bg-yellow-500 hover:text-black uppercase text-xs tracking-widest py-2 transition-colors rounded"
          >
            💾 Salvar
          </button>
          <button
            type="button"
            onClick={onFechar}
            className="flex-1 bg-gray-800 text-gray-400 border border-gray-600 hover:bg-gray-700 uppercase text-xs tracking-widest py-2 transition-colors rounded"
          >
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---------- Robótica ----------

function RoboticaModal({
  usuario,
  onFechar,
  onSalvo,
}: {
  usuario: Usuario;
  onFechar: () => void;
  onSalvo: (resultado: ResultadoAlocacaoRobotica | null) => void;
}) {
  const [interesse, setInteresse] = useState(usuario.interesseRobotica);
  const [horario, setHorario] = useState<HorarioRobotica | "">(usuario.horarioRoboticaPedido ?? "");
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (interesse && !horario) {
      setErro("Selecione o horário pedido.");
      return;
    }

    try {
      const resposta = await api.put<{ usuario: Usuario; resultado: ResultadoAlocacaoRobotica | null }>(
        `/usuarios/${usuario.uuid}/robotica`,
        { interesse, horarioPedido: interesse ? horario : undefined },
      );
      onSalvo(resposta.resultado);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Falha ao salvar robótica.");
    }
  }

  return (
    <Modal aberto onFechar={onFechar} titulo={`Robótica — ${usuario.nome}`} corTitulo="text-purple-300">
      {erro && <div className="text-red-400 text-xs mb-2">{erro}</div>}
      <p className="text-xs text-gray-400 mb-3">
        Robótica acontece toda sexta-feira. Se o horário pedido estiver cheio, o sistema realoca
        automaticamente pro horário com mais vagas.
      </p>
      <form onSubmit={salvar} className="flex flex-col gap-3">
        <label className="flex items-center gap-2 text-xs text-gray-300">
          <input
            type="checkbox"
            checked={interesse}
            onChange={(e) => setInteresse(e.target.checked)}
            className="rounded border-purple-400/40 bg-black"
          />
          Tem interesse em participar da robótica
        </label>
        {interesse && (
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-widest mb-1">Horário pedido *</label>
            <SelectHorarioRobotica
              value={horario}
              onChange={setHorario}
              placeholder="-- selecione --"
              className="bg-black border border-purple-400/40 text-purple-300 text-sm rounded block w-full p-2"
            />
          </div>
        )}
        <div className="flex gap-2 mt-2">
          <button
            type="submit"
            className="flex-1 bg-purple-500/20 text-purple-300 border border-purple-400 hover:bg-purple-400 hover:text-black uppercase text-xs tracking-widest py-2 transition-colors rounded"
          >
            💾 Salvar
          </button>
          <button
            type="button"
            onClick={onFechar}
            className="flex-1 bg-gray-800 text-gray-400 border border-gray-600 hover:bg-gray-700 uppercase text-xs tracking-widest py-2 transition-colors rounded"
          >
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---------- Importar Planilha ----------

function ImportarPlanilhaModal({
  aberto,
  onFechar,
  onImportado,
}: {
  aberto: boolean;
  onFechar: () => void;
  onImportado: (resultado: ResultadoImportacao) => void;
}) {
  const [spreadsheetIdOuUrl, setSpreadsheetIdOuUrl] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function limparEFechar() {
    setSpreadsheetIdOuUrl("");
    setErro(null);
    onFechar();
  }

  async function importar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (!confirm("Confirma? Todos os alunos atuais serão apagados e substituídos pelos dessa planilha.")) return;

    setCarregando(true);
    try {
      const resultado = await api.post<ResultadoImportacao>("/usuarios/importar", { spreadsheetIdOuUrl });
      setSpreadsheetIdOuUrl("");
      onImportado(resultado);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Falha ao importar planilha.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Modal aberto={aberto} onFechar={limparEFechar} titulo="Importar Planilha de Alunos">
      {erro && <div className="text-red-400 text-xs mb-2">{erro}</div>}
      <div className="bg-red-500/10 border border-red-500/40 rounded p-3 mb-3">
        <p className="text-red-300 text-xs leading-relaxed">
          ⚠️ Isso vai <strong>apagar todos os alunos atuais</strong> e criar novos a partir dessa planilha.
          Contas de administrador não são afetadas. Não pode ser desfeito.
        </p>
      </div>
      <form onSubmit={importar} className="flex flex-col gap-3">
        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-widest mb-1">
            ID ou link da planilha *
          </label>
          <input
            type="text"
            required
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={spreadsheetIdOuUrl}
            onChange={(e) => setSpreadsheetIdOuUrl(e.target.value)}
            className="bg-black border border-cyan/40 text-cyan text-sm rounded block w-full p-2"
          />
          <p className="text-[10px] text-gray-500 mt-1">
            A planilha precisa estar pública: Compartilhar → Acesso geral → "Qualquer pessoa com o link"
            (Leitor).
          </p>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            type="submit"
            disabled={carregando}
            className="flex-1 bg-cyan/20 text-cyan border border-cyan hover:bg-cyan hover:text-black uppercase text-xs tracking-widest py-2 transition-colors rounded disabled:opacity-60"
          >
            {carregando ? "Importando..." : "📥 Importar e Substituir"}
          </button>
          <button
            type="button"
            onClick={limparEFechar}
            className="flex-1 bg-gray-800 text-gray-400 border border-gray-600 hover:bg-gray-700 uppercase text-xs tracking-widest py-2 transition-colors rounded"
          >
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---------- Relatório de Importação ----------

function RelatorioImportacaoModal({
  resultado,
  onFechar,
}: {
  resultado: ResultadoImportacao;
  onFechar: () => void;
}) {
  return (
    <Modal aberto onFechar={onFechar} titulo="Relatório de Importação">
      <div className="grid grid-cols-3 gap-2 text-center mb-4">
        <div className="bg-black/40 border border-cyan/20 rounded p-2">
          <div className="text-lg text-cyan font-mono">{resultado.totalNaPlanilha}</div>
          <div className="text-[10px] text-gray-400 uppercase">Na planilha</div>
        </div>
        <div className="bg-black/40 border border-red-500/30 rounded p-2">
          <div className="text-lg text-red-400 font-mono">{resultado.totalApagados}</div>
          <div className="text-[10px] text-gray-400 uppercase">Apagados</div>
        </div>
        <div className="bg-black/40 border border-neon/30 rounded p-2">
          <div className="text-lg text-neon font-mono">{resultado.totalImportadosAgora}</div>
          <div className="text-[10px] text-gray-400 uppercase">Importados agora</div>
        </div>
      </div>
      <div className="overflow-x-auto border border-cyan/20 rounded mb-4">
        <table className="w-full text-left text-xs text-gray-300">
          <thead className="bg-black/40 text-cyan uppercase text-[10px]">
            <tr>
              <th className="px-2 py-1.5">Nome</th>
              <th className="px-2 py-1.5">RGM</th>
              <th className="px-2 py-1.5">Opções pedidas</th>
              <th className="px-2 py-1.5">Dia final</th>
              <th className="px-2 py-1.5">Robótica</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyan/10">
            {resultado.relatorio.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-2 py-3 text-center text-gray-500">
                  Nenhum usuário novo importado.
                </td>
              </tr>
            ) : (
              resultado.relatorio.map((item) => (
                <tr key={item.rgm}>
                  <td className="px-2 py-1.5 font-mono">{item.nome}</td>
                  <td className="px-2 py-1.5">{item.rgm}</td>
                  <td className="px-2 py-1.5 text-xs">
                    1ª: {labelDiaSemana(item.diaPedido1)} · 2ª: {labelDiaSemana(item.diaPedido2)}
                  </td>
                  <td className="px-2 py-1.5 text-xs">
                    {item.diaAula ? (
                      <>
                        {labelDiaSemana(item.diaAula)}{" "}
                        <span className="text-gray-500">({labelOrigemDiaAula(item.origem)})</span>
                      </>
                    ) : (
                      <span className="text-red-400">sem vaga</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-xs">
                    {item.interesseRobotica ? (
                      item.horarioRobotica ? (
                        <>
                          Sex {labelHorarioRobotica(item.horarioRobotica)}{" "}
                          <span className="text-gray-500">({labelOrigemRobotica(item.origemRobotica)})</span>
                        </>
                      ) : (
                        <span className="text-red-400">sem vaga</span>
                      )
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {resultado.linhasInvalidas.length > 0 && (
        <div className="text-red-400 text-xs">
          <p className="font-bold uppercase tracking-widest mb-1">Linhas inválidas:</p>
          <ul className="list-disc list-inside">
            {resultado.linhasInvalidas.map((li) => (
              <li key={li.linha}>
                Linha {li.linha}: {li.motivo}
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        type="button"
        onClick={onFechar}
        className="w-full mt-4 bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700 uppercase text-xs tracking-widest py-2 transition-colors rounded"
      >
        Fechar
      </button>
    </Modal>
  );
}

// ---------- Campo de texto reutilizavel ----------

function Campo({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 uppercase tracking-widest mb-1">{label}</label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-black border border-cyan/40 text-cyan text-sm rounded block w-full p-2"
      />
    </div>
  );
}
