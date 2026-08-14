-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "reset_senha_solicitado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reset_senha_solicitado_em" TIMESTAMP(3);
