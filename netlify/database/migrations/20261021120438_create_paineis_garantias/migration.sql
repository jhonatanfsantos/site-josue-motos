CREATE TABLE "garantias" (
	"id" bigint PRIMARY KEY,
	"cliente" text NOT NULL,
	"telefone" text DEFAULT '-' NOT NULL,
	"moto" text NOT NULL,
	"placa" text NOT NULL,
	"km_inicial" text NOT NULL,
	"data_inicial" text NOT NULL,
	"troca1" jsonb,
	"troca2" jsonb,
	"troca3" jsonb,
	"status" text DEFAULT 'Em Andamento' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paineis" (
	"id" bigint PRIMARY KEY,
	"entrada_ts" bigint NOT NULL,
	"modelo" text NOT NULL,
	"cliente" text DEFAULT '-' NOT NULL,
	"telefone" text DEFAULT '-' NOT NULL,
	"valor" double precision DEFAULT 0 NOT NULL,
	"pagamento" text DEFAULT 'A definir' NOT NULL,
	"status" text DEFAULT 'Em Andamento' NOT NULL,
	"entrada" text NOT NULL,
	"saida" text DEFAULT '-' NOT NULL
);
