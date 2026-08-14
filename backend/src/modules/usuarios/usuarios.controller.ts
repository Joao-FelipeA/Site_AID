import { Request, Response } from "express";
import { AppError } from "../../lib/appError";
import {
  alterarSenhaSchema,
  atualizarUsuarioSchema,
  criarUsuarioSchema,
  esqueciSenhaSchema,
  importarUsuariosSchema,
  loginSchema,
  substituirDiaAulaSchema,
} from "./usuarios.schema";
import * as usuariosService from "./usuarios.service";

function sanitizar<T extends { senha: string }>(usuario: T) {
  const { senha: _senha, ...resto } = usuario;
  return resto;
}

export async function listar(_req: Request, res: Response): Promise<void> {
  const usuarios = await usuariosService.listarUsuarios();
  res.json(usuarios.map(sanitizar));
}

export async function obterPorId(req: Request, res: Response): Promise<void> {
  const usuario = await usuariosService.obterUsuarioPorId(req.params.uuid);
  res.json(sanitizar(usuario));
}

export async function obterPerfil(req: Request, res: Response): Promise<void> {
  if (!req.usuario) throw new AppError(401, "Nao autenticado.");
  const usuario = await usuariosService.obterUsuarioPorId(req.usuario.sub);
  res.json(sanitizar(usuario));
}

export async function criar(req: Request, res: Response): Promise<void> {
  const input = criarUsuarioSchema.parse(req.body);
  const usuario = await usuariosService.criarUsuario(input);
  res.status(201).json(sanitizar(usuario));
}

export async function atualizar(req: Request, res: Response): Promise<void> {
  const input = atualizarUsuarioSchema.parse(req.body);
  const usuario = await usuariosService.atualizarUsuario(req.params.uuid, input);
  res.json(sanitizar(usuario));
}

export async function remover(req: Request, res: Response): Promise<void> {
  await usuariosService.deletarUsuario(req.params.uuid);
  res.status(204).send();
}

export async function substituirDia(req: Request, res: Response): Promise<void> {
  const { diaPedido1, diaPedido2 } = substituirDiaAulaSchema.parse(req.body);
  const { usuario, resultado } = await usuariosService.substituirDiaAula(req.params.uuid, diaPedido1, diaPedido2);
  res.json({ usuario: sanitizar(usuario), resultado });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, senha } = loginSchema.parse(req.body);
  const { token, usuario } = await usuariosService.login(email, senha);
  res.json({ token, usuario: sanitizar(usuario) });
}

export async function alterarSenha(req: Request, res: Response): Promise<void> {
  if (!req.usuario) throw new AppError(401, "Nao autenticado.");
  const { senhaAtual, novaSenha } = alterarSenhaSchema.parse(req.body);
  const usuario = await usuariosService.alterarSenhaPropria(req.usuario.sub, senhaAtual, novaSenha);
  res.json(sanitizar(usuario));
}

export async function esqueciSenha(req: Request, res: Response): Promise<void> {
  const { email } = esqueciSenhaSchema.parse(req.body);
  await usuariosService.solicitarResetSenha(email);
  res.json({
    mensagem: "Se esse email estiver cadastrado, um administrador vai receber sua solicitação de redefinição de senha.",
  });
}

export async function resetarSenha(req: Request, res: Response): Promise<void> {
  const { usuario, senhaPlana } = await usuariosService.resetarSenhaParaPadrao(req.params.uuid);
  res.json({ usuario: sanitizar(usuario), senhaPlana });
}

export async function importar(req: Request, res: Response): Promise<void> {
  const { spreadsheetIdOuUrl } = importarUsuariosSchema.parse(req.body);
  const resultado = await usuariosService.importarUsuariosDaPlanilha(spreadsheetIdOuUrl);
  res.json(resultado);
}
