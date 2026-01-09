import { apifyClient } from "../client";
import { LINKEDIN_JOBS_ACTOR_ID } from "../constants";
import type { LinkedInJobsInput, LinkedInJobResult } from "../types";
import { apifyLogger as log } from "../../logger";

/**
 * Run LinkedIn Jobs search
 */
export async function runLinkedInJobsSearch(
  input: LinkedInJobsInput
): Promise<LinkedInJobResult[]> {
  const defaultInput: LinkedInJobsInput = {
    rows: 50,
    proxy: {
      useApifyProxy: true,
      apifyProxyGroups: ["RESIDENTIAL"],
    },
    ...input,
  };

  log.info("Running LinkedIn Jobs actor");
  log.debug(`Actor ID: ${LINKEDIN_JOBS_ACTOR_ID}`);
  log.json("LinkedIn Jobs input", defaultInput);

  const run = await apifyClient.actor(LINKEDIN_JOBS_ACTOR_ID).call(defaultInput);
  log.info(`LinkedIn Jobs actor completed. Run ID: ${run.id}, Dataset ID: ${run.defaultDatasetId}`);

  const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
  log.info(`Fetched ${items.length} items from LinkedIn Jobs dataset`);

  log.json("LinkedIn Jobs raw results", items);

  return items as unknown as LinkedInJobResult[];
}
