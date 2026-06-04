/*
  # Storage policies for attachments bucket

  Allows anyone to read public attachments and authenticated users to upload.
*/

CREATE POLICY "Public read attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'attachments');

CREATE POLICY "Authenticated upload attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "Anon upload attachments"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'attachments');
