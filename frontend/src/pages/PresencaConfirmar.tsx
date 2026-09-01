import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { HudContainer } from "../components/HudContainer";
import { Banner } from "../components/Banner";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

interface Props {
  /** Prefixo da rota da API: "/aulas" (normal) ou "/aulas-robotica". */
  caminhoBase?: string;
}

export function PresencaConfirmar({ caminhoBase = "/aulas" }: Props) {
  const { usuario } = useAuth();
  const [params] = useSearchParams();
  const aula = params.get("aula");
  const token = params.get("token");

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmada, setConfirmada] = useState(false);

  async function confirmar() {
    if (!aula || !token) return;
    setErro(null);
    setCarregando(true);

    try {
      await api.post(`${caminhoBase}/${aula}/presenca`, { token });
      setConfirmada(true);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Falha ao confirmar presença.");
      setCarregando(false);
    }
  }

  if (!aula || !token) {
    return (
      <Layout>
        <Banner texto="Link de QR code inválido: faltam parâmetros de aula/token." tipo="erro" />
      </Layout>
    );
  }

  return (
    <Layout>
      <Banner texto={erro} tipo="erro" />

      <HudContainer>
        <div className="flex flex-col items-center mb-6 w-full px-2">
          <div className="mb-2 text-cyan drop-shadow-[0_0_12px_rgba(0,212,255,0.6)]">
            <span className="material-symbols-outlined text-[54px]">qr_code_scanner</span>
          </div>
          <h2 className="font-body text-2xl font-semibold text-white tracking-wide mb-1 text-center">
            Validar Presença
          </h2>
          <p className="font-body text-[0.8rem] text-gray-400 mt-1 mb-5 text-center px-4 leading-relaxed">
            Olá, <strong className="text-white">{usuario?.nome}</strong>! Confirme sua presença para a aula de
            hoje.
          </p>

          <div className="w-full bg-[#050D15]/80 border border-cyan/20 p-5 rounded-md flex flex-col items-center text-center">
            {confirmada ? (
              <>
                <div className="bg-green-500/10 border border-green-500/30 w-full p-4 rounded-md mb-1 flex flex-col items-center">
                  <span className="material-symbols-outlined text-green-400 text-[32px] mb-2">check_circle</span>
                  <p className="text-green-400 text-sm font-medium tracking-wide">Frequência Confirmada</p>
                  <p className="text-gray-400 text-xs mt-1">Sua presença foi registrada com sucesso.</p>
                </div>
                <Link
                  to="/dashboard"
                  className="w-full mt-2 border border-cyan/50 text-cyan hover:bg-cyan/10 transition-colors rounded py-2.5 text-xs font-bold tracking-widest uppercase block text-center"
                >
                  Ir para Dashboard
                </Link>
              </>
            ) : (
              <>
                <p className="text-gray-300 text-sm font-medium mb-5">
                  Ao confirmar, o sistema registrará seu comparecimento.
                </p>
                <button
                  onClick={confirmar}
                  disabled={carregando}
                  className="w-full border border-[#39ff14]/60 bg-[#021004]/80 hover:bg-[#07240c] transition-colors rounded-sm py-3 flex items-center justify-center gap-3 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[#39ff14] text-[20px]">how_to_reg</span>
                  <span className="font-headline font-bold text-[0.85rem] tracking-[0.15em] uppercase text-[#39ff14]">
                    Confirmar Presença
                  </span>
                </button>
                <Link
                  to="/dashboard"
                  className="w-full mt-3 text-gray-500 hover:text-white transition-colors text-[0.7rem] uppercase tracking-wider block text-center"
                >
                  Cancelar
                </Link>
              </>
            )}
          </div>
        </div>
      </HudContainer>
    </Layout>
  );
}
