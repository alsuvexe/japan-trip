/*
  # Add day activities table and map_url to itinerary_days

  1. New Tables
    - `day_activities`
      - `id` (uuid, primary key)
      - `day_id` (uuid) - references itinerary_days
      - `category` (text) - 'transport', 'restaurant', 'activity', 'visit'
      - `time` (text) - e.g. "09:30"
      - `title` (text)
      - `description` (text)
      - `sort_order` (integer) for ordering
      - `created_at` (timestamptz)

  2. Modified Tables
    - `itinerary_days`: add `map_url` column for Google Maps embed URL

  3. Security
    - Enable RLS on day_activities
    - Public access policies
*/

CREATE TABLE IF NOT EXISTS day_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id uuid REFERENCES itinerary_days(id) ON DELETE CASCADE,
  category text DEFAULT 'activity',
  time text DEFAULT '',
  title text NOT NULL,
  description text DEFAULT '',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE day_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read day_activities"
  ON day_activities FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public write day_activities"
  ON day_activities FOR ALL TO anon USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'itinerary_days' AND column_name = 'map_url'
  ) THEN
    ALTER TABLE itinerary_days ADD COLUMN map_url text DEFAULT '';
  END IF;
END $$;