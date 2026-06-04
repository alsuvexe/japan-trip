/*
  # Allow manual insert/delete on calendar_events

  ## Changes
  - Adds INSERT policy so anon/authenticated users can create manual calendar events
  - Adds DELETE policy so users can delete manually created events
  - Source='manual' events are user-created; source='todo' are synced from todos

  ## Security
  - Policies are scoped to anon role (matching existing pattern in this project)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'calendar_events' AND policyname = 'Allow insert manual events'
  ) THEN
    CREATE POLICY "Allow insert manual events"
      ON calendar_events FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'calendar_events' AND policyname = 'Allow delete manual events'
  ) THEN
    CREATE POLICY "Allow delete manual events"
      ON calendar_events FOR DELETE
      TO anon
      USING (source = 'manual');
  END IF;
END $$;
