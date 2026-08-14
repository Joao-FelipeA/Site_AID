import type { ReactNode } from "react";

interface ModalProps {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  corTitulo?: string;
  children: ReactNode;
}

export function Modal({ aberto, onFechar, titulo, corTitulo = "text-cyan", children }: ModalProps) {
  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) onFechar();
      }}
    >
      <div className="bg-[#0f0f0f] border border-cyan/40 rounded-md p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h4 className={`font-headline uppercase tracking-widest text-sm ${corTitulo}`}>{titulo}</h4>
          <button onClick={onFechar} className="text-gray-500 hover:text-white text-lg leading-none">
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
