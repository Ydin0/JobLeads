import type {
  LinkedInJobsInput,
  IndeedJobsInput,
  GlassdoorJobsInput,
  NormalizedJobResult,
  UnifiedJobSearchInput,
  MultiJobBoardSearchInput,
} from "../types";
import { JOB_BOARD_ACTOR_IDS } from "../constants";
import { runLinkedInJobsSearch } from "../scrapers/linkedin-jobs";
import { runIndeedJobsSearch } from "../scrapers/indeed-jobs";
import { runGlassdoorJobsSearch } from "../scrapers/glassdoor-jobs";
import {
  normalizeLinkedInJob,
  normalizeIndeedJob,
  normalizeGlassdoorJob,
} from "./normalizers";
import { apifyLogger as log } from "../../logger";

export type JobBoard = keyof typeof JOB_BOARD_ACTOR_IDS;

/**
 * Run a single job board search using UnifiedJobSearchInput
 */
export async function runJobSearch(
  input: UnifiedJobSearchInput
): Promise<NormalizedJobResult[]> {
  const { jobBoard, title, location, maxResults = 50 } = input;

  log.info(`Running unified job search on ${jobBoard} for "${title}" in "${location}"`);

  switch (jobBoard) {
    case "linkedin": {
      const results = await runLinkedInJobsSearch({
        title,
        location,
        rows: maxResults,
      });
      return results.map(normalizeLinkedInJob);
    }

    case "indeed": {
      const results = await runIndeedJobsSearch({
        position: title,
        location,
        maxItems: maxResults,
      });
      return results.map(normalizeIndeedJob);
    }

    case "glassdoor": {
      const results = await runGlassdoorJobsSearch({
        keyword: title,
        location,
        maxItems: maxResults,
      });
      return results.map(normalizeGlassdoorJob);
    }

    default:
      log.warn(`Unknown job board: ${jobBoard}, falling back to LinkedIn`);
      const results = await runLinkedInJobsSearch({
        title,
        location,
        rows: maxResults,
      });
      return results.map(normalizeLinkedInJob);
  }
}

/**
 * Run job search across multiple job boards in parallel
 */
export async function runMultiJobBoardSearch(
  input: MultiJobBoardSearchInput
): Promise<NormalizedJobResult[]> {
  const { jobBoards, query, location, country, maxResults = 50 } = input;

  if (!jobBoards || jobBoards.length === 0) {
    log.warn("No job boards specified for multi-board search");
    return [];
  }

  log.info(`Running multi-board search across: ${jobBoards.join(", ")}`);
  log.debug(`Query: "${query}", Location: "${location}", Country: "${country}"`);

  const searchPromises = jobBoards.map(async (board: string) => {
    try {
      switch (board) {
        case "linkedin": {
          const linkedInInput: LinkedInJobsInput = {
            title: query,
            location: location,
            rows: maxResults,
          };
          const jobs = await runLinkedInJobsSearch(linkedInInput);
          return jobs.map(normalizeLinkedInJob);
        }
        case "indeed": {
          const indeedInput: IndeedJobsInput = {
            position: query,
            location: location,
            country: country,
            maxItems: maxResults,
          };
          const jobs = await runIndeedJobsSearch(indeedInput);
          return jobs.map(normalizeIndeedJob);
        }
        case "glassdoor": {
          const glassdoorInput: GlassdoorJobsInput = {
            keyword: query,
            location: location,
            maxItems: maxResults,
          };
          const jobs = await runGlassdoorJobsSearch(glassdoorInput);
          return jobs.map(normalizeGlassdoorJob);
        }
        default:
          log.warn(`Unknown job board in multi-search: ${board}`);
          return [];
      }
    } catch (error) {
      log.error(`Error searching ${board}: ${error}`);
      return [];
    }
  });

  const results = await Promise.all(searchPromises);
  const allJobs = results.flat();

  log.info(`Multi-board search completed. Total jobs: ${allJobs.length}`);

  return allJobs;
}
