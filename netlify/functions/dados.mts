import type { Config } from "@netlify/functions";
import { verifyRequestOrigin } from "@netlify/identity";
import { desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { garantias, paineis, type TrocaOleo } from "../../db/schema.js";
import { isDono, usuarioAtual } from "../lib/auth.mjs";

const txt = (v: unknown, padrao = "-", max = 200) => {
  const s = String(v ?? "").trim().slice(0, max);
  return s || padrao;
};

const idValido = (v: unknown) => {
  const n = Number(v);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
};

const troca = (v: any): TrocaOleo | null =>
  v && typeof v === "object" ? { data: txt(v.data), km: txt(v.km, "-", 20) } : null;

function lerPainel(p: any) {
  const id = idValido(p?.id);
  if (!id) return null;
  return {
    id,
    entradaTs: idValido(p.entradaTs) ?? id,
    modelo: txt(p.modelo),
    cliente: txt(p.cliente),
    telefone: txt(p.telefone, "-", 40),
    valor: Number.isFinite(Number(p.valor)) ? Number(p.valor) : 0,
    pagamento: txt(p.pagamento, "A definir", 30),
    status: p.status === "Finalizado" ? "Finalizado" : "Em Andamento",
    entrada: txt(p.entrada, "-", 40),
    saida: txt(p.saida, "-", 40),
  };
}

function lerGarantia(g: any) {
  const id = idValido(g?.id);
  if (!id) return null;
  return {
    id,
    cliente: txt(g.cliente),
    telefone: txt(g.telefone, "-", 40),
    moto: txt(g.moto),
    placa: txt(g.placa, "-", 20).toUpperCase(),
    kmInicial: txt(g.kmInicial, "-", 20),
    dataInicial: txt(g.dataInicial, "-", 40),
    troca1: troca(g.troca1),
    troca2: troca(g.troca2),
    troca3: troca(g.troca3),
    status: g.status === "Concluído" ? "Concluído" : "Em Andamento",
  };
}

async function listarTudo() {
  const [p, g] = await Promise.all([
    db.select().from(paineis).orderBy(desc(paineis.id)),
    db.select().from(garantias).orderBy(desc(garantias.id)),
  ]);
  return { paineis: p, garantias: g };
}

export default async (req: Request) => {
  if (!isDono(await usuarioAtual())) {
    return Response.json({ erro: "Sessão expirada. Faça login novamente." }, { status: 401 });
  }

  const [, , recurso, id] = new URL(req.url).pathname.split("/");

  if (req.method === "GET" && recurso === "dados") {
    return Response.json(await listarTudo());
  }

  try {
    verifyRequestOrigin(req);
  } catch {
    return Response.json({ erro: "Origem não permitida" }, { status: 403 });
  }

  // Envia de uma vez os registros que estavam salvos só no navegador
  if (req.method === "POST" && recurso === "importar") {
    const body = await req.json().catch(() => ({}));
    const novosPaineis = (Array.isArray(body.paineis) ? body.paineis : []).map(lerPainel).filter(Boolean);
    const novasGarantias = (Array.isArray(body.garantias) ? body.garantias : []).map(lerGarantia).filter(Boolean);
    if (novosPaineis.length) await db.insert(paineis).values(novosPaineis).onConflictDoNothing();
    if (novasGarantias.length) await db.insert(garantias).values(novasGarantias).onConflictDoNothing();
    return Response.json(await listarTudo());
  }

  const tabela = recurso === "paineis" ? paineis : recurso === "garantias" ? garantias : null;
  const registroId = idValido(id);
  if (!tabela || !registroId) return Response.json({ erro: "Não encontrado" }, { status: 404 });

  if (req.method === "PUT") {
    const body = await req.json().catch(() => null);
    const registro = tabela === paineis ? lerPainel({ ...body, id: registroId }) : lerGarantia({ ...body, id: registroId });
    if (!registro) return Response.json({ erro: "Dados inválidos" }, { status: 400 });
    const { id: _, ...campos } = registro;
    await db.insert(tabela).values(registro as any).onConflictDoUpdate({ target: tabela.id, set: campos as any });
    return Response.json(registro);
  }

  if (req.method === "DELETE") {
    await db.delete(tabela).where(eq(tabela.id, registroId));
    return new Response(null, { status: 204 });
  }

  return Response.json({ erro: "Método não permitido" }, { status: 405 });
};

export const config: Config = {
  path: ["/api/dados", "/api/importar", "/api/paineis/:id", "/api/garantias/:id"],
};
