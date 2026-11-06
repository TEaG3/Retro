interface CloudflareEnv {
  DB: import("./lib/db").D1Database;
  ASSETS: Fetcher;
}
