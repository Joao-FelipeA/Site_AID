interface BannerProps {
  texto: string | null;
  tipo?: "erro" | "sucesso";
}

export function Banner({ texto, tipo = "erro" }: BannerProps) {
  if (!texto) return null;

  const cores =
    tipo === "erro"
      ? "bg-red-500/20 border-red-500 text-red-200"
      : "bg-green-500/20 border-green-500 text-green-200";

  return <div className={`${cores} border px-4 py-2 rounded-md text-sm text-center w-full`}>{texto}</div>;
}
