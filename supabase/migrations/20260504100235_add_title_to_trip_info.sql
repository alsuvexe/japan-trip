/*
  # Add title column to trip_info

  Adds an optional custom title to the trip_info table so users can
  personalise the welcome banner on the summary screen.
  Defaults to 'Bienvenidos a Japón'.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trip_info' AND column_name = 'title'
  ) THEN
    ALTER TABLE trip_info ADD COLUMN title text NOT NULL DEFAULT 'Bienvenidos a Japón';
  END IF;
END $$;
