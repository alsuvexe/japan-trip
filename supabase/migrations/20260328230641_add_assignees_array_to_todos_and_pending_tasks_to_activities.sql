/*
  # Multi-assignee support for todos and pending tasks indicator for day_activities

  ## Changes

  ### Modified Tables
  - `todos`
    - Added `description` (text, nullable) - detailed description separate from title
    - Added `assignees` (text[], default '{}') - array of responsible persons (Papa, Mama, Loli, Alberto)
    - The existing `assignee` (text) column is kept for backward compatibility

  - `day_activities`
    - Added `has_pending_tasks` (boolean, default false) - flag to show alert indicator on activity

  ## Notes
  1. `assignees` supersedes the single `assignee` column; existing data is not migrated to avoid data loss
  2. The trigger `sync_todo_to_calendar` will continue to work with the existing `assignee` column
  3. The `has_pending_tasks` flag triggers a visual alert icon in the itinerary UI
*/

-- Add description to todos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'todos' AND column_name = 'description'
  ) THEN
    ALTER TABLE todos ADD COLUMN description text DEFAULT '';
  END IF;
END $$;

-- Add assignees array to todos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'todos' AND column_name = 'assignees'
  ) THEN
    ALTER TABLE todos ADD COLUMN assignees text[] DEFAULT '{}';
  END IF;
END $$;

-- Add has_pending_tasks to day_activities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'day_activities' AND column_name = 'has_pending_tasks'
  ) THEN
    ALTER TABLE day_activities ADD COLUMN has_pending_tasks boolean DEFAULT false;
  END IF;
END $$;
