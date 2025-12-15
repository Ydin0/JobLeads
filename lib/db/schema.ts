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

// Searches table - saved search queries
export const searches = pgTable("searches", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: varchar("org_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  filters: jsonb("filters").$type<{
    jobTitles?: string[];
    locations?: string[];
    industries?: string[];
    companySize?: string[];
    keywords?: string[];
  }>(),
  status: searchStatusEnum("status").default("active").notNull(),
  resultsCount: integer("results_count").default(0),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Companies table - companies found from searches
export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: varchar("org_id", { length: 255 }).notNull(),
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
});

// Leads table - contact leads from companies
export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: varchar("org_id", { length: 255 }).notNull(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
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
});

// Relations
export const searchesRelations = relations(searches, ({ many }) => ({
  companies: many(companies),
  leads: many(leads),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  search: one(searches, {
    fields: [companies.searchId],
    references: [searches.id],
  }),
  leads: many(leads),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  company: one(companies, {
    fields: [leads.companyId],
    references: [companies.id],
  }),
  search: one(searches, {
    fields: [leads.searchId],
    references: [searches.id],
  }),
}));

// Types
export type Search = typeof searches.$inferSelect;
export type NewSearch = typeof searches.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
