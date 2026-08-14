-- DropForeignKey
ALTER TABLE "usuario_dia_aula" DROP CONSTRAINT IF EXISTS "usuario_dia_aula_usuario_uuid_fkey";

-- DropTable
DROP TABLE "usuario_dia_aula";

-- CreateEnum
CREATE TYPE "OrigemDiaAula" AS ENUM ('PRIMEIRA_OPCAO', 'SEGUNDA_OPCAO', 'REALOCADO');

-- AlterTable
ALTER TABLE "usuario"
  ADD COLUMN "dia_pedido_1" "DiaSemana",
  ADD COLUMN "dia_pedido_2" "DiaSemana",
  ADD COLUMN "dia_aula" "DiaSemana",
  ADD COLUMN "origem_dia_aula" "OrigemDiaAula";
