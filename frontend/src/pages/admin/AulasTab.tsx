import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "../../components/Modal";
import { api, ApiError } from "../../lib/api";
import { formatarData, hojeISO, labelDiaSemana } from "../../lib/diasSemana";
import type { Aula, Usuario } from "../../lib/types";
import type { MostrarMensagem } from "./AdminDashboard";

interface Props {
  mostrarMensagem: MostrarMensagem;
}

interface ResultadoFinalizacao {
  aula: Aula;
  presentes: Usuario[];
  ausentes: Usuario[];
  avisoPlanilha?: string;
}

type EstadoModal =
  | { tipo: "fechado" }
  | { tipo: "nova" }
  | { tipo: "qrcode"; qrCodeDataUrl: string; url: string }
  | { tipo: "finalizada"; resultado: ResultadoFinalizacao };

export function AulasTab({ mostrarMensagem }: Props) {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [modal, setModal] = useState<EstadoModal>({ tipo: "fechado" });

  async function recarregar() {
    const dados = await api.get<Aula[]>("/aulas");
    setAulas(dados);
  }

  useEffect(() => {
    recarregar().catch((e) => mostrarMensagem(e instanceof ApiError ? e.message : "Falha ao carregar aulas."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verQrCode(aula: Aula) {
    try {
      const resultado = await api.get<{ qrCodeDataUrl: string; url: string }>(`/aulas/${aula.uuid}/qrcode`);
      setModal({ tipo: "qrcode", qrCodeDataUrl: resultado.qrCodeDataUrl, url: resultado.url });
    } catch (e) {
      mostrarMensagem(e instanceof ApiError ? e.message : "Falha ao gerar QR code.");
    }
  }

  async function finalizarAula(aula: Aula) {
    if (!confirm("Finalizar esta aula? Alunos que não marcaram presença serão registrados como falta.")) return;
    try {
      const resultado = await api.post<ResultadoFinalizacao>(`/aulas/${aula.uuid}/finalizar`);
      await recarregar();
      setModal({ tipo: "finalizada", resultado });
    } catch (e) {
      mostrarMensagem(e instanceof ApiError ? e.message : "Falha ao finalizar aula.");
    }
  }

  async function removerAula(aula: Aula) {
    if (!confirm("Remover esta aula e todas as presenças registradas nela?")) return;
    try {
      await api.delete(`/aulas/${aula.uuid}`);
      await recarregar();
    } catch (e) {
      mostrarMensagem(e instanceof ApiError ? e.message : "Falha ao remover aula.");
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg text-cyan font-headline uppercase tracking-widest">Gerenciar Aulas</h3>
        <button
          onClick={() => setModal({ tipo: "nova" })}
          className="bg-neon/10 border border-neon text-neon hover:bg-neon hover:text-black px-4 py-2 text-xs uppercase tracking-widest transition-colors rounded-sm"
        >
          ➕ Nova Aula
        </button>
      </div>

      <div className="overflow-x-auto border border-cyan/20 rounded-md bg-panel/50">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-black/40 text-cyan uppercase text-xs tracking-widest">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Dia</th>
              <th className="px-4 py-3">Matriculados</th>
              <th className="px-4 py-3">Presenças</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyan/10">
            {aulas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Nenhuma aula cadastrada.
                </td>
              </tr>
            ) : (
              aulas.map((aula) => (
                <tr key={aula.uuid} className="hover:bg-cyan/5 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold">{formatarData(aula.dataAula)}</td>
                  <td className="px-4 py-2">{labelDiaSemana(aula.diaAula)}</td>
                  <td className="px-4 py-2">{aula.qtdAluno}</td>
                  <td className="px-4 py-2">{aula.qtdPresenca}</td>
                  <td className="px-4 py-2">
                    {aula.finalizada ? (
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/50">
                        Finalizada
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/50">
                        Aberta
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button
                      onClick={() => verQrCode(aula)}
                      className="bg-cyan/20 text-cyan text-xs uppercase px-2 py-1.5 border border-cyan hover:bg-cyan hover:text-black transition-colors rounded"
                    >
                      QR
                    </button>{" "}
                    {!aula.finalizada && (
                      <button
                        onClick={() => finalizarAula(aula)}
                        className="bg-neon/10 text-neon text-xs uppercase px-2 py-1.5 border border-neon/60 hover:bg-neon hover:text-black transition-colors rounded"
                      >
                        Finalizar
                      </button>
                    )}{" "}
                    <button
                      onClick={() => removerAula(aula)}
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

      <NovaAulaModal
        aberto={modal.tipo === "nova"}
        onFechar={() => setModal({ tipo: "fechado" })}
        onCriada={async () => {
          setModal({ tipo: "fechado" });
          await recarregar();
        }}
      />

      {modal.tipo === "qrcode" && (
        <Modal aberto onFechar={() => setModal({ tipo: "fechado" })} titulo="QR Code da Aula">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-[0_0_40px_rgba(0,212,255,0.4)]">
              <img src={modal.qrCodeDataUrl} alt="QR Code" className="w-64 h-64 object-contain" />
            </div>
            <p className="text-xs text-gray-400 break-all text-center">{modal.url}</p>
            <button
              type="button"
              onClick={() => setModal({ tipo: "fechado" })}
              className="w-full bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700 uppercase text-xs tracking-widest py-2 transition-colors rounded"
            >
              Fechar
            </button>
          </div>
        </Modal>
      )}

      {modal.tipo === "finalizada" && (
        <Modal aberto onFechar={() => setModal({ tipo: "fechado" })} titulo="Aula Finalizada" corTitulo="text-neon">
          {modal.resultado.avisoPlanilha && (
            <p className="text-yellow-400 text-xs mb-3">{modal.resultado.avisoPlanilha}</p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-green-400 text-xs uppercase tracking-widest mb-2">
                ✅ Presentes ({modal.resultado.presentes.length})
              </p>
              <ul className="text-sm text-gray-300 list-disc list-inside space-y-0.5">
                {modal.resultado.presentes.length === 0 ? (
                  <li className="text-gray-500">Nenhum</li>
                ) : (
                  modal.resultado.presentes.map((u) => <li key={u.uuid}>{u.nome}</li>)
                )}
              </ul>
            </div>
            <div>
              <p className="text-red-400 text-xs uppercase tracking-widest mb-2">
                🚫 Ausentes ({modal.resultado.ausentes.length})
              </p>
              <ul className="text-sm text-gray-300 list-disc list-inside space-y-0.5">
                {modal.resultado.ausentes.length === 0 ? (
                  <li className="text-gray-500">Nenhum</li>
                ) : (
                  modal.resultado.ausentes.map((u) => <li key={u.uuid}>{u.nome}</li>)
                )}
              </ul>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModal({ tipo: "fechado" })}
            className="w-full mt-4 bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700 uppercase text-xs tracking-widest py-2 transition-colors rounded"
          >
            Fechar
          </button>
        </Modal>
      )}
    </div>
  );
}

function NovaAulaModal({
  aberto,
  onFechar,
  onCriada,
}: {
  aberto: boolean;
  onFechar: () => void;
  onCriada: () => void;
}) {
  const [data, setData] = useState(hojeISO());
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (aberto) setData(hojeISO());
  }, [aberto]);

  async function criar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    const dataIso = new Date(`${data}T12:00:00`).toISOString();
    try {
      await api.post("/aulas", { dataAula: dataIso });
      onCriada();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Falha ao criar aula.");
    }
  }

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Nova Aula" corTitulo="text-neon">
      {erro && <div className="text-red-400 text-xs mb-2">{erro}</div>}
      <form onSubmit={criar} className="flex flex-col gap-3">
        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-widest mb-1">
            Data da aula (dia útil, Seg–Sex) *
          </label>
          <input
            type="date"
            required
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="bg-black border border-neon/40 text-neon text-sm rounded block w-full p-2"
          />
        </div>
        <div className="flex gap-2 mt-2">
          <button
            type="submit"
            className="flex-1 bg-neon/20 text-neon border border-neon hover:bg-neon hover:text-black uppercase text-xs tracking-widest py-2 transition-colors rounded"
          >
            ✅ Criar
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
