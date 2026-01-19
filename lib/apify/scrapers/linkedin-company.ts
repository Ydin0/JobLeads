import { apifyClient } from "../client";
import { LINKEDIN_COMPANY_ACTOR_ID } from "../constants";
import type { LinkedInCompanyScraperInput, LinkedInCompanyResult } from "../types";
import { apifyLogger as log } from "../../logger";

/**
 * Clean LinkedIn URL by removing query parameters and normalizing to www.linkedin.com
 */
function cleanLinkedInUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove query parameters
    parsed.search = "";
    // Normalize all country-specific subdomains to www.linkedin.com
    // e.g., uk.linkedin.com, ph.linkedin.com -> www.linkedin.com
    if (parsed.hostname.endsWith('.linkedin.com')) {
      parsed.hostname = 'www.linkedin.com';
    }
    // Ensure trailing slash is removed
    const cleanUrl = parsed.toString().replace(/\/$/, "");
    return cleanUrl;
  } catch {
    // If URL parsing fails, try basic normalization
    const cleanUrl = url.split("?")[0].replace(/\/$/, "").replace(/https?:\/\/[a-z]{2}\.linkedin\.com/i, 'https://www.linkedin.com');
    return cleanUrl;
  }
}

/**
 * Batch scrape company profiles by LinkedIn URLs
 */
export async function scrapeCompanyProfiles(
  linkedinUrls: string[]
): Promise<LinkedInCompanyResult[]> {
  if (linkedinUrls.length === 0) {
    return [];
  }

  // Clean URLs before sending to Apify
  const cleanedUrls = linkedinUrls.map(cleanLinkedInUrl);
  log.info(`Scraping ${cleanedUrls.length} company profiles...`);

  const input: LinkedInCompanyScraperInput = {
    action: "get-companies",
    keywords: cleanedUrls,
    isUrl: true,
    isName: false,
    limit: cleanedUrls.length,
  };

  log.json("Company scraper input", input);

  const run = await apifyClient.actor(LINKEDIN_COMPANY_ACTOR_ID).call(input);
  log.info(`Company scraper completed. Run ID: ${run.id}, Dataset ID: ${run.defaultDatasetId}`);

  const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
  log.info(`Fetched ${items.length} company profiles from dataset`);

  return items as unknown as LinkedInCompanyResult[];
}
