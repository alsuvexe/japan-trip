/*
# Create generic trips, activities, and reservations tables

1. New Tables
   - `generic_trips` — stores user-created trip plans
     - `id` (text, primary key) — client-generated unique ID
     - `title` (text, not null)
     - `destination` (text, not null)
     - `start_date` (text, not null) — ISO date string
     - `end_date` (text, not null) — ISO date string
     - `cities` (jsonb) — array of city name strings
     - `status` (text) — 'upcoming', 'in_progress', or 'completed'
     - `cover_image` (text) — optional cover URL
     - `theme` (jsonb) — color/gradient theme object
     - `created_at` (timestamptz)

   - `generic_trip_activities` — per-day activities for a trip
     - `id` (text, primary key) — client-generated unique ID
     - `trip_id` (text, FK -> generic_trips.id, not null)
     - `date` (text, not null) — ISO date string
     - `time` (text) — HH:MM
     - `location` (text)
     - `note` (text)
     - `created_at` (timestamptz)

   - `generic_trip_reservations` — hotel/accommodation reservations
     - `id` (text, primary key) — client-generated unique ID
     - `trip_id` (text, FK -> generic_trips.id, not null)
     - `hotel_name` (text, not null)
     - `check_in` (text) — ISO date string
     - `check_out` (text) — ISO date string
     - `notes` (text)
     - `created_at` (timestamptz)

2. Security
   - Enable RLS on all tables.
   - Allow anon + authenticated full CRUD since this is a shared/no-auth app.

3. Notes
   - No user_id column; data is intentionally shared across all devices without login.
   - Real-time subscriptions will use these tables for multi-device sync.
*/

-- Trips table
CREATE TABLE IF NOT EXISTS generic_trips (
  id text PRIMARY KEY,
  title text NOT NULL,
  destination text NOT NULL,
  start_date text NOT NULL,
  end_date text NOT NULL,
  cities jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'upcoming',
  cover_image text NOT NULL DEFAULT '',
  theme jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE generic_trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_generic_trips" ON generic_trips;
CREATE POLICY "anon_select_generic_trips" ON generic_trips FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_generic_trips" ON generic_trips;
CREATE POLICY "anon_insert_generic_trips" ON generic_trips FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_generic_trips" ON generic_trips;
CREATE POLICY "anon_update_generic_trips" ON generic_trips FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_generic_trips" ON generic_trips;
CREATE POLICY "anon_delete_generic_trips" ON generic_trips FOR DELETE
  TO anon, authenticated USING (true);

-- Activities table
CREATE TABLE IF NOT EXISTS generic_trip_activities (
  id text PRIMARY KEY,
  trip_id text NOT NULL REFERENCES generic_trips(id) ON DELETE CASCADE,
  date text NOT NULL,
  time text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE generic_trip_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_generic_trip_activities" ON generic_trip_activities;
CREATE POLICY "anon_select_generic_trip_activities" ON generic_trip_activities FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_generic_trip_activities" ON generic_trip_activities;
CREATE POLICY "anon_insert_generic_trip_activities" ON generic_trip_activities FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_generic_trip_activities" ON generic_trip_activities;
CREATE POLICY "anon_update_generic_trip_activities" ON generic_trip_activities FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_generic_trip_activities" ON generic_trip_activities;
CREATE POLICY "anon_delete_generic_trip_activities" ON generic_trip_activities FOR DELETE
  TO anon, authenticated USING (true);

-- Reservations table
CREATE TABLE IF NOT EXISTS generic_trip_reservations (
  id text PRIMARY KEY,
  trip_id text NOT NULL REFERENCES generic_trips(id) ON DELETE CASCADE,
  hotel_name text NOT NULL,
  check_in text NOT NULL DEFAULT '',
  check_out text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE generic_trip_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_generic_trip_reservations" ON generic_trip_reservations;
CREATE POLICY "anon_select_generic_trip_reservations" ON generic_trip_reservations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_generic_trip_reservations" ON generic_trip_reservations;
CREATE POLICY "anon_insert_generic_trip_reservations" ON generic_trip_reservations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_generic_trip_reservations" ON generic_trip_reservations;
CREATE POLICY "anon_update_generic_trip_reservations" ON generic_trip_reservations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_generic_trip_reservations" ON generic_trip_reservations;
CREATE POLICY "anon_delete_generic_trip_reservations" ON generic_trip_reservations FOR DELETE
  TO anon, authenticated USING (true);
