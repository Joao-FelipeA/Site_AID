import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../../lib/api";
import { formatarData } from "../../lib/diasSemana";
import type { Doacao } from "../../lib/types";
import type { MostrarMensagem } from "./AdminDashboard";

interface Props {
  mostrarMensagem: MostrarMensagem;
}

export function DoacoesTab({ mostrarMensagem }: Props) {
  const [doacoes, setDoacoes] = useState<Doacao[]>([]);

  async function recarregar() {
    const dados = await api.get<Doacao[]>("/doacoes");
    setDoacoes(dados);
  }

  useEffect(() => {
    recarregar().catch((e) => mostrarMensagem(e instanceof ApiError ? e.message : "Falha ao carregar doações."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function adicionarMaterial(doacao: Doacao) {
    const materialDoado = prompt("Descreva o material doado:");
    if (!materialDoado || !materialDoado.trim()) return;

    try {
      await api.post(`/doacoes/${doacao.uuid}/materiais`, { materialDoado: materialDoado.trim() });
      await recarregar();
    } catch (e) {
      mostrarMensagem(e instanceof ApiError ? e.message : "Falha ao adicionar material.");
    }
  }

  async function removerMaterial(doacao: Doacao, materialUuid: string) {
    if (!confirm("Remover este material?")) return;
    try {
      await api.delete(`/doacoes/${doacao.uuid}/materiais/${materialUuid}`);
      await recarregar();
    } catch (e) {
      mostrarMensagem(e instanceof ApiError ? e.message : "Falha ao remover material.");
    }
  }

  async function removerDoacao(doacao: Doacao) {
    if (!confirm("Remover esta doação e todos os materiais associados?")) return;
    try {
      await api.delete(`/doacoes/${doacao.uuid}`);
      await recarregar();
    } catch (e) {
      mostrarMensagem(e instanceof ApiError ? e.message : "Falha ao remover doação.");
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg text-cyan font-headline uppercase tracking-widest">Gerenciar Doações</h3>
        <Link
          to="/doacao"
          className="bg-yellow-500/10 border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black px-4 py-2 text-xs uppercase tracking-widest transition-colors rounded-sm"
        >
          ➕ Registrar Doação
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {doacoes.length === 0 ? (
          <div className="p-6 text-center text-gray-500 border border-cyan/10 bg-panel/30 rounded-md">
            Nenhuma doação cadastrada.
          </div>
        ) : (
          doacoes.map((doacao) => (
            <div key={doacao.uuid} className="p-4 border border-cyan/20 bg-panel/50 rounded-md flex flex-col gap-3">
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div>
                  <p className="text-white font-bold">{doacao.nome}</p>
                  <p className="text-xs text-gray-400">
                    {doacao.contato} · {formatarData(doacao.dtaCriacao)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => adicionarMaterial(doacao)}
                    className="bg-cyan/10 text-cyan text-xs uppercase px-2 py-1.5 border border-cyan/50 hover:bg-cyan hover:text-black transition-colors rounded"
                  >
                    + Material
                  </button>
                  <button
                    onClick={() => removerDoacao(doacao)}
                    className="bg-red-900/30 text-red-400 text-xs uppercase px-2 py-1.5 border border-red-700 hover:bg-red-700 hover:text-white transition-colors rounded"
                  >
                    Remover
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {doacao.materiais.length === 0 ? (
                  <span className="text-gray-600 text-xs">Nenhum material.</span>
                ) : (
                  doacao.materiais.map((material) => (
                    <span
                      key={material.uuid}
                      className="inline-flex items-center gap-1 text-xs bg-black/40 border border-cyan/20 rounded-full px-2 py-1"
                    >
                      {material.materialDoado}
                      <button
                        onClick={() => removerMaterial(doacao, material.uuid)}
                        className="text-red-400 hover:text-red-300"
                      >
                        ✕
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
