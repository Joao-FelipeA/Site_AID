import { Layout } from "../components/Layout";

const ETAPAS = [
  { numero: 1, emoji: "📦", titulo: "Recebemos", texto: "Doações de eletrônicos usados" },
  { numero: 2, emoji: "🔧", titulo: "Avaliamos", texto: "Triagem e teste dos componentes" },
  { numero: 3, emoji: "🖥️", titulo: "Montamos", texto: "Computadores funcionais completos" },
  { numero: 4, emoji: "💚", titulo: "Doamos", texto: "Para quem mais precisa", destaque: true },
];

export function QuemSomos() {
  return (
    <Layout largura="max-w-4xl">
      <div className="w-full flex flex-col gap-8 mb-12">
        <div className="relative overflow-hidden rounded-xl border border-cyan/30 bg-panel/80 p-8 shadow-[0_0_20px_rgba(0,212,255,0.05)] text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan/10 blur-[80px] rounded-full pointer-events-none" />
          <h2 className="text-3xl md:text-4xl text-cyan font-headline font-bold mb-4 tracking-wider uppercase">
            Tecnologia para quem mais precisa
          </h2>
          <p className="text-gray-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-light">
            O <strong className="text-white font-medium">Projeto AID</strong> é uma iniciativa de extensão que
            recebe doações de eletrônicos, monta computadores funcionais e os doa gratuitamente para pessoas e
            famílias sem acesso ao mundo digital.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-2 bg-black/40 border border-cyan/20 px-4 py-2 rounded-full text-sm shadow-md">
            <span className="text-cyan material-symbols-outlined text-[18px]">schedule</span>
            <span className="text-gray-300">
              <strong className="text-white font-medium">Seg – Sex</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 bg-black/40 border border-cyan/20 px-4 py-2 rounded-full text-sm shadow-md">
            <span className="text-neon material-symbols-outlined text-[18px]">school</span>
            <span className="text-gray-300">Extensão universitária</span>
          </div>
        </div>

        <div className="mt-2">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="font-headline text-lg text-cyan uppercase tracking-widest font-semibold flex-shrink-0">
              Como funciona
            </h3>
            <div className="h-[1px] w-full bg-gradient-to-r from-cyan/50 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            <div className="hidden md:block absolute top-[40%] left-[10%] right-[10%] h-[2px] bg-cyan/20 z-0" />
            {ETAPAS.map((etapa) => (
              <div
                key={etapa.numero}
                className="flex flex-col items-center text-center p-4 bg-background/50 border border-cyan/10 rounded-lg relative z-10"
              >
                <div
                  className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold font-mono text-sm mb-3 ${
                    etapa.destaque ? "bg-neon/20 border-neon text-neon" : "bg-cyan/20 border-cyan text-cyan"
                  }`}
                >
                  {etapa.numero}
                </div>
                <div className="text-3xl mb-2">{etapa.emoji}</div>
                <div
                  className={`font-bold tracking-wide uppercase text-sm mb-1 ${etapa.destaque ? "text-neon" : "text-white"}`}
                >
                  {etapa.titulo}
                </div>
                <div className="text-xs text-gray-400">{etapa.texto}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
