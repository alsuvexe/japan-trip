/*
  # Enhanced Japan Trip Dashboard Tables

  1. New Tables
    - `todos`
      - `id` (uuid, primary key)
      - `title` (text) - task description
      - `completed` (boolean) - checkbox state
      - `category` (text) - e.g. 'Documentos', 'Transporte'
      - `created_at` (timestamptz)

    - `budget_items`
      - `id` (uuid, primary key)
      - `day_id` (uuid) - references itinerary_days
      - `category` (text) - e.g. 'Transporte', 'Comida', 'Alojamiento'
      - `description` (text)
      - `planned_amount` (numeric) - in EUR
      - `actual_amount` (numeric) - in EUR, nullable
      - `created_at` (timestamptz)

    - `other_trips`
      - `id` (uuid, primary key)
      - `title` (text)
      - `destination` (text)
      - `year` (integer)
      - `image_data` (text) - base64 encoded image or URL
      - `image_name` (text)
      - `notes` (text)
      - `created_at` (timestamptz)

  2. Modified Tables
    - `itinerary_days`: add `icon_type` column for activity icon category

  3. Security
    - Enable RLS on all new tables
    - Add public access policies (personal dashboard)
*/

CREATE TABLE IF NOT EXISTS todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  completed boolean DEFAULT false,
  category text DEFAULT 'General',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id uuid REFERENCES itinerary_days(id) ON DELETE CASCADE,
  category text DEFAULT 'Otros',
  description text DEFAULT '',
  planned_amount numeric DEFAULT 0,
  actual_amount numeric,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS other_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  destination text DEFAULT '',
  year integer DEFAULT 2024,
  image_data text DEFAULT '',
  image_name text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'itinerary_days' AND column_name = 'icon_type'
  ) THEN
    ALTER TABLE itinerary_days ADD COLUMN icon_type text DEFAULT 'general';
  END IF;
END $$;

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE other_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read todos"
  ON todos FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public write todos"
  ON todos FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read budget_items"
  ON budget_items FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public write budget_items"
  ON budget_items FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read other_trips"
  ON other_trips FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public write other_trips"
  ON other_trips FOR ALL TO anon USING (true) WITH CHECK (true);