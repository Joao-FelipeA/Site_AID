import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Cria o primeiro administrador (necessario pois usuarios comuns nao se
 * auto-cadastram e admins criam as demais contas). Idempotente: so cria
 * se ainda nao existir um usuario com esse email.
 */
async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@cs.unipe.edu.br";
  const senhaPlana = process.env.SEED_ADMIN_SENHA ?? "admin@0000";

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    console.log(`Admin seed ja existe: ${email} (nada a fazer).`);
    return;
  }

  const senha = await bcrypt.hash(senhaPlana, 10);
  await prisma.usuario.create({
    data: {
      nome: "Administrador",
      email,
      rgm: "0000000000",
      senha,
      eAdmin: true,
    },
  });

  console.log(`Admin seed criado: ${email} / senha: ${senhaPlana}`);
  console.log("Troque a senha assim que possivel.");
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
