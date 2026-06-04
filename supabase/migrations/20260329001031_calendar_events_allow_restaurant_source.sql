/*
  # Allow calendar_events to track restaurant-sourced events

  ## Changes
  - Adds DELETE policy allowing removal of restaurant-sourced events
    (they share source='restaurant' and use source_id to link to the restaurant)

  ## Notes
  - Insert policy already covers all anon inserts from the previous migration
  - This migration adds DELETE for the 'restaurant' source so sync works correctly
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'calendar_events' AND policyname = 'Allow delete restaurant events'
  ) THEN
    CREATE POLICY "Allow delete restaurant events"
      ON calendar_events FOR DELETE
      TO anon
      USING (source = 'restaurant');
  END IF;
END $$;
