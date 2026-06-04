/*
  # Replace completed boolean with completed_by array in todos

  ## Changes

  ### Modified Table: todos
  - Added `completed_by` (text[], default '{}') - array of person names who have completed the task
  - The existing `completed` column is kept temporarily for backward compatibility but will no longer be the source of truth

  ## Notes
  1. `completed_by` stores individual completion per person (e.g., ['Papa', 'Loli'])
  2. A task is fully done when all assignees appear in completed_by
  3. The old `completed` column is preserved to avoid any data loss on existing rows
  4. New UI logic reads/writes only from `completed_by`
*/

-- Add completed_by array column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'todos' AND column_name = 'completed_by'
  ) THEN
    ALTER TABLE todos ADD COLUMN completed_by text[] DEFAULT '{}';
  END IF;
END $$;

-- Backfill: if a todo was previously marked completed=true, mark all assignees as having completed it
UPDATE todos
SET completed_by = assignees
WHERE completed = true
  AND array_length(assignees, 1) > 0
  AND (completed_by IS NULL OR completed_by = '{}');

-- For todos that were completed=true but have no assignees, keep completed_by empty (can't infer who)
