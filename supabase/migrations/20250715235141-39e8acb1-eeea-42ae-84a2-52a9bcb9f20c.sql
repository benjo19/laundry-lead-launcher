-- Make user-documents bucket public temporarily to test uploads
UPDATE storage.buckets SET public = true WHERE id = 'user-documents';