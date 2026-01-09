import { apifyClient } from "../client";
import { GLASSDOOR_JOBS_ACTOR_ID } from "../constants";
import type { GlassdoorJobsInput, GlassdoorJobResult } from "../types";
import { apifyLogger as log } from "../../logger";

/**
 * Run Glassdoor Jobs search
 */
export async function runGlassdoorJobsSearch(
  input: GlassdoorJobsInput
): Promise<GlassdoorJobResult[]> {
  const defaultInput: GlassdoorJobsInput = {
    maxItems: 50,
    includeJobDescription: true,
    ...input,
  };

  log.info("Running Glassdoor Jobs actor");
  log.debug(`Actor ID: ${GLASSDOOR_JOBS_ACTOR_ID}`);
  log.json("Glassdoor Jobs input", defaultInput);

  const run = await apifyClient.actor(GLASSDOOR_JOBS_ACTOR_ID).call(defaultInput);
  log.info(`Glassdoor Jobs actor completed. Run ID: ${run.id}, Dataset ID: ${run.defaultDatasetId}`);

  const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
  log.info(`Fetched ${items.length} items from Glassdoor Jobs dataset`);

  log.json("Glassdoor Jobs raw results", items);

  return items as unknown as GlassdoorJobResult[];
}
