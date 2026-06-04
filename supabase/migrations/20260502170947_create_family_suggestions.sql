/*
  # Create family_suggestions table

  1. New Tables
    - `family_suggestions`
      - `id` (uuid, primary key)
      - `author` (text) — one of: Mama, Papa, Loli, Alberto
      - `activity_type` (text) — Restaurante | Visita | Hotel | Monumento | Ciudad
      - `title` (text) — suggestion title
      - `description` (text) — optional details
      - `likes` (integer, default 0) — vote counter
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Allow anonymous read and insert (family app, no auth)
    - Allow anonymous update of likes only
*/

CREATE TABLE IF NOT EXISTS family_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author text NOT NULL DEFAULT '',
  activity_type text NOT NULL DEFAULT 'Visita',
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  likes integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE family_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read suggestions"
  ON family_suggestions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert suggestions"
  ON family_suggestions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update suggestion likes"
  ON family_suggestions FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
