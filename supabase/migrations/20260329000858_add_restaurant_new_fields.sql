/*
  # Add new fields to restaurants table

  ## Changes
  - Adds `avg_price_per_person` (numeric) - average price per person in yen
  - Adds `reservation_time` (text) - time of reservation (HH:MM format)
  - Adds `in_itinerary` (boolean, default false) - whether this restaurant is confirmed in the itinerary

  ## Notes
  - Uses IF NOT EXISTS checks to be idempotent
  - Existing rows get safe defaults (0, '', false)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'avg_price_per_person'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN avg_price_per_person numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'reservation_time'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN reservation_time text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'in_itinerary'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN in_itinerary boolean DEFAULT false;
  END IF;
END $$;
