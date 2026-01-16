import { apifyClient } from "../client";
import { COMPANY_EMPLOYEES_ACTOR_ID } from "../constants";
import type { CompanyEmployeesInput, CompanyEmployeeResult } from "../types";
import { apifyLogger as log } from "../../logger";

/**
 * Run Company Employees search
 */
export async function runCompanyEmployeesSearch(
  input: CompanyEmployeesInput
): Promise<CompanyEmployeeResult[]> {
  const defaultInput: CompanyEmployeesInput = {
    maxResults: 50,
    includeContactInfo: true,
    ...input,
  };

  log.info("Running Company Employees actor");
  log.debug(`Actor ID: ${COMPANY_EMPLOYEES_ACTOR_ID}`);
  log.json("Company Employees input", defaultInput);

  const run = await apifyClient.actor(COMPANY_EMPLOYEES_ACTOR_ID).call(defaultInput);
  log.info(`Company Employees actor completed. Run ID: ${run.id}, Dataset ID: ${run.defaultDatasetId}`);

  const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
  log.info(`Fetched ${items.length} employees from dataset`);

  log.json("Company Employees raw results", items);

  return items as unknown as CompanyEmployeeResult[];
}
