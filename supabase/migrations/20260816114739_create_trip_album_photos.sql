/*
# Create trip_album_photos table

1. New Tables
  - `trip_album_photos`
    - `id` (uuid, primary key)
    - `city` (text, not null) — city name from itinerary
    - `image_url` (text, not null) — storage path or URL
    - `created_at` (timestamp)

2. Security
  - Enable RLS.
  - Allow anon + authenticated full CRUD (single-tenant, no auth).
*/

CREATE TABLE IF NOT EXISTS trip_album_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trip_album_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_album" ON trip_album_photos;
CREATE POLICY "anon_select_album" ON trip_album_photos FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_album" ON trip_album_photos;
CREATE POLICY "anon_insert_album" ON trip_album_photos FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_album" ON trip_album_photos;
CREATE POLICY "anon_update_album" ON trip_album_photos FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_album" ON trip_album_photos;
CREATE POLICY "anon_delete_album" ON trip_album_photos FOR DELETE
  TO anon, authenticated USING (true);
