/*
  # Add stars (category) column to hotels table

  1. Changes
    - `hotels` table: add `stars` integer column (1–5), defaults to 4
  2. Notes
    - Non-destructive: existing rows get the default value of 4
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hotels' AND column_name = 'stars'
  ) THEN
    ALTER TABLE hotels ADD COLUMN stars integer NOT NULL DEFAULT 4;
  END IF;
END $$;
