-- Fix unique constraint to allow multiple weekly issues per month.
-- The original UNIQUE(month, year) blocks creation of more than one issue
-- per month, which breaks the weekly format (4-5 issues per month).

ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_month_year_key;

ALTER TABLE issues ADD CONSTRAINT issues_month_year_edition_key UNIQUE (month, year, edition);
