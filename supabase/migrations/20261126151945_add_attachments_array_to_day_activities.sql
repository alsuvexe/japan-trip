/*
# Multiple attachments per itinerary activity

1. Modified Tables
- `day_activities`
  - New column `attachments` (jsonb, default '[]'): array of `{ url, name }` objects, one per attached file (PDF, image, etc.). Allows up to many files per activity instead of a single file.
2. Data Migration
- Existing activities that had a single file in the old `attachment_url` / `attachment_name` columns keep working: those values are copied into the new `attachments` array so no file is lost. Old columns are NOT removed, so nothing breaks in the meantime.
3. Security
- No changes to RLS: the table's existing policies continue to apply; the new column is covered by them automatically.
- Grants: the table already has the appropriate grants for existing roles; jsonb needs no extra grant.
4. Notes
- The migration is idempotent: running it twice will not duplicate entries in the array.
*/

ALTER TABLE day_activities
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Backfill: move existing single-file attachments into the array (idempotent)
UPDATE day_activities
SET attachments = jsonb_build_array(
  jsonb_build_object('url', attachment_url, 'name', attachment_name)
)
WHERE attachment_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(attachments) elem
    WHERE elem->>'url' = attachment_url
  );
