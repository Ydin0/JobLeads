import { apifyClient } from "../client";
import { LINKEDIN_EMPLOYEES_ACTOR_ID } from "../constants";
import type { LinkedInEmployeesInput, LinkedInEmployeeResult } from "../types";
import { apifyLogger as log } from "../../logger";

/**
 * Run LinkedIn Company Employees search
 */
export async function runLinkedInEmployeesSearch(
  input: LinkedInEmployeesInput
): Promise<LinkedInEmployeeResult[]> {
  const defaultInput: LinkedInEmployeesInput = {
    maxEmployees: 50,
    startPage: 1,
    proxy: {
      useApifyProxy: true,
      apifyProxyGroups: ["RESIDENTIAL"],
    },
    ...input,
  };

  log.info("Running LinkedIn Employees actor");
  log.debug(`Actor ID: ${LINKEDIN_EMPLOYEES_ACTOR_ID}`);
  log.json("LinkedIn Employees input", defaultInput);

  const run = await apifyClient.actor(LINKEDIN_EMPLOYEES_ACTOR_ID).call(defaultInput);
  log.info(`LinkedIn Employees actor completed. Run ID: ${run.id}, Dataset ID: ${run.defaultDatasetId}`);

  const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
  log.info(`Fetched ${items.length} employees from LinkedIn dataset`);

  log.json("LinkedIn Employees raw results", items);

  return items as unknown as LinkedInEmployeeResult[];
}
