/*
  # Add assignee and due_date to todos, create calendar_events table, and sync trigger

  ## Changes

  ### Modified Tables
  - `todos`
    - Added `due_date` (date, nullable) - deadline for the task
    - Added `assignee` (text, nullable) - responsible person: Papa, Mama, Loli, Alberto

  ### New Tables
  - `calendar_events`
    - `id` (uuid, primary key)
    - `title` (text) - event title
    - `event_date` (date) - date of the event
    - `category` (text) - category of the event (matches todo category)
    - `source` (text) - 'todo' to distinguish from itinerary events
    - `source_id` (uuid, nullable) - reference to the originating todo id
    - `assignee` (text, nullable) - person assigned
    - `created_at` (timestamptz)

  ### Security
  - RLS enabled on `calendar_events` with policies for anon read/write

  ### Trigger
  - `sync_todo_to_calendar` function: after INSERT on todos with a non-null due_date,
    inserts a matching entry into calendar_events
  - Also handles UPDATE: if due_date changes on an existing todo, syncs to calendar_events

  ## Notes
  1. Calendar events with source='todo' are used to visually distinguish them in the UI
  2. Deletion of a todo cascades to remove its calendar_event via trigger
*/

-- 1. Add columns to todos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'todos' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE todos ADD COLUMN due_date date;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'todos' AND column_name = 'assignee'
  ) THEN
    ALTER TABLE todos ADD COLUMN assignee text DEFAULT '';
  END IF;
END $$;

-- 2. Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  event_date date NOT NULL,
  category text NOT NULL DEFAULT 'General',
  source text NOT NULL DEFAULT 'manual',
  source_id uuid,
  assignee text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read calendar_events"
  ON calendar_events FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert calendar_events"
  ON calendar_events FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update calendar_events"
  ON calendar_events FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete calendar_events"
  ON calendar_events FOR DELETE
  TO anon
  USING (true);

-- 3. Sync trigger function
CREATE OR REPLACE FUNCTION sync_todo_to_calendar()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT: if due_date is set, insert into calendar_events
  IF TG_OP = 'INSERT' THEN
    IF NEW.due_date IS NOT NULL THEN
      INSERT INTO calendar_events (title, event_date, category, source, source_id, assignee)
      VALUES (NEW.title, NEW.due_date, COALESCE(NEW.category, 'General'), 'todo', NEW.id, COALESCE(NEW.assignee, ''));
    END IF;

  -- On UPDATE: sync changes to matching calendar_event
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.due_date IS NOT NULL THEN
      -- Upsert: update existing or insert new
      UPDATE calendar_events
        SET title = NEW.title,
            event_date = NEW.due_date,
            category = COALESCE(NEW.category, 'General'),
            assignee = COALESCE(NEW.assignee, '')
        WHERE source_id = NEW.id AND source = 'todo';

      IF NOT FOUND THEN
        INSERT INTO calendar_events (title, event_date, category, source, source_id, assignee)
        VALUES (NEW.title, NEW.due_date, COALESCE(NEW.category, 'General'), 'todo', NEW.id, COALESCE(NEW.assignee, ''));
      END IF;
    ELSE
      -- due_date removed, delete from calendar
      DELETE FROM calendar_events WHERE source_id = NEW.id AND source = 'todo';
    END IF;

  -- On DELETE: remove from calendar_events
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM calendar_events WHERE source_id = OLD.id AND source = 'todo';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to todos
DROP TRIGGER IF EXISTS todos_calendar_sync ON todos;
CREATE TRIGGER todos_calendar_sync
  AFTER INSERT OR UPDATE OR DELETE ON todos
  FOR EACH ROW EXECUTE FUNCTION sync_todo_to_calendar();
