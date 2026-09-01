import { useEffect, useState, type ReactNode } from "react";
import { Layout } from "../../components/Layout";
import { Banner } from "../../components/Banner";
import { UsuariosTab } from "./UsuariosTab";
import { AulasTab } from "./AulasTab";
import { AulaRoboticaTab } from "./AulaRoboticaTab";
import { DoacoesTab } from "./DoacoesTab";
import { api, ApiError } from "../../lib/api";
import type { Usuario } from "../../lib/types";

type Aba = "usuarios" | "aulas" | "robotica" | "doacoes";
export type MostrarMensagem = (texto: string, tipo?: "erro" | "sucesso") => void;

export function AdminDashboard() {
  const [aba, setAba] = useState<Aba>("usuarios");
  const [mensagem, setMensagem] = useState<{ texto: string; tipo: "erro" | "sucesso" } | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const mostrarMensagem: MostrarMensagem = (texto, tipo = "erro") => setMensagem({ texto, tipo });

  async function recarregarUsuarios() {
    const dados = await api.get<Usuario[]>("/usuarios");
    setUsuarios(dados);
  }

  useEffect(() => {
    recarregarUsuarios().catch((e) =>
      mostrarMensagem(e instanceof ApiError ? e.message : "Falha ao carregar usuários."),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalAdmins = usuarios.filter((u) => u.eAdmin).length;
  const totalFrequencia = usuarios.reduce((soma, u) => soma + u.frequencia, 0);

  return (
    <Layout largura="max-w-6xl">
      <div className="w-full flex flex-col gap-6 mb-12">
        <Banner texto={mensagem?.texto ?? null} tipo={mensagem?.tipo} />

        <div className="rounded-md border border-cyan/30 bg-panel/80 p-6 shadow-[0_0_15px_rgba(0,212,255,0.1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan/10 blur-[50px] rounded-full pointer-events-none" />
          <p className="text-cyan text-xs uppercase tracking-widest mb-1">Painel Administrativo</p>
          <p className="text-2xl text-white font-headline font-semibold">Dashboard Central</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Metrica valor={usuarios.length} label="👥 Usuários" cor="text-cyan" borda="border-cyan/20" />
          <Metrica valor={totalAdmins} label="🛡️ Admins" cor="text-neon" borda="border-neon/30" />
          <Metrica valor={totalFrequencia} label="📝 Frequência total" cor="text-cyan" borda="border-cyan/20" />
        </div>

        <div className="flex flex-wrap gap-2 border-b border-cyan/20 pb-2 mt-2">
          <TabButton ativo={aba === "usuarios"} onClick={() => setAba("usuarios")}>
            Usuários
          </TabButton>
          <TabButton ativo={aba === "aulas"} onClick={() => setAba("aulas")}>
            Aulas
          </TabButton>
          <TabButton ativo={aba === "robotica"} onClick={() => setAba("robotica")}>
            Robótica
          </TabButton>
          <TabButton ativo={aba === "doacoes"} onClick={() => setAba("doacoes")}>
            Doações
          </TabButton>
        </div>

        {aba === "usuarios" && (
          <UsuariosTab usuarios={usuarios} recarregar={recarregarUsuarios} mostrarMensagem={mostrarMensagem} />
        )}
        {aba === "aulas" && <AulasTab mostrarMensagem={mostrarMensagem} />}
        {aba === "robotica" && <AulaRoboticaTab mostrarMensagem={mostrarMensagem} />}
        {aba === "doacoes" && <DoacoesTab mostrarMensagem={mostrarMensagem} />}
      </div>
    </Layout>
  );
}

function Metrica({ valor, label, cor, borda }: { valor: number; label: string; cor: string; borda: string }) {
  return (
    <div className={`border ${borda} bg-background/50 p-4 rounded-md flex flex-col items-center justify-center`}>
      <div className={`text-3xl font-mono ${cor}`}>{valor}</div>
      <div className="text-xs uppercase text-gray-400 tracking-wider">{label}</div>
    </div>
  );
}

function TabButton({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-headline tracking-wider uppercase border-b-2 transition-all ${
        ativo ? "text-cyan border-cyan bg-cyan/10" : "text-gray-400 border-transparent hover:text-cyan"
      }`}
    >
      {children}
    </button>
  );
}
