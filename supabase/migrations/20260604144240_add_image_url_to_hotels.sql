/*
  # Add image_url column to hotels table

  1. Changes
    - `hotels` table: add `image_url` text column, defaults to empty string
  2. Notes
    - Non-destructive: existing rows get an empty string default
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hotels' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE hotels ADD COLUMN image_url text NOT NULL DEFAULT '';
  END IF;
END $$;
