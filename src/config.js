// config.js
import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 3000),
  maxSearchResults: Number(process.env.MAX_SEARCH_RESULTS || 10),
  searchPages: Number(process.env.SEARCH_PAGES || 1),
  requestDelayMs: Number(process.env.REQUEST_DELAY_MS || 100),
};

