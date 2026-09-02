import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { HudContainer } from "../components/HudContainer";
import { Banner } from "../components/Banner";
import { api, ApiError } from "../lib/api";
import { useAuth, paginaInicialParaUsuario } from "../lib/auth";
import type { Usuario } from "../lib/types";

export function Login() {
  const { usuario, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [rgm, setRgm] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState<{ texto: string; tipo: "erro" | "sucesso" } | null>(null);

  const [rgmReset, setRgmReset] = useState("");
  const [carregandoReset, setCarregandoReset] = useState(false);

  useEffect(() => {
    if (usuario) {
      const destino = params.get("redirect") || paginaInicialParaUsuario(usuario);
      navigate(!usuario.senhaAlterada ? `/trocar-senha?redirect=${encodeURIComponent(destino)}` : destino, {
        replace: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function entrar(evento: FormEvent) {
    evento.preventDefault();
    setMensagem(null);
    setCarregando(true);

    try {
      const { token, usuario: usuarioLogado } = await api.post<{ token: string; usuario: Usuario }>(
        "/auth/login",
        { rgm, senha },
      );
      login(token, usuarioLogado);

      const destino = params.get("redirect") || paginaInicialParaUsuario(usuarioLogado);
      navigate(
        !usuarioLogado.senhaAlterada ? `/trocar-senha?redirect=${encodeURIComponent(destino)}` : destino,
      );
    } catch (erro) {
      setMensagem({ texto: erro instanceof ApiError ? erro.message : "Falha ao entrar.", tipo: "erro" });
      setCarregando(false);
    }
  }

  async function solicitarReset(evento: FormEvent) {
    evento.preventDefault();
    setMensagem(null);
    setCarregandoReset(true);

    try {
      const resposta = await api.post<{ mensagem: string }>("/auth/esqueci-senha", { rgm: rgmReset });
      setMensagem({ texto: resposta.mensagem, tipo: "sucesso" });
      setRgmReset("");
    } catch (erro) {
      setMensagem({ texto: erro instanceof ApiError ? erro.message : "Falha ao enviar a solicitação.", tipo: "erro" });
    } finally {
      setCarregandoReset(false);
    }
  }

  return (
    <Layout>
      <Banner texto={mensagem?.texto ?? null} tipo={mensagem?.tipo} />

      <HudContainer>
        <div className="flex flex-col items-center mb-4">
          <div className="mb-1.5 text-neon drop-shadow-[0_0_12px_rgba(57,255,20,0.6)]">
            <span className="material-symbols-outlined text-[36px]">assignment</span>
          </div>
          <h2 className="font-body text-xl font-semibold text-white tracking-wide mb-1">Confirme sua presença</h2>
          <p className="font-body text-[0.8rem] text-gray-400 max-w-[85%] leading-relaxed font-light text-center">
            Entre com seu RGM e senha para registrar presença e acompanhar seu histórico de frequência.
          </p>
        </div>

        <details className="mb-3 w-full bg-[#050D15]/80 border border-cyan/20 rounded-sm group overflow-hidden [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex items-center gap-2 p-2.5 cursor-pointer select-none list-none relative hover:bg-cyan/5 transition-colors">
            <span className="material-symbols-outlined text-gray-400 text-[18px] transition-transform duration-200 group-open:rotate-90">
              expand_more
            </span>
            <span className="material-symbols-outlined text-cyan text-[16px]">autorenew</span>
            <span className="text-gray-200 text-[0.75rem] font-medium tracking-wide group-hover:text-white transition-colors">
              Esqueci minha senha
            </span>
          </summary>
          <div className="p-4 pt-2 flex flex-col gap-3 border-t border-cyan/10">
            <p className="text-gray-400 text-[0.7rem] font-light leading-relaxed">
              Digite seu RGM. Um administrador vai receber sua solicitação e redefinir sua senha
              manualmente.
            </p>
            <form onSubmit={solicitarReset} className="flex flex-col gap-3">
              <div className="relative w-full rounded border border-cyan/20 bg-[#040810] flex items-center px-3 py-1.5 focus-within:border-cyan focus-within:shadow-[0_0_8px_rgba(0,212,255,0.2)] transition-all">
                <input
                  type="text"
                  placeholder="RGM"
                  required
                  value={rgmReset}
                  onChange={(e) => setRgmReset(e.target.value)}
                  className="w-full bg-transparent border-none text-gray-400 text-sm focus:outline-none focus:ring-0 p-0"
                />
              </div>
              <button
                type="submit"
                disabled={carregandoReset}
                className="w-full border border-[#39ff14]/50 bg-[#021004] hover:bg-[#07240c] transition-colors rounded-sm py-2 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[#39ff14] text-[16px]">forward_to_inbox</span>
                <span className="font-headline font-bold text-[0.7rem] tracking-[0.15em] uppercase text-[#39ff14]">
                  Solicitar Redefinição
                </span>
              </button>
            </form>
          </div>
        </details>

        <form onSubmit={entrar} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center px-1">
                <span className="font-body text-[0.6rem] text-gray-300 uppercase tracking-[0.15em] font-semibold">
                  RGM
                </span>
                <span
                  className="material-symbols-outlined text-[12px] text-gray-500 cursor-help hover:text-cyan transition-colors"
                  title="Seu numero de RGM"
                >
                  help_outline
                </span>
              </div>
              <div className="relative w-full rounded-md input-glow-border bg-[#050D15] flex items-center px-3 py-2.5">
                <input
                  type="text"
                  placeholder="RGM"
                  required
                  value={rgm}
                  onChange={(e) => setRgm(e.target.value)}
                  className="w-full bg-transparent border-none text-gray-400 text-base focus:outline-none focus:ring-0 p-0"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center px-1">
                <span className="font-body text-[0.6rem] text-gray-300 uppercase tracking-[0.15em] font-semibold">
                  Senha
                </span>
                <span
                  className="material-symbols-outlined text-[12px] text-gray-500 cursor-help hover:text-cyan transition-colors"
                  title="3 primeiras letras do nome + @ + 4 últimos dígitos do RGM"
                >
                  help_outline
                </span>
              </div>
              <div className="relative w-full rounded-md input-glow-border bg-[#050D15] flex items-center px-3 py-2.5">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  placeholder="********"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className={`w-full bg-transparent border-none text-gray-400 text-base focus:outline-none focus:ring-0 p-0 ${mostrarSenha ? "" : "tracking-[0.2em]"}`}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  className={`ml-2 transition-colors flex items-center focus:outline-none ${mostrarSenha ? "text-cyan" : "text-gray-400 hover:text-cyan"}`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {mostrarSenha ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full mt-2 btn-neon-fill rounded-md py-[8px] flex justify-center items-center"
          >
            <span className="font-headline font-bold text-[0.95rem] tracking-[0.15em] uppercase text-[#040810]">
              Entrar
            </span>
          </button>
        </form>
      </HudContainer>
    </Layout>
  );
}
