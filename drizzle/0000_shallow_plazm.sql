CREATE TYPE "public"."reminder_type" AS ENUM('7d', '3d', '1d');--> statement-breakpoint
CREATE TABLE "miembros" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"correo" text NOT NULL,
	"telefono" text,
	"documento" text,
	"contacto_emergencia" text,
	"fecha_nacimiento" date,
	"fecha_inicio" date NOT NULL,
	"fecha_vencimiento" date NOT NULL,
	"creado_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pagos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"miembro_id" uuid NOT NULL,
	"fecha_pago" date NOT NULL,
	"monto" numeric,
	"registrado_por" uuid,
	"creado_en" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recordatorios_enviados" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"miembro_id" uuid NOT NULL,
	"tipo" "reminder_type" NOT NULL,
	"fecha_vencimiento" date NOT NULL,
	"fecha_envio" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recordatorios_enviados_miembro_id_tipo_fecha_vencimiento_unique" UNIQUE("miembro_id","tipo","fecha_vencimiento")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_miembro_id_miembros_id_fk" FOREIGN KEY ("miembro_id") REFERENCES "public"."miembros"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_registrado_por_users_id_fk" FOREIGN KEY ("registrado_por") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recordatorios_enviados" ADD CONSTRAINT "recordatorios_enviados_miembro_id_miembros_id_fk" FOREIGN KEY ("miembro_id") REFERENCES "public"."miembros"("id") ON DELETE cascade ON UPDATE no action;