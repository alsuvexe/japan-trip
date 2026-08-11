/*
# Add restaurant-specific fields to day_activities

Extends the existing day_activities table with optional columns for
restaurant/food activities. When a user marks an activity as category
'restaurant', these fields store structured gastronomy data:

1. Modified Tables
   - `day_activities`
     - `restaurant_service` (text) — meal type: Almuerzo, Cena, Desayuno, Cena opcional, Snack/Street Food
     - `restaurant_name` (text) — name of the restaurant
     - `restaurant_food_type` (text) — cuisine description, e.g. "Ramen tonkotsu"
     - `restaurant_avg_price` (text) — price range as text, e.g. "2.000 - 3.500 ¥"
     - `restaurant_notes` (text) — recommended dishes, booking details

2. Notes
   - All columns are nullable with empty-string defaults so they don't affect
     non-restaurant activities.
   - No destructive changes; existing data is untouched.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'day_activities' AND column_name = 'restaurant_service') THEN
    ALTER TABLE day_activities ADD COLUMN restaurant_service text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'day_activities' AND column_name = 'restaurant_name') THEN
    ALTER TABLE day_activities ADD COLUMN restaurant_name text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'day_activities' AND column_name = 'restaurant_food_type') THEN
    ALTER TABLE day_activities ADD COLUMN restaurant_food_type text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'day_activities' AND column_name = 'restaurant_avg_price') THEN
    ALTER TABLE day_activities ADD COLUMN restaurant_avg_price text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'day_activities' AND column_name = 'restaurant_notes') THEN
    ALTER TABLE day_activities ADD COLUMN restaurant_notes text NOT NULL DEFAULT '';
  END IF;
END $$;
