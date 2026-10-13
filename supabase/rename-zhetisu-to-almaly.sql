-- Rename the existing Shanyrak while preserving its ID and accumulated points.
-- Run once in Supabase SQL Editor for projects initialized with the original schema.
begin;
update public.shanyraks set name = 'Алмалы' where name = 'Жетісу';
commit;