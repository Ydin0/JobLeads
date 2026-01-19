import { ApifyClient } from "apify-client";

if (!process.env.APIFY_API_TOKEN) {
  throw new Error("APIFY_API_TOKEN environment variable is not set");
}

export const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});
