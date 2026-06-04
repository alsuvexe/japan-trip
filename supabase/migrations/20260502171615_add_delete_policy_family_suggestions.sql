/*
  # Add DELETE policy for family_suggestions

  Allows any user to delete suggestions (family app, no auth required).
*/

CREATE POLICY "Anyone can delete suggestions"
  ON family_suggestions FOR DELETE
  TO anon, authenticated
  USING (true);
