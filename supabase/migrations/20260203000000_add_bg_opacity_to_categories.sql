-- Add bg_opacity column to categories if it does not exist
-- Run this in Supabase SQL Editor if you get PGRST204 for 'bg_opacity'

ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS bg_opacity INTEGER DEFAULT 15;

-- Optional: backfill existing rows
UPDATE public.categories
SET bg_opacity = 15
WHERE bg_opacity IS NULL;

COMMENT ON COLUMN public.categories.bg_opacity IS 'Background opacity 0-100 for category card display';

-- Bắt buộc: reload schema cache để API nhận cột mới (hết lỗi PGRST204)
NOTIFY pgrst, 'reload schema';
