import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc, sql } from "drizzle-orm";
import * as schema from "../lib/db/schema";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function checkCredits() {
  const userEmail = "satish.b@octogle.com";

  // 1. Find the user
  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, userEmail),
  });

  if (!user) {
    console.log("User not found:", userEmail);
    await pool.end();
    return;
  }

  console.log("=== USER INFO ===");
  console.log("User ID:", user.id);
  console.log("Email:", user.email);
  console.log("Name:", user.firstName, user.lastName);

  // 2. Find their organization membership
  const membership = await db.query.organizationMembers.findFirst({
    where: eq(schema.organizationMembers.userId, user.id),
  });

  if (!membership) {
    console.log("\nNo organization membership found");
    await pool.end();
    return;
  }

  console.log("\n=== MEMBER CREDITS ===");
  console.log("Org ID:", membership.orgId);
  console.log("Role:", membership.role);
  console.log("Member Enrichment Used:", membership.enrichmentUsed);
  console.log("Member Enrichment Limit:", membership.enrichmentLimit ?? "unlimited (uses org limit)");
  console.log("Member ICP Used:", membership.icpUsed);
  console.log("Member ICP Limit:", membership.icpLimit ?? "unlimited (uses org limit)");
  console.log("Is Blocked:", membership.isBlocked);

  // 3. Find organization credit usage
  const orgCredits = await db.query.creditUsage.findFirst({
    where: eq(schema.creditUsage.orgId, membership.orgId),
  });

  if (orgCredits) {
    console.log("\n=== ORGANIZATION CREDITS ===");
    console.log("Plan:", orgCredits.planId);
    console.log("Enrichment Used:", orgCredits.enrichmentUsed, "/", orgCredits.enrichmentLimit);
    console.log("Enrichment Remaining:", orgCredits.enrichmentLimit - orgCredits.enrichmentUsed);
    console.log("ICP Used:", orgCredits.icpUsed, "/", orgCredits.icpLimit);
    console.log("ICP Remaining:", orgCredits.icpLimit - orgCredits.icpUsed);
    console.log("Billing Cycle Start:", orgCredits.billingCycleStart);
    console.log("Billing Cycle End:", orgCredits.billingCycleEnd);
  }

  // 4. Get credit history (last 20 transactions)
  const history = await db.query.creditHistory.findMany({
    where: eq(schema.creditHistory.orgId, membership.orgId),
    orderBy: desc(schema.creditHistory.createdAt),
    limit: 20,
  });

  if (history.length > 0) {
    console.log("\n=== RECENT CREDIT HISTORY (last 20) ===");
    for (const h of history) {
      console.log(`[${h.createdAt.toISOString()}] ${h.creditType} | ${h.transactionType} | -${h.creditsUsed} credits | Balance: ${h.balanceAfter} | ${h.description || ""}`);
    }
  }

  // 5. Count total enrichment transactions
  const allHistory = await db.query.creditHistory.findMany({
    where: eq(schema.creditHistory.orgId, membership.orgId),
  });

  const enrichmentTransactions = allHistory.filter(h => h.creditType === "enrichment");
  const icpTransactions = allHistory.filter(h => h.creditType === "icp");

  console.log("\n=== TRANSACTION SUMMARY ===");
  console.log("Total Enrichment Transactions:", enrichmentTransactions.length);
  console.log("Total Enrichment Credits Used:", enrichmentTransactions.reduce((sum, t) => sum + t.creditsUsed, 0));
  console.log("Total ICP Transactions:", icpTransactions.length);
  console.log("Total ICP Credits Used:", icpTransactions.reduce((sum, t) => sum + t.creditsUsed, 0));

  // 6. Breakdown by transaction type
  const byType: Record<string, number> = {};
  for (const t of allHistory) {
    const key = `${t.creditType}:${t.transactionType}`;
    byType[key] = (byType[key] || 0) + t.creditsUsed;
  }

  console.log("\n=== CREDITS BY TRANSACTION TYPE ===");
  for (const [type, credits] of Object.entries(byType)) {
    console.log(`${type}: ${credits} credits`);
  }

  // 7. Check enrichmentTransactions table
  const enrichTransactions = await db.query.enrichmentTransactions.findMany({
    where: eq(schema.enrichmentTransactions.orgId, membership.orgId),
    orderBy: desc(schema.enrichmentTransactions.createdAt),
    limit: 30,
  });

  if (enrichTransactions.length > 0) {
    console.log("\n=== ENRICHMENT TRANSACTIONS (last 30) ===");
    let totalEnrichCredits = 0;
    for (const t of enrichTransactions) {
      totalEnrichCredits += t.creditsUsed;
      console.log(`[${t.createdAt.toISOString()}] ${t.transactionType} | -${t.creditsUsed} credits | CacheHit: ${t.cacheHit} | Apollo Calls: ${t.apolloCallsMade}`);
    }
    console.log("Total from enrichmentTransactions table:", totalEnrichCredits);
  } else {
    console.log("\n=== ENRICHMENT TRANSACTIONS ===");
    console.log("No records found in enrichmentTransactions table");
  }

  // 8. Check leads table for phone fetch activity
  const leadsWithPhone = await db.execute(sql`SELECT COUNT(*) as count FROM leads WHERE org_id = ${membership.orgId} AND phone IS NOT NULL`);
  console.log("\n=== LEADS WITH PHONE ===");
  console.log("Total leads with phone numbers:", leadsWithPhone.rows[0]?.count);

  // 9. Check employees fetched (company enrichment)
  const employeesFetched = await db.execute(sql`SELECT COUNT(*) as count FROM employees WHERE org_id = ${membership.orgId}`);
  console.log("\n=== EMPLOYEES FETCHED ===");
  console.log("Total employees in org:", employeesFetched.rows[0]?.count);

  await pool.end();
}

checkCredits().catch(console.error);
