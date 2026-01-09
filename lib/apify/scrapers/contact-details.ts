import { apifyClient } from "../client";
import { CONTACT_DETAILS_ACTOR_ID } from "../constants";
import type { ContactDetailsInput, ContactDetailsResult } from "../types";
import { apifyLogger as log } from "../../logger";

/**
 * Run Contact Details search
 */
export async function runContactDetailsSearch(
  input: ContactDetailsInput
): Promise<ContactDetailsResult[]> {
  const defaultInput: ContactDetailsInput = {
    enrichEmail: true,
    enrichPhone: true,
    ...input,
  };

  log.info("Running Contact Details actor");
  log.debug(`Actor ID: ${CONTACT_DETAILS_ACTOR_ID}`);
  log.json("Contact Details input", defaultInput);

  const run = await apifyClient.actor(CONTACT_DETAILS_ACTOR_ID).call(defaultInput);
  log.info(`Contact Details actor completed. Run ID: ${run.id}, Dataset ID: ${run.defaultDatasetId}`);

  const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
  log.info(`Fetched ${items.length} contact details from dataset`);

  log.json("Contact Details raw results", items);

  return items as unknown as ContactDetailsResult[];
}
