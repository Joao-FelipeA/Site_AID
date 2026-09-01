import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { HudContainer } from "../components/HudContainer";
import { Banner } from "../components/Banner";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { labelDiaSemana, labelOrigemDiaAula } from "../lib/diasSemana";
import { labelHorarioRobotica, labelOrigemRobotica } from "../lib/horarioRobotica";
import type { Usuario } from "../lib/types";

export function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<Usuario | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function sair() {
    logout();
    navigate("/login");
  }

  useEffect(() => {
    api
      .get<Usuario>("/usuarios/me")
      .then(setPerfil)
      .catch((e) => setErro(e instanceof ApiError ? e.message : "Falha ao carregar o dashboard."));
  }, []);

  return (
    <Layout>
      <Banner texto={erro} tipo="erro" />

      <HudContainer>
        <div className="flex flex-col items-center mb-4 w-full">
          <div className="mb-1.5 text-cyan drop-shadow-[0_0_12px_rgba(0,212,255,0.6)]">
            <span className="material-symbols-outlined text-[48px]">check_circle</span>
          </div>
          <h2 className="font-body text-2xl font-semibold text-white tracking-wide mb-1">Dashboard</h2>
          <p className="font-body text-[0.9rem] text-gray-400 mt-2 mb-4">
            BEM VINDO, <strong className="text-cyan">{perfil?.nome.toUpperCase() ?? "..."}</strong>!
          </p>

          <div className="bg-[#050D15]/50 border border-cyan/30 rounded-lg p-6 w-full text-center">
            <p className="text-green-400 font-mono text-sm mb-2">AUTENTICAÇÃO: OK</p>
            <p className="text-gray-300 font-mono text-xs">
              Frequência acumulada: <strong className="text-white">{perfil?.frequencia ?? 0}</strong> aula(s)
            </p>
          </div>

          <div className="w-full mt-4">
            <p className="font-body text-[0.6rem] text-gray-400 uppercase tracking-[0.15em] font-semibold mb-2 text-left">
              Seu dia de aula
            </p>
            {perfil && (
              <div className="flex flex-col gap-2 w-full">
                {perfil.diaAula ? (
                  <div className="flex items-center justify-between bg-[#050D15]/50 border border-cyan/20 rounded-md px-3 py-2">
                    <span className="text-sm text-white font-medium">{labelDiaSemana(perfil.diaAula)}</span>
                    {perfil.origemDiaAula && (
                      <span className="text-[10px] text-yellow-400 border border-yellow-500/40 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                        {labelOrigemDiaAula(perfil.origemDiaAula)}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-xs text-center py-2">Nenhum dia de aula atribuído ainda.</p>
                )}
              </div>
            )}
          </div>

          {perfil?.interesseRobotica && (
            <div className="w-full mt-4">
              <p className="font-body text-[0.6rem] text-gray-400 uppercase tracking-[0.15em] font-semibold mb-2 text-left">
                Robótica
              </p>
              <div className="flex flex-col gap-2 w-full">
                {perfil.horarioRobotica ? (
                  <div className="flex items-center justify-between bg-[#050D15]/50 border border-purple-400/30 rounded-md px-3 py-2">
                    <span className="text-sm text-white font-medium">
                      Sexta-feira, {labelHorarioRobotica(perfil.horarioRobotica)}
                    </span>
                    {perfil.origemHorarioRobotica === "REALOCADO" && (
                      <span className="text-[10px] text-yellow-400 border border-yellow-500/40 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                        {labelOrigemRobotica(perfil.origemHorarioRobotica)}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-xs text-center py-2">Nenhum horário de robótica atribuído ainda.</p>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 w-full">
            <button
              onClick={sair}
              className="w-full btn-outline-cyan rounded-md py-[8px] flex justify-center items-center"
            >
              <span className="font-headline font-bold text-[0.8rem] tracking-[0.1em] uppercase text-red-400">
                Sair do Sistema
              </span>
            </button>
          </div>
        </div>
      </HudContainer>
    </Layout>
  );
}
