import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

interface ItemNav {
  chave: string;
  label: string;
  href: string;
}

function itensNav(logado: boolean, eAdmin: boolean): ItemNav[] {
  const primeiro: ItemNav = logado
    ? eAdmin
      ? { chave: "admin", label: "Painel Admin", href: "/admin" }
      : { chave: "dashboard", label: "Dashboard", href: "/dashboard" }
    : { chave: "login", label: "Entrar", href: "/login" };

  return [
    primeiro,
    { chave: "quem-somos", label: "Quem Nós Somos", href: "/quem-somos" },
    { chave: "doacao", label: "Doação", href: "/doacao" },
    { chave: "fale-conosco", label: "Fale Conosco", href: "/fale-conosco" },
  ];
}

export function Header() {
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);

  const links = itensNav(!!usuario, !!usuario?.eAdmin);

  function sair() {
    logout();
    setMenuAberto(false);
    navigate("/login");
  }

  return (
    <>
      <header className="w-full flex justify-between items-center px-6 md:px-12 py-3 border-b border-[rgba(0,212,255,0.15)] bg-[#040b12]/50 backdrop-blur-xl z-50">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="relative w-12 h-10 border border-cyan flex items-center justify-center rounded-md bg-cyan/10 shadow-[0_0_10px_rgba(0,212,255,0.4),inset_0_0_10px_rgba(0,212,255,0.2)] overflow-hidden"
          >
            <img src="/assets/logo-aid.png" alt="Logo Projeto AID" className="w-9 h-9 object-contain" />
            <div className="absolute left-[-2px] inset-y-2 w-[2px] bg-cyan shadow-[0_0_8px_#00d4ff]" />
          </Link>
          <div className="flex flex-col">
            <h1 className="font-headline text-lg font-bold tracking-wider leading-tight text-white m-0 uppercase">
              Projeto AID
            </h1>
            <span className="text-[0.55rem] text-cyan uppercase tracking-[0.2em]">
              Apoio à inclusão digital
            </span>
          </div>
        </div>

        <nav className="hidden md:flex gap-8 text-[0.7rem] font-headline font-semibold tracking-widest uppercase items-center">
          {links.map((link) => {
            const ativo = location.pathname === link.href;
            return (
              <Link
                key={link.chave}
                to={link.href}
                className={`relative flex flex-col group transition-colors ${ativo ? "text-white" : "text-gray-400 hover:text-white"}`}
              >
                <span>{link.label}</span>
                {ativo && (
                  <div className="absolute -bottom-[23px] left-0 w-full h-[2px] bg-cyan drop-shadow-[0_0_6px_#00d4ff]" />
                )}
              </Link>
            );
          })}
          {usuario && (
            <button
              onClick={sair}
              className="text-red-400 hover:text-red-300 transition-colors ml-4 border border-red-500/30 px-3 py-1 rounded text-[0.7rem]"
            >
              Sair ({usuario.nome})
            </button>
          )}
        </nav>

        <button
          className="md:hidden flex flex-col justify-center items-center gap-[6px] p-3 z-50 border border-cyan/30 rounded"
          onClick={() => setMenuAberto((a) => !a)}
        >
          <span
            className={`block w-7 h-[3px] bg-cyan rounded transition-all duration-300 shadow-[0_0_6px_#00d4ff] ${menuAberto ? "rotate-45 translate-y-[7px]" : ""}`}
          />
          <span className={`block w-7 h-[3px] bg-cyan rounded transition-all duration-300 shadow-[0_0_6px_#00d4ff] ${menuAberto ? "opacity-0" : ""}`} />
          <span
            className={`block w-7 h-[3px] bg-cyan rounded transition-all duration-300 shadow-[0_0_6px_#00d4ff] ${menuAberto ? "-rotate-45 -translate-y-[7px]" : ""}`}
          />
        </button>
      </header>

      <div
        className={`fixed inset-0 bg-[#040b12]/95 backdrop-blur-xl z-40 flex flex-col items-center justify-center gap-6 transition-all duration-300 md:hidden ${
          menuAberto ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {links.map((link) => {
          const ativo = location.pathname === link.href;
          return (
            <Link
              key={link.chave}
              to={link.href}
              onClick={() => setMenuAberto(false)}
              className={`text-lg font-headline font-semibold tracking-widest uppercase transition-colors hover:text-cyan ${ativo ? "text-cyan" : "text-gray-400"}`}
            >
              {link.label}
            </Link>
          );
        })}
        {usuario && (
          <button
            onClick={sair}
            className="text-red-400 hover:text-red-300 transition-colors border border-red-500/30 px-6 py-2 rounded mt-4 text-sm uppercase tracking-widest font-headline"
          >
            Sair ({usuario.nome})
          </button>
        )}
      </div>
    </>
  );
}
