import { ORDEM_HORARIOS_ROBOTICA, labelHorarioRobotica } from "../lib/horarioRobotica";
import type { HorarioRobotica } from "../lib/types";

interface Props {
  id?: string;
  value: HorarioRobotica | "";
  onChange: (valor: HorarioRobotica | "") => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function SelectHorarioRobotica({ id, value, onChange, placeholder, required, className }: Props) {
  return (
    <select
      id={id}
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value as HorarioRobotica | "")}
      className={className ?? "bg-black border border-cyan/40 text-cyan text-sm rounded block w-full p-2"}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {ORDEM_HORARIOS_ROBOTICA.map((horario) => (
        <option key={horario} value={horario}>
          {labelHorarioRobotica(horario)}
        </option>
      ))}
    </select>
  );
}
