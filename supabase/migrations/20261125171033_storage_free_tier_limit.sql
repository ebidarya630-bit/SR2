-- Keep upload size limits compatible with the Supabase Free project global cap.
update storage.buckets set file_size_limit = 52428800 where id = 'sr-private';
