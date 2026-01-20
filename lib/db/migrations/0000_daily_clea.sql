CREATE TYPE "public"."job_department" AS ENUM('engineering', 'sales', 'marketing', 'hr', 'finance', 'operations', 'design', 'product', 'customer_success', 'legal', 'other');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'qualified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."search_status" AS ENUM('active', 'paused', 'completed');--> statement-breakpoint
CREATE TABLE "ai_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"suggestions" jsonb NOT NULL,
	"data_hash" varchar(64),
	"refresh_count" integer DEFAULT 0 NOT NULL,
	"refresh_count_reset_at" timestamp with time zone,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar(255) NOT NULL,
	"search_id" uuid,
	"name" varchar(255) NOT NULL,
	"domain" varchar(255),
	"industry" varchar(255),
	"size" varchar(100),
	"location" varchar(255),
	"description" text,
	"logo_url" text,
	"linkedin_url" text,
	"website_url" text,
	"is_enriched" boolean DEFAULT false,
	"enriched_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"credit_type" varchar(50) NOT NULL,
	"transaction_type" varchar(100) NOT NULL,
	"credits_used" integer NOT NULL,
	"balance_after" integer,
	"description" text,
	"search_id" uuid,
	"company_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar(255) NOT NULL,
	"enrichment_limit" integer DEFAULT 200 NOT NULL,
	"icp_limit" integer DEFAULT 1000 NOT NULL,
	"enrichment_used" integer DEFAULT 0 NOT NULL,
	"icp_used" integer DEFAULT 0 NOT NULL,
	"billing_cycle_start" timestamp with time zone DEFAULT now() NOT NULL,
	"billing_cycle_end" timestamp with time zone NOT NULL,
	"plan_id" varchar(50) DEFAULT 'free',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credit_usage_org_id_unique" UNIQUE("org_id")
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar(255) NOT NULL,
	"company_id" uuid NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"job_title" varchar(255),
	"linkedin_url" text,
	"location" varchar(255),
	"seniority" varchar(100),
	"department" varchar(255),
	"is_shortlisted" boolean DEFAULT false,
	"apollo_id" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrichment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"transaction_type" varchar(50) NOT NULL,
	"credits_used" integer NOT NULL,
	"company_id" uuid,
	"search_id" uuid,
	"employee_count" integer,
	"cache_hit" boolean DEFAULT false,
	"apollo_calls_made" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"employees_last_fetched_at" timestamp with time zone,
	"employees_count" integer DEFAULT 0,
	"enrichment_source" varchar(50),
	"industry" varchar(255),
	"size" varchar(100),
	"location" varchar(255),
	"linkedin_url" text,
	"website_url" text,
	"logo_url" text,
	"description" text,
	"metadata" jsonb,
	"stale_after_days" integer DEFAULT 30,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "global_companies_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "global_employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"apollo_id" varchar(255) NOT NULL,
	"company_domain" varchar(255) NOT NULL,
	"company_name" varchar(255),
	"company_linkedin_url" text,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"job_title" varchar(255),
	"linkedin_url" text,
	"location" varchar(255),
	"seniority" varchar(100),
	"department" varchar(255),
	"metadata" jsonb,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "global_employees_apollo_id_unique" UNIQUE("apollo_id")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar(255) NOT NULL,
	"company_id" uuid,
	"search_id" uuid,
	"external_id" varchar(255),
	"title" varchar(500) NOT NULL,
	"job_url" text,
	"location" varchar(255),
	"salary" varchar(255),
	"contract_type" varchar(100),
	"experience_level" varchar(100),
	"work_type" varchar(100),
	"sector" varchar(255),
	"department" "job_department",
	"tech_stack" jsonb,
	"description" text,
	"posted_time" varchar(100),
	"published_at" timestamp with time zone,
	"applications_count" varchar(100),
	"apply_url" text,
	"apply_type" varchar(50),
	"poster_name" varchar(255),
	"poster_url" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar(255) NOT NULL,
	"company_id" uuid,
	"employee_id" uuid,
	"search_id" uuid,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"job_title" varchar(255),
	"linkedin_url" text,
	"location" varchar(255),
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"enrichment_limit" integer,
	"icp_limit" integer,
	"enrichment_used" integer DEFAULT 0 NOT NULL,
	"icp_used" integer DEFAULT 0 NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "org_members_org_user_unique" UNIQUE("org_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255),
	"image_url" text,
	"created_by" varchar(255),
	"max_members" integer DEFAULT 5,
	"plan" varchar(50) DEFAULT 'free',
	"credits_used" integer DEFAULT 0,
	"credits_limit" integer DEFAULT 30,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "scraper_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"search_id" uuid NOT NULL,
	"org_id" varchar(255) NOT NULL,
	"scraper_index" integer,
	"scraper_config" jsonb,
	"status" varchar(50) NOT NULL,
	"jobs_found" integer DEFAULT 0,
	"companies_found" integer DEFAULT 0,
	"new_companies" integer DEFAULT 0,
	"leads_created" integer DEFAULT 0,
	"duration" integer,
	"error_message" text,
	"apify_run_id" varchar(255),
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"filters" jsonb,
	"status" "search_status" DEFAULT 'active' NOT NULL,
	"results_count" integer DEFAULT 0,
	"jobs_count" integer DEFAULT 0,
	"last_run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_search_id_searches_id_fk" FOREIGN KEY ("search_id") REFERENCES "public"."searches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_history" ADD CONSTRAINT "credit_history_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_history" ADD CONSTRAINT "credit_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_history" ADD CONSTRAINT "credit_history_search_id_searches_id_fk" FOREIGN KEY ("search_id") REFERENCES "public"."searches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_history" ADD CONSTRAINT "credit_history_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_usage" ADD CONSTRAINT "credit_usage_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrichment_transactions" ADD CONSTRAINT "enrichment_transactions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrichment_transactions" ADD CONSTRAINT "enrichment_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrichment_transactions" ADD CONSTRAINT "enrichment_transactions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrichment_transactions" ADD CONSTRAINT "enrichment_transactions_search_id_searches_id_fk" FOREIGN KEY ("search_id") REFERENCES "public"."searches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_search_id_searches_id_fk" FOREIGN KEY ("search_id") REFERENCES "public"."searches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_search_id_searches_id_fk" FOREIGN KEY ("search_id") REFERENCES "public"."searches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scraper_runs" ADD CONSTRAINT "scraper_runs_search_id_searches_id_fk" FOREIGN KEY ("search_id") REFERENCES "public"."searches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scraper_runs" ADD CONSTRAINT "scraper_runs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "searches" ADD CONSTRAINT "searches_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "searches" ADD CONSTRAINT "searches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_suggestions_org_id_type_idx" ON "ai_suggestions" USING btree ("org_id","type");--> statement-breakpoint
CREATE INDEX "companies_org_id_idx" ON "companies" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "companies_search_id_idx" ON "companies" USING btree ("search_id");--> statement-breakpoint
CREATE INDEX "companies_created_at_idx" ON "companies" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "credit_history_org_id_idx" ON "credit_history" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "credit_history_created_at_idx" ON "credit_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "employees_company_id_idx" ON "employees" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "employees_org_id_idx" ON "employees" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "jobs_company_id_idx" ON "jobs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "jobs_search_id_idx" ON "jobs" USING btree ("search_id");--> statement-breakpoint
CREATE INDEX "jobs_org_id_idx" ON "jobs" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "leads_company_id_idx" ON "leads" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "leads_org_id_idx" ON "leads" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "leads_search_id_idx" ON "leads" USING btree ("search_id");--> statement-breakpoint
CREATE INDEX "org_members_org_id_idx" ON "organization_members" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "org_members_user_id_idx" ON "organization_members" USING btree ("user_id");