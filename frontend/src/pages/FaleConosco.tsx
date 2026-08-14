import { Layout } from "../components/Layout";

export function FaleConosco() {
  return (
    <Layout largura="max-w-4xl">
      <div className="w-full flex flex-col gap-8 mb-12">
        <div className="relative overflow-hidden rounded-xl border border-blue-500/30 bg-panel/80 p-8 shadow-[0_0_20px_rgba(59,130,246,0.05)] text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="text-4xl mb-3">💬</div>
          <h2 className="text-3xl md:text-4xl text-blue-400 font-headline font-bold mb-4 tracking-wider uppercase">
            Fale conosco
          </h2>
          <p className="text-gray-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-light">
            Entre em contato com a equipe do <strong className="text-white font-medium">Projeto AID</strong>.
            Estamos sempre disponíveis para tirar dúvidas, receber sugestões ou agendar entregas de doações.
          </p>
        </div>

        <div className="mt-2">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="font-headline text-lg text-blue-400 uppercase tracking-widest font-semibold flex-shrink-0">
              Canais de contato
            </h3>
            <div className="h-[1px] w-full bg-gradient-to-r from-blue-500/50 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-5 p-6 border border-blue-500/20 bg-panel/50 rounded-xl">
              <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[28px]">mail</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-widest text-gray-500 mb-1">E-mail</span>
                <a
                  href="mailto:contato@cs.unipe.edu.br"
                  className="text-white font-mono font-medium hover:text-blue-400 transition-colors"
                >
                  contato@cs.unipe.edu.br
                </a>
              </div>
            </div>

            <div className="flex items-center gap-5 p-6 border border-purple-500/20 bg-panel/50 rounded-xl md:col-span-2">
              <div className="w-14 h-14 rounded-full bg-purple-500/10 border border-purple-500/40 text-purple-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[28px]">location_on</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-widest text-gray-500 mb-1">Endereço</span>
                <span className="text-white font-medium">UNIPÊ, João Pessoa - PB</span>
              </div>
            </div>

            <div className="flex items-center gap-5 p-6 border border-orange-500/20 bg-panel/50 rounded-xl md:col-span-2">
              <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/40 text-orange-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[28px]">schedule</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-widest text-gray-500 mb-1">Horário de Atendimento</span>
                <span className="text-white font-medium">Segunda a Sexta, 14h às 17h</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
