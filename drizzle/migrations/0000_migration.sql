CREATE TABLE public.gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'outros',
  description text NOT NULL DEFAULT '',
  link text NOT NULL DEFAULT '',
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gifts TO anon, authenticated;
GRANT ALL ON public.gifts TO service_role;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON public.gifts FOR SELECT USING (true);
CREATE POLICY "public insert" ON public.gifts FOR INSERT WITH CHECK (true);
CREATE POLICY "public update" ON public.gifts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete" ON public.gifts FOR DELETE USING (true);

CREATE POLICY "gift images read" ON storage.objects FOR SELECT USING (bucket_id = 'gift-images');
CREATE POLICY "gift images insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gift-images');
CREATE POLICY "gift images update" ON storage.objects FOR UPDATE USING (bucket_id = 'gift-images');
CREATE POLICY "gift images delete" ON storage.objects FOR DELETE USING (bucket_id = 'gift-images');