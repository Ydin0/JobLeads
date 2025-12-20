import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  integer,
  jsonb,
  boolean,
  pgEnum,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const searchStatusEnum = pgEnum("search_status", [
  "active",
  "paused",
  "completed",
]);

export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "qualified",
  "rejected",
]);

export const memberRoleEnum = pgEnum("member_role", [
  "owner",
  "admin",
  "member",
]);

// Users table - synced from Clerk
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(), // Clerk user ID
  email: varchar("email", { length: 255 }).notNull().unique(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Organizations table - synced from Clerk
export const organizations = pgTable("organizations", {
  id: varchar("id", { length: 255 }).primaryKey(), // Clerk org ID
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique(),
  imageUrl: text("image_url"),
  createdBy: varchar("created_by", { length: 255 }).references(() => users.id),
  maxMembers: integer("max_members").default(5),
  // Subscription/plan info
  plan: varchar("plan", { length: 50 }).default("free"),
  creditsUsed: integer("credits_used").default(0),
  creditsLimit: integer("credits_limit").default(30),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Organization members - tracks which users belong to which orgs
export const organizationMembers = pgTable("organization_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: varchar("org_id", { length: 255 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  role: memberRoleEnum("role").default("member").notNull(),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),

  // Per-member credit limits (null = unlimited, use org defaults)
  enrichmentLimit: integer("enrichment_limit"), // null = unlimited
  icpLimit: integer("icp_limit"), // null = unlimited

  // Per-member usage tracking (reset monthly with org)
  enrichmentUsed: integer("enrichment_used").default(0).notNull(),
  icpUsed: integer("icp_used").default(0).notNull(),

  // Admin controls
  isBlocked: boolean("is_blocked").default(false).notNull(), // Quick way to block spending

  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("org_members_org_id_idx").on(table.orgId),
  index("org_members_user_id_idx").on(table.userId),
  unique("org_members_org_user_unique").on(table.orgId, table.userId),
]);

// Searches table - saved search queries
export const searches = pgTable("searches", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: varchar("org_id", { length: 255 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  filters: jsonb("filters").$type<{
    jobTitles?: string[];
    locations?: string[];
    industries?: string[];
    companySize?: string[];
    companyNames?: string[];
    companyIds?: string[];
    keywords?: string[];
    // ICP configuration
    departments?: string[];
    techStack?: string[];
    minJobs?: number;
    // Scraper configurations
    scrapers?: Array<{
      jobTitle: string;
      location: string;
      experienceLevel: string;
    }>;
    jobBoards?: string[];
    maxRows?: number;
    // Enrichment filter preferences (saved for quick re-enrichment)
    enrichmentFilters?: {
      decisionMakerTitles?: string[];
      decisionMakerSeniorities?: string[];
      lastUsedAt?: string;
    };
  }>(),
  status: searchStatusEnum("status").default("active").notNull(),
  resultsCount: integer("results_count").default(0),
  jobsCount: integer("jobs_count").default(0),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Companies table - companies found from searches
export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: varchar("org_id", { length: 255 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  searchId: uuid("search_id").references(() => searches.id, { onDelete: "set null" }),
  name: varchar("name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }),
  industry: varchar("industry", { length: 255 }),
  size: varchar("size", { length: 100 }),
  location: varchar("location", { length: 255 }),
  description: text("description"),
  logoUrl: text("logo_url"),
  linkedinUrl: text("linkedin_url"),
  websiteUrl: text("website_url"),
  isEnriched: boolean("is_enriched").default(false),
  enrichedAt: timestamp("enriched_at", { withTimezone: true }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("companies_org_id_idx").on(table.orgId),
  index("companies_search_id_idx").on(table.searchId),
  index("companies_created_at_idx").on(table.createdAt),
]);

// Job department categories
export const jobDepartmentEnum = pgEnum("job_department", [
  "engineering",
  "sales",
  "marketing",
  "hr",
  "finance",
  "operations",
  "design",
  "product",
  "customer_success",
  "legal",
  "other",
]);

// Jobs table - raw job postings from searches
export const jobs = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: varchar("org_id", { length: 255 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
  searchId: uuid("search_id").references(() => searches.id, { onDelete: "set null" }),
  externalId: varchar("external_id", { length: 255 }), // LinkedIn job ID
  title: varchar("title", { length: 500 }).notNull(),
  jobUrl: text("job_url"),
  location: varchar("location", { length: 255 }),
  salary: varchar("salary", { length: 255 }),
  contractType: varchar("contract_type", { length: 100 }),
  experienceLevel: varchar("experience_level", { length: 100 }),
  workType: varchar("work_type", { length: 100 }),
  sector: varchar("sector", { length: 255 }),
  department: jobDepartmentEnum("department"), // Categorized department
  techStack: jsonb("tech_stack").$type<string[]>(), // Extracted technologies
  description: text("description"),
  postedTime: varchar("posted_time", { length: 100 }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  applicationsCount: varchar("applications_count", { length: 100 }),
  applyUrl: text("apply_url"),
  applyType: varchar("apply_type", { length: 50 }),
  posterName: varchar("poster_name", { length: 255 }),
  posterUrl: text("poster_url"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("jobs_company_id_idx").on(table.companyId),
  index("jobs_search_id_idx").on(table.searchId),
  index("jobs_org_id_idx").on(table.orgId),
]);

// Employees table - all contacts found from company enrichment
export const employees = pgTable("employees", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: varchar("org_id", { length: 255 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  jobTitle: varchar("job_title", { length: 255 }),
  linkedinUrl: text("linkedin_url"),
  location: varchar("location", { length: 255 }),
  seniority: varchar("seniority", { length: 100 }),
  department: varchar("department", { length: 255 }),
  isShortlisted: boolean("is_shortlisted").default(false),
  apolloId: varchar("apollo_id", { length: 255 }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("employees_company_id_idx").on(table.companyId),
  index("employees_org_id_idx").on(table.orgId),
]);

// Leads table - shortlisted contacts for outreach
export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: varchar("org_id", { length: 255 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "set null" }),
  searchId: uuid("search_id").references(() => searches.id, { onDelete: "set null" }),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  jobTitle: varchar("job_title", { length: 255 }),
  linkedinUrl: text("linkedin_url"),
  location: varchar("location", { length: 255 }),
  status: leadStatusEnum("status").default("new").notNull(),
  notes: text("notes"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("leads_company_id_idx").on(table.companyId),
  index("leads_org_id_idx").on(table.orgId),
  index("leads_search_id_idx").on(table.searchId),
]);

// ============================================
// GLOBAL CACHE TABLES (not org-scoped)
// ============================================

// Global employees cache - stores all employees fetched from Apollo across the platform
export const globalEmployees = pgTable("global_employees", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Apollo identification (unique constraint for deduplication)
  apolloId: varchar("apollo_id", { length: 255 }).unique().notNull(),

  // Company identification (global lookup key)
  companyDomain: varchar("company_domain", { length: 255 }).notNull(),
  companyName: varchar("company_name", { length: 255 }),
  companyLinkedinUrl: text("company_linkedin_url"),

  // Employee data
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  jobTitle: varchar("job_title", { length: 255 }),
  linkedinUrl: text("linkedin_url"),
  location: varchar("location", { length: 255 }),
  seniority: varchar("seniority", { length: 100 }),
  department: varchar("department", { length: 255 }),

  // Extended metadata from Apollo
  metadata: jsonb("metadata").$type<{
    departments?: string[];
    phoneNumbers?: Array<{ raw_number?: string; sanitized_number?: string; type?: string; status?: string }>;
    employmentHistory?: unknown[];
  }>(),

  // Data freshness tracking
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
  lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Global companies cache - tracks which companies have been enriched globally
export const globalCompanies = pgTable("global_companies", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Primary identifiers (domain is the unique lookup key)
  domain: varchar("domain", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),

  // Enrichment tracking
  employeesLastFetchedAt: timestamp("employees_last_fetched_at", { withTimezone: true }),
  employeesCount: integer("employees_count").default(0),
  enrichmentSource: varchar("enrichment_source", { length: 50 }), // 'apollo', 'linkedin'

  // Company data (from LinkedIn/Apollo)
  industry: varchar("industry", { length: 255 }),
  size: varchar("size", { length: 100 }),
  location: varchar("location", { length: 255 }),
  linkedinUrl: text("linkedin_url"), // TODO: Add unique constraint after cleaning duplicates
  websiteUrl: text("website_url"),
  logoUrl: text("logo_url"),
  description: text("description"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),

  // Data freshness configuration
  staleAfterDays: integer("stale_after_days").default(30),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Enrichment transactions - audit trail for credit consumption
export const enrichmentTransactions = pgTable("enrichment_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: varchar("org_id", { length: 255 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),

  // Transaction details
  transactionType: varchar("transaction_type", { length: 50 }).notNull(), // 'company_enrich', 'bulk_enrich', 'employee_enrich'
  creditsUsed: integer("credits_used").notNull(),

  // Reference data
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  searchId: uuid("search_id").references(() => searches.id, { onDelete: "set null" }),
  employeeCount: integer("employee_count"), // How many employees were enriched

  // Cache metrics
  cacheHit: boolean("cache_hit").default(false), // True if data came from global cache
  apolloCallsMade: integer("apollo_calls_made").default(0),

  // Filter metadata
  metadata: jsonb("metadata").$type<{
    filters?: { titles?: string[]; seniorities?: string[] };
    sourceCompanyDomain?: string;
    globalEmployeeIds?: string[];
    fetchAll?: boolean;
    companyIds?: string[];
  }>(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Credit usage - tracks credit limits and usage per organization with billing cycles
export const creditUsage = pgTable("credit_usage", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: varchar("org_id", { length: 255 }).notNull().references(() => organizations.id, { onDelete: "cascade" }).unique(),

  // Credit limits (from subscription plan)
  enrichmentLimit: integer("enrichment_limit").notNull().default(200),
  icpLimit: integer("icp_limit").notNull().default(1000),

  // Current usage (reset monthly)
  enrichmentUsed: integer("enrichment_used").notNull().default(0),
  icpUsed: integer("icp_used").notNull().default(0),

  // Billing cycle
  billingCycleStart: timestamp("billing_cycle_start", { withTimezone: true }).defaultNow().notNull(),
  billingCycleEnd: timestamp("billing_cycle_end", { withTimezone: true }).notNull(),

  // Plan info
  planId: varchar("plan_id", { length: 50 }).default("free"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Credit history - unified audit trail for all credit consumption
export const creditHistory = pgTable("credit_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: varchar("org_id", { length: 255 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),

  // Credit type: 'enrichment' or 'icp'
  creditType: varchar("credit_type", { length: 50 }).notNull(),

  // Transaction type (describes what action consumed the credits)
  transactionType: varchar("transaction_type", { length: 100 }).notNull(),
  // enrichment: 'company_enrich', 'bulk_enrich', 'employee_fetch'
  // icp: 'scraper_run', 'job_import'

  // Credits consumed (always positive)
  creditsUsed: integer("credits_used").notNull(),

  // Running balance after this transaction
  balanceAfter: integer("balance_after"),

  // Human-readable description
  description: text("description"),

  // Reference IDs for linking to related records
  searchId: uuid("search_id").references(() => searches.id, { onDelete: "set null" }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),

  // Additional metadata
  metadata: jsonb("metadata").$type<{
    scraperConfig?: { jobTitle: string; location: string };
    companiesReturned?: number;
    employeesEnriched?: number;
    cacheHit?: boolean;
    filters?: Record<string, unknown>;
  }>(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("credit_history_org_id_idx").on(table.orgId),
  index("credit_history_created_at_idx").on(table.createdAt),
]);

// Scraper runs - tracks execution history of job scrapers
export const scraperRuns = pgTable("scraper_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  searchId: uuid("search_id").notNull().references(() => searches.id, { onDelete: "cascade" }),
  orgId: varchar("org_id", { length: 255 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),

  // Which scraper config was run
  scraperIndex: integer("scraper_index"), // Index in the scrapers array, null if combined run
  scraperConfig: jsonb("scraper_config").$type<{
    jobTitle: string;
    location: string;
    experienceLevel: string;
  }>(),

  // Execution status
  status: varchar("status", { length: 50 }).notNull(), // 'running', 'completed', 'failed'

  // Results metrics
  jobsFound: integer("jobs_found").default(0),
  companiesFound: integer("companies_found").default(0),
  newCompanies: integer("new_companies").default(0), // Deduplicated new companies added
  leadsCreated: integer("leads_created").default(0),

  // Execution metadata
  duration: integer("duration"), // Execution duration in seconds
  errorMessage: text("error_message"),
  apifyRunId: varchar("apify_run_id", { length: 255 }), // For debugging/reference

  // Timestamps
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

// AI Suggestions cache - stores generated AI insights per organization
export const aiSuggestions = pgTable("ai_suggestions", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: varchar("org_id", { length: 255 }).notNull().references(() => organizations.id, { onDelete: "cascade" }),

  // Suggestion type (allows different caches for different contexts)
  type: varchar("type", { length: 50 }).notNull(), // 'dashboard', 'icp', 'company'

  // Cached suggestions data
  suggestions: jsonb("suggestions").$type<Array<{
    type: 'action' | 'insight' | 'tip' | 'warning';
    priority: 'high' | 'normal';
    title: string;
    description: string;
    action?: { label: string; href: string };
    aiGenerated: boolean;
  }>>().notNull(),

  // Data hash for staleness detection (hash of input data)
  dataHash: varchar("data_hash", { length: 64 }),

  // Rate limiting
  refreshCount: integer("refresh_count").default(0).notNull(),
  refreshCountResetAt: timestamp("refresh_count_reset_at", { withTimezone: true }),

  // Timestamps
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("ai_suggestions_org_id_type_idx").on(table.orgId, table.type),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  organizationMembers: many(organizationMembers),
  searches: many(searches),
  createdOrganizations: many(organizations),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [organizations.createdBy],
    references: [users.id],
  }),
  members: many(organizationMembers),
  searches: many(searches),
  companies: many(companies),
  employees: many(employees),
  leads: many(leads),
  creditUsage: one(creditUsage),
  aiSuggestions: many(aiSuggestions),
}));

export const aiSuggestionsRelations = relations(aiSuggestions, ({ one }) => ({
  organization: one(organizations, {
    fields: [aiSuggestions.orgId],
    references: [organizations.id],
  }),
}));

export const creditUsageRelations = relations(creditUsage, ({ one }) => ({
  organization: one(organizations, {
    fields: [creditUsage.orgId],
    references: [organizations.id],
  }),
}));

export const creditHistoryRelations = relations(creditHistory, ({ one }) => ({
  organization: one(organizations, {
    fields: [creditHistory.orgId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [creditHistory.userId],
    references: [users.id],
  }),
  search: one(searches, {
    fields: [creditHistory.searchId],
    references: [searches.id],
  }),
  company: one(companies, {
    fields: [creditHistory.companyId],
    references: [companies.id],
  }),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.orgId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id],
  }),
}));

export const searchesRelations = relations(searches, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [searches.orgId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [searches.userId],
    references: [users.id],
  }),
  companies: many(companies),
  leads: many(leads),
  jobs: many(jobs),
  scraperRuns: many(scraperRuns),
}));

export const scraperRunsRelations = relations(scraperRuns, ({ one }) => ({
  search: one(searches, {
    fields: [scraperRuns.searchId],
    references: [searches.id],
  }),
  organization: one(organizations, {
    fields: [scraperRuns.orgId],
    references: [organizations.id],
  }),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [companies.orgId],
    references: [organizations.id],
  }),
  search: one(searches, {
    fields: [companies.searchId],
    references: [searches.id],
  }),
  jobs: many(jobs),
  employees: many(employees),
  leads: many(leads),
}));

export const jobsRelations = relations(jobs, ({ one }) => ({
  organization: one(organizations, {
    fields: [jobs.orgId],
    references: [organizations.id],
  }),
  company: one(companies, {
    fields: [jobs.companyId],
    references: [companies.id],
  }),
  search: one(searches, {
    fields: [jobs.searchId],
    references: [searches.id],
  }),
}));

export const employeesRelations = relations(employees, ({ one }) => ({
  organization: one(organizations, {
    fields: [employees.orgId],
    references: [organizations.id],
  }),
  company: one(companies, {
    fields: [employees.companyId],
    references: [companies.id],
  }),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  organization: one(organizations, {
    fields: [leads.orgId],
    references: [organizations.id],
  }),
  company: one(companies, {
    fields: [leads.companyId],
    references: [companies.id],
  }),
  employee: one(employees, {
    fields: [leads.employeeId],
    references: [employees.id],
  }),
  search: one(searches, {
    fields: [leads.searchId],
    references: [searches.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type NewOrganizationMember = typeof organizationMembers.$inferInsert;
export type Search = typeof searches.$inferSelect;
export type NewSearch = typeof searches.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type GlobalEmployee = typeof globalEmployees.$inferSelect;
export type NewGlobalEmployee = typeof globalEmployees.$inferInsert;
export type GlobalCompany = typeof globalCompanies.$inferSelect;
export type NewGlobalCompany = typeof globalCompanies.$inferInsert;
export type EnrichmentTransaction = typeof enrichmentTransactions.$inferSelect;
export type NewEnrichmentTransaction = typeof enrichmentTransactions.$inferInsert;
export type ScraperRun = typeof scraperRuns.$inferSelect;
export type NewScraperRun = typeof scraperRuns.$inferInsert;
export type AISuggestion = typeof aiSuggestions.$inferSelect;
export type NewAISuggestion = typeof aiSuggestions.$inferInsert;
export type CreditHistory = typeof creditHistory.$inferSelect;
export type NewCreditHistory = typeof creditHistory.$inferInsert;
