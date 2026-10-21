import type { Config } from "@netlify/functions";
import { admin, AuthError, login, logout, verifyRequestOrigin } from "@netlify/identity";
import { isDono, ROLE_DONO, usuarioAtual } from "../lib/auth.mjs";

async function existeDono(): Promise<boolean> {
  const users = await admin.listUsers({ perPage: 100 });
  return users.some((u) => isDono(u));
}

function erro(mensagem: string, status: number) {
  return Response.json({ erro: mensagem }, { status });
}

export default async (req: Request) => {
  const acao = new URL(req.url).pathname.split("/").pop();

  if (req.method === "GET" && acao === "status") {
    const user = await usuarioAtual();
    return Response.json({
      logado: isDono(user),
      email: user?.email ?? null,
      primeiroAcesso: !(await existeDono()),
    });
  }

  if (req.method !== "POST") return erro("Método não permitido", 405);

  try {
    verifyRequestOrigin(req);
  } catch {
    return erro("Origem não permitida", 403);
  }

  if (acao === "logout") {
    await logout().catch(() => {});
    return Response.json({ ok: true });
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const senha = String(body.senha ?? "");
  if (!email || !senha) return erro("Informe e-mail e senha.", 400);

  if (acao === "primeiro-acesso") {
    // Só permite criar a conta do dono se ainda não existir nenhuma
    if (await existeDono()) return erro("A conta do dono já foi criada. Faça login.", 403);
    if (senha.length < 8) return erro("A senha precisa ter pelo menos 8 caracteres.", 400);
    try {
      await admin.createUser({ email, password: senha, data: { app_metadata: { roles: [ROLE_DONO] } } });
    } catch (e) {
      return erro(e instanceof AuthError ? e.message : "Não foi possível criar a conta.", 400);
    }
  } else if (acao !== "login") {
    return erro("Não encontrado", 404);
  }

  try {
    const user = await login(email, senha);
    if (!isDono(user)) {
      await logout().catch(() => {});
      return erro("Esta conta não tem acesso ao sistema.", 403);
    }
    return Response.json({ ok: true, email: user.email });
  } catch (e) {
    if (e instanceof AuthError && (e.status === 400 || e.status === 401)) {
      return erro("E-mail ou senha incorretos.", 401);
    }
    return erro("Não foi possível entrar. Tente novamente.", 500);
  }
};

export const config: Config = {
  path: "/api/auth/:acao",
};
