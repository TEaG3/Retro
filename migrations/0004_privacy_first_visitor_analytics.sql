CREATE TABLE IF NOT EXISTS site_visitors (
  visitor_id TEXT PRIMARY KEY,
  first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_page_views INTEGER NOT NULL DEFAULT 0,
  last_path TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS site_visitor_days (
  visitor_id TEXT NOT NULL,
  visit_date TEXT NOT NULL,
  page_views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (visitor_id, visit_date)
);
CREATE INDEX IF NOT EXISTS site_visitor_days_date_idx ON site_visitor_days(visit_date);

CREATE TABLE IF NOT EXISTS site_page_daily (
  visit_date TEXT NOT NULL,
  path TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (visit_date, path)
);
CREATE INDEX IF NOT EXISTS site_page_daily_views_idx ON site_page_daily(visit_date, views DESC);

CREATE TABLE IF NOT EXISTS site_visitor_page_daily (
  visit_date TEXT NOT NULL,
  path TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  PRIMARY KEY (visit_date, path, visitor_id)
);
CREATE INDEX IF NOT EXISTS site_visitor_page_daily_lookup_idx
  ON site_visitor_page_daily(visit_date, path);
