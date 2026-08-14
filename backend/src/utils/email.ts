import { env } from "../config/env";

export function ehEmailAcademico(email: string): boolean {
  return email.trim().toLowerCase().endsWith(env.emailDominio.toLowerCase());
}
