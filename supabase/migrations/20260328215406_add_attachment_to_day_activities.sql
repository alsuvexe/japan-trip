/*
  # Add attachment columns to day_activities

  ## Changes
  - Adds `attachment_url` (text, nullable) to store the public URL of an uploaded file
  - Adds `attachment_name` (text, nullable) to store the original filename for display/download

  ## Notes
  - Both columns are optional (nullable), no existing data is affected
  - No RLS changes needed; existing policies on day_activities cover these new columns
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'day_activities' AND column_name = 'attachment_url'
  ) THEN
    ALTER TABLE day_activities ADD COLUMN attachment_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'day_activities' AND column_name = 'attachment_name'
  ) THEN
    ALTER TABLE day_activities ADD COLUMN attachment_name text;
  END IF;
END $$;
