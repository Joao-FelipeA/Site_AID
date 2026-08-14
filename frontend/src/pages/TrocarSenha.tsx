import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { HudContainer } from "../components/HudContainer";
import { Banner } from "../components/Banner";
import { api, ApiError } from "../lib/api";
import { useAuth, paginaInicialParaUsuario } from "../lib/auth";
import type { Usuario } from "../lib/types";

export function TrocarSenha() {
  const { atualizarUsuario } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (novaSenha !== confirmarSenha) {
      setErro("A nova senha e a confirmação não são iguais.");
      return;
    }

    setCarregando(true);
    try {
      const usuarioAtualizado = await api.put<Usuario>("/usuarios/me/senha", { senhaAtual, novaSenha });
      atualizarUsuario(usuarioAtualizado);
      navigate(params.get("redirect") || paginaInicialParaUsuario(usuarioAtualizado));
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Falha ao trocar a senha.");
      setCarregando(false);
    }
  }

  return (
    <Layout>
      <Banner texto={erro} tipo="erro" />

      <HudContainer>
        <div className="flex flex-col items-center mb-4">
          <div className="mb-1.5 text-yellow-400 drop-shadow-[0_0_12px_rgba(234,179,8,0.6)]">
            <span className="material-symbols-outlined text-[36px]">lock_reset</span>
          </div>
          <h2 className="font-body text-xl font-semibold text-white tracking-wide mb-1 text-center">
            Troque sua senha
          </h2>
          <p className="font-body text-[0.8rem] text-gray-400 max-w-[90%] leading-relaxed font-light text-center">
            Você ainda está usando a senha padrão. Por segurança, defina uma senha nova antes de continuar.
          </p>
        </div>

        <form onSubmit={salvar} className="w-full flex flex-col gap-4">
          <Campo label="Senha Atual" valor={senhaAtual} onChange={setSenhaAtual} />
          <Campo label="Nova Senha" valor={novaSenha} onChange={setNovaSenha} minLength={4} />
          <Campo label="Confirmar Nova Senha" valor={confirmarSenha} onChange={setConfirmarSenha} minLength={4} />

          <button
            type="submit"
            disabled={carregando}
            className="w-full mt-2 btn-neon-fill rounded-md py-[8px] flex justify-center items-center"
          >
            <span className="font-headline font-bold text-[0.95rem] tracking-[0.15em] uppercase text-[#040810]">
              Salvar Nova Senha
            </span>
          </button>
        </form>
      </HudContainer>
    </Layout>
  );
}

function Campo({
  label,
  valor,
  onChange,
  minLength,
}: {
  label: string;
  valor: string;
  onChange: (valor: string) => void;
  minLength?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center px-1">
        <span className="font-body text-[0.6rem] text-gray-300 uppercase tracking-[0.15em] font-semibold">
          {label}
        </span>
      </div>
      <div className="relative w-full rounded-md input-glow-border bg-[#050D15] flex items-center px-3 py-2.5">
        <input
          type="password"
          required
          minLength={minLength}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent border-none text-gray-400 text-base focus:outline-none focus:ring-0 p-0"
        />
      </div>
    </div>
  );
}
