/**
 * Debug script for testing Apify functions
 * Run with: npx tsx scripts/debug-apify.ts
 * Or use VS Code debugger: "Debug Script" configuration
 */

import {
  extractCompaniesFromJobs,
  type LinkedInJobResult,
} from "../lib/apify";

// Define NormalizedJobResult type locally (adjust fields as needed)
type NormalizedJobResult = {
  title: string;
  jobUrl: string;
  location: string;
  publishedAt: string;
  companyName: string;
  companyUrl: string;
  source: string;
};

// Test extractCompaniesFromJobs
const mockJobs: LinkedInJobResult[] = [
  {
    title: "Software Engineer",
    jobUrl: "https://linkedin.com/jobs/123",
    location: "San Francisco, CA",
    publishedAt: "2024-01-01",
    companyName: "TechCorp",
    companyUrl: "https://linkedin.com/company/techcorp",
    companyId: "123",
  },
  {
    title: "Senior Engineer",
    jobUrl: "https://linkedin.com/jobs/456",
    location: "New York, NY",
    publishedAt: "2024-01-02",
    companyName: "TechCorp", // Duplicate company
    companyUrl: "https://linkedin.com/company/techcorp",
    companyId: "123",
  },
];

console.log("Testing extractCompaniesFromJobs...");
const companies = extractCompaniesFromJobs(mockJobs);
console.log("Result:", JSON.stringify(companies, null, 2));

// Test with normalized jobs
const mockNormalizedJobs: NormalizedJobResult[] = [
  {
    title: "Software Engineer",
    jobUrl: "https://linkedin.com/jobs/123",
    location: "San Francisco, CA",
    publishedAt: "2024-01-01",
    companyName: "TechCorp",
    companyUrl: "https://linkedin.com/company/techcorp",
    source: "linkedin",
  },
  {
    title: "Full Stack Developer",
    jobUrl: "https://indeed.com/jobs/789",
    location: "San Francisco, CA",
    publishedAt: "2024-01-03",
    companyName: "TechCorp", // Same company, different source
    companyUrl: "",
    source: "indeed",
  },
];

console.log("\nTesting extractCompaniesFromJobs with normalized jobs...");
const normalizedCompanies = extractCompaniesFromJobs(mockNormalizedJobs);
console.log("Result:", JSON.stringify(normalizedCompanies, null, 2));

// Uncomment to test actual API calls (requires APIFY_API_TOKEN)
// import { runLinkedInJobsSearch } from "../lib/apify";
// async function testRealApi() {
//   const jobs = await runLinkedInJobsSearch({
//     title: "Software Engineer",
//     location: "San Francisco",
//     rows: 5,
//   });
//   console.log("Real API results:", jobs);
// }
// testRealApi();
