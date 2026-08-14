import { ORDEM_DIAS_SEMANA, labelDiaSemana } from "../lib/diasSemana";
import type { DiaSemana } from "../lib/types";

interface Props {
  id?: string;
  value: DiaSemana | "";
  onChange: (valor: DiaSemana | "") => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function SelectDiaSemana({ id, value, onChange, placeholder, required, className }: Props) {
  return (
    <select
      id={id}
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value as DiaSemana | "")}
      className={className ?? "bg-black border border-cyan/40 text-cyan text-sm rounded block w-full p-2"}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {ORDEM_DIAS_SEMANA.map((dia) => (
        <option key={dia} value={dia}>
          {labelDiaSemana(dia)}
        </option>
      ))}
    </select>
  );
}
