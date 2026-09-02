import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Cria o primeiro administrador (necessario pois usuarios comuns nao se
 * auto-cadastram e admins criam as demais contas). Idempotente: so cria
 * se ainda nao existir um usuario com esse RGM.
 */
async function main() {
  const rgm = process.env.SEED_ADMIN_RGM ?? "0000000000";
  const senhaPlana = process.env.SEED_ADMIN_SENHA ?? "admin@0000";

  const existente = await prisma.usuario.findUnique({ where: { rgm } });
  if (existente) {
    console.log(`Admin seed ja existe: RGM ${rgm} (nada a fazer).`);
    return;
  }

  const senha = await bcrypt.hash(senhaPlana, 10);
  await prisma.usuario.create({
    data: {
      nome: "Administrador",
      rgm,
      senha,
      eAdmin: true,
    },
  });

  console.log(`Admin seed criado: RGM ${rgm} / senha: ${senhaPlana}`);
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
