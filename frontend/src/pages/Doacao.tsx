import { useState, type FormEvent } from "react";
import { Layout } from "../components/Layout";
import { Banner } from "../components/Banner";
import { api, ApiError } from "../lib/api";

export function Doacao() {
  const [nome, setNome] = useState("");
  const [contato, setContato] = useState("");
  const [materiais, setMateriais] = useState<string[]>([""]);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState<{ texto: string; tipo: "erro" | "sucesso" } | null>(null);

  function alterarMaterial(indice: number, valor: string) {
    setMateriais((atual) => atual.map((m, i) => (i === indice ? valor : m)));
  }

  function removerMaterial(indice: number) {
    setMateriais((atual) => (atual.length > 1 ? atual.filter((_, i) => i !== indice) : atual));
  }

  async function registrar(evento: FormEvent) {
    evento.preventDefault();
    setMensagem(null);

    const materiaisPreenchidos = materiais.map((m) => m.trim()).filter((m) => m.length > 0);
    if (materiaisPreenchidos.length === 0) {
      setMensagem({ texto: "Adicione ao menos um material doado.", tipo: "erro" });
      return;
    }

    setCarregando(true);
    try {
      await api.post("/doacoes", { nome, contato, materiais: materiaisPreenchidos });
      setMensagem({ texto: "Doação registrada com sucesso! Obrigado.", tipo: "sucesso" });
      setNome("");
      setContato("");
      setMateriais([""]);
    } catch (erro) {
      setMensagem({ texto: erro instanceof ApiError ? erro.message : "Falha ao registrar doação.", tipo: "erro" });
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Layout largura="max-w-4xl">
      <div className="w-full flex flex-col gap-8 mb-12">
        <Banner texto={mensagem?.texto ?? null} tipo={mensagem?.tipo} />

        <div className="relative overflow-hidden rounded-xl border border-yellow-500/30 bg-panel/80 p-8 shadow-[0_0_20px_rgba(234,179,8,0.05)] text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="text-4xl mb-3 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">♻️</div>
          <h2 className="text-3xl md:text-4xl text-yellow-500 font-headline font-bold mb-4 tracking-wider uppercase">
            Registrar doação
          </h2>
          <p className="text-gray-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-light">
            Aceitamos doações de computadores, notebooks, monitores, teclados, mouses e outros eletrônicos em{" "}
            <strong className="text-white font-medium">qualquer estado de conservação</strong>.
          </p>
        </div>

        <div className="mt-2">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="font-headline text-lg text-yellow-500 uppercase tracking-widest font-semibold flex-shrink-0">
              Dados do doador
            </h3>
            <div className="h-[1px] w-full bg-gradient-to-r from-yellow-500/50 to-transparent" />
          </div>

          <form
            onSubmit={registrar}
            className="bg-panel/50 border border-yellow-500/20 p-6 rounded-xl flex flex-col gap-5 shadow-[0_0_15px_rgba(234,179,8,0.05)]"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1">
                  Nome completo *
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="Nome do doador"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-black/50 border border-yellow-500/30 text-yellow-500 px-4 py-3 rounded-lg focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 text-sm transition-all focus:bg-black/80"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1">
                  Telefone / WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  maxLength={20}
                  placeholder="(83) 9 XXXX-XXXX"
                  value={contato}
                  onChange={(e) => setContato(e.target.value)}
                  className="w-full bg-black/50 border border-yellow-500/30 text-yellow-500 px-4 py-3 rounded-lg focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 text-sm transition-all focus:bg-black/80 font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs uppercase tracking-widest text-gray-400">Materiais doados *</label>
                <button
                  type="button"
                  onClick={() => setMateriais((atual) => [...atual, ""])}
                  className="text-xs text-yellow-500 border border-yellow-500/40 rounded px-2 py-1 hover:bg-yellow-500/10 transition-colors"
                >
                  + Adicionar material
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {materiais.map((material, indice) => (
                  <div key={indice} className="flex gap-2 items-center">
                    <input
                      type="text"
                      maxLength={200}
                      placeholder="Ex: Notebook Dell Inspiron"
                      value={material}
                      onChange={(e) => alterarMaterial(indice, e.target.value)}
                      className="flex-1 bg-black/50 border border-yellow-500/30 text-yellow-500 px-4 py-2.5 rounded-lg focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 text-sm transition-all focus:bg-black/80"
                    />
                    <button
                      type="button"
                      onClick={() => removerMaterial(indice)}
                      className="text-red-400 hover:text-red-300 text-xs border border-red-500/30 rounded px-2 py-2.5 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="mt-2 w-full bg-yellow-500/20 border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black py-4 rounded-lg uppercase tracking-widest text-sm font-bold transition-all shadow-[0_0_10px_rgba(234,179,8,0.2)] disabled:opacity-60"
            >
              Registrar Doação
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
