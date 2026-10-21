import { bigint, doublePrecision, jsonb, pgTable, text } from "drizzle-orm/pg-core";

export type TrocaOleo = { data: string; km: string };

export const paineis = pgTable("paineis", {
  id: bigint({ mode: "number" }).primaryKey(),
  entradaTs: bigint("entrada_ts", { mode: "number" }).notNull(),
  modelo: text().notNull(),
  cliente: text().notNull().default("-"),
  telefone: text().notNull().default("-"),
  valor: doublePrecision().notNull().default(0),
  pagamento: text().notNull().default("A definir"),
  status: text().notNull().default("Em Andamento"),
  entrada: text().notNull(),
  saida: text().notNull().default("-"),
});

export const garantias = pgTable("garantias", {
  id: bigint({ mode: "number" }).primaryKey(),
  cliente: text().notNull(),
  telefone: text().notNull().default("-"),
  moto: text().notNull(),
  placa: text().notNull(),
  kmInicial: text("km_inicial").notNull(),
  dataInicial: text("data_inicial").notNull(),
  troca1: jsonb().$type<TrocaOleo | null>(),
  troca2: jsonb().$type<TrocaOleo | null>(),
  troca3: jsonb().$type<TrocaOleo | null>(),
  status: text().notNull().default("Em Andamento"),
});
