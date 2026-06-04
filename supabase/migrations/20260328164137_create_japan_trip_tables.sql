/*
  # Japan Trip Dashboard Schema

  1. New Tables
    - `trip_info`
      - `id` (uuid, primary key)
      - `start_date` (date)
      - `end_date` (date)
      - `insurance_provider` (text)
      - `insurance_policy` (text)
      - `created_at` (timestamptz)
    
    - `itinerary_days`
      - `id` (uuid, primary key)
      - `day_number` (integer)
      - `date` (date)
      - `city` (text)
      - `title` (text)
      - `description` (text)
      - `created_at` (timestamptz)
    
    - `hotels`
      - `id` (uuid, primary key)
      - `name` (text)
      - `city` (text)
      - `check_in` (date)
      - `check_out` (date)
      - `address` (text)
      - `confirmation_code` (text)
      - `notes` (text)
      - `created_at` (timestamptz)
    
    - `restaurants`
      - `id` (uuid, primary key)
      - `name` (text)
      - `city` (text)
      - `cuisine_type` (text)
      - `address` (text)
      - `reservation_date` (date)
      - `notes` (text)
      - `priority` (text)
      - `created_at` (timestamptz)
    
    - `logistics`
      - `id` (uuid, primary key)
      - `category` (text)
      - `title` (text)
      - `description` (text)
      - `date` (date)
      - `status` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (read/write) since this is a personal dashboard
*/

CREATE TABLE IF NOT EXISTS trip_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date date NOT NULL,
  end_date date NOT NULL,
  insurance_provider text DEFAULT '',
  insurance_policy text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS itinerary_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_number integer NOT NULL,
  date date NOT NULL,
  city text NOT NULL,
  title text DEFAULT '',
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  address text DEFAULT '',
  confirmation_code text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  cuisine_type text DEFAULT '',
  address text DEFAULT '',
  reservation_date date,
  notes text DEFAULT '',
  priority text DEFAULT 'normal',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS logistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  date date,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trip_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to trip_info"
  ON trip_info FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public write access to trip_info"
  ON trip_info FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to itinerary_days"
  ON itinerary_days FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public write access to itinerary_days"
  ON itinerary_days FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to hotels"
  ON hotels FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public write access to hotels"
  ON hotels FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to restaurants"
  ON restaurants FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public write access to restaurants"
  ON restaurants FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to logistics"
  ON logistics FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public write access to logistics"
  ON logistics FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);