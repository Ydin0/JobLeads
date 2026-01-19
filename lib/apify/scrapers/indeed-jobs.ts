import { apifyClient } from "../client";
import { INDEED_JOBS_ACTOR_ID, INDEED_COUNTRY_CODES } from "../constants";
import type { IndeedJobsInput, IndeedJobResult } from "../types";
import { apifyLogger as log } from "../../logger";

/**
 * Run Indeed Jobs search
 */
export async function runIndeedJobsSearch(
  input: IndeedJobsInput
): Promise<IndeedJobResult[]> {
  // Normalize country code to lowercase
  const normalizedCountry = input.country?.toLowerCase() || "us";

  // Validate country code
  if (!INDEED_COUNTRY_CODES.includes(normalizedCountry as typeof INDEED_COUNTRY_CODES[number])) {
    log.warn(`Invalid Indeed country code: ${input.country}, defaulting to "us"`);
  }

  const defaultInput: IndeedJobsInput = {
    maxItems: 50,
    parseCompanyDetails: true,
    saveOnlyUniqueItems: true,
    followApplyRedirects: false,
    ...input,
    country: INDEED_COUNTRY_CODES.includes(normalizedCountry as typeof INDEED_COUNTRY_CODES[number])
      ? normalizedCountry
      : "us",
  };

  log.info("Running Indeed Jobs actor");
  log.debug(`Actor ID: ${INDEED_JOBS_ACTOR_ID}`);
  log.json("Indeed Jobs input", defaultInput);

  const run = await apifyClient.actor(INDEED_JOBS_ACTOR_ID).call(defaultInput);
  log.info(`Indeed Jobs actor completed. Run ID: ${run.id}, Dataset ID: ${run.defaultDatasetId}`);

  const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
  log.info(`Fetched ${items.length} items from Indeed Jobs dataset`);

  log.json("Indeed Jobs raw results", items);

  return items as unknown as IndeedJobResult[];
}
