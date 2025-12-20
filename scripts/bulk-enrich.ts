// Script to bulk enrich all companies with LinkedIn URLs
// Run with: npx tsx scripts/bulk-enrich.ts

import { config } from "dotenv";
import { resolve } from "path";

// Load env from .env.local BEFORE any other imports
config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  // Debug: Check if env vars are loaded
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not found in .env.local");
    console.log("Current working directory:", process.cwd());
    process.exit(1);
  }

  console.log("Environment loaded successfully");
  console.log("Starting bulk company enrichment...\n");

  // Dynamic imports after env is loaded
  const { db } = await import("../lib/db");
  const { companies } = await import("../lib/db/schema");
  const { isNotNull } = await import("drizzle-orm");
  const { enrichCompaniesInBatch } = await import("../lib/company-enrichment");

  // Get all companies with LinkedIn URLs
  const allCompanies = await db
    .select({
      id: companies.id,
      name: companies.name,
      linkedinUrl: companies.linkedinUrl,
      orgId: companies.orgId,
      isEnriched: companies.isEnriched,
    })
    .from(companies)
    .where(isNotNull(companies.linkedinUrl));

  console.log(`Found ${allCompanies.length} companies with LinkedIn URLs`);

  const alreadyEnriched = allCompanies.filter((c) => c.isEnriched);
  const toEnrich = allCompanies.filter((c) => !c.isEnriched);

  console.log(`Already enriched: ${alreadyEnriched.length}`);
  console.log(`To enrich: ${toEnrich.length}`);

  if (toEnrich.length === 0) {
    console.log("\nNo companies to enrich. Exiting.");
    process.exit(0);
  }

  console.log("\nProceeding with enrichment...\n");

  // Run batch enrichment
  const results = await enrichCompaniesInBatch(
    toEnrich.map((c) => ({
      companyId: c.id,
      name: c.name,
      linkedinUrl: c.linkedinUrl!,
    }))
  );

  // Calculate stats
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const cacheHits = results.filter((r) => r.cacheHit).length;

  console.log("\n=== Enrichment Complete ===");
  console.log(`Total processed: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`Cache hits: ${cacheHits}`);

  // Show failed companies
  const failedResults = results.filter((r) => !r.success);
  if (failedResults.length > 0) {
    console.log("\nFailed companies:");
    for (const result of failedResults) {
      const company = toEnrich.find((c) => c.id === result.companyId);
      console.log(`  - ${company?.name}: ${result.error}`);
    }
  }

  // Show sample of successful enrichments
  const successfulResults = results.filter((r) => r.success && r.enrichedData);
  if (successfulResults.length > 0) {
    console.log("\nSample of enriched companies:");
    for (const result of successfulResults.slice(0, 5)) {
      const data = result.enrichedData!;
      console.log(`  - ${data.name}`);
      console.log(`    Industry: ${data.industry || "N/A"}`);
      console.log(`    Size: ${data.size || "N/A"}`);
      console.log(`    Location: ${data.location || "N/A"}`);
      console.log(`    Logo: ${data.logoUrl ? "Yes" : "No"}`);
    }
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
