CREATE TYPE public.app_role AS ENUM ('admin');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- First account ever created becomes the owner (admin)
CREATE OR REPLACE FUNCTION public.assign_first_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created_admin AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.assign_first_admin();

DROP POLICY "public insert" ON public.gifts;
DROP POLICY "public update" ON public.gifts;
DROP POLICY "public delete" ON public.gifts;
REVOKE INSERT, UPDATE, DELETE ON public.gifts FROM anon;
CREATE POLICY "admin insert" ON public.gifts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update" ON public.gifts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete" ON public.gifts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY "gift images insert" ON storage.objects;
DROP POLICY "gift images update" ON storage.objects;
DROP POLICY "gift images delete" ON storage.objects;
CREATE POLICY "gift images admin insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gift-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "gift images admin update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'gift-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "gift images admin delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'gift-images' AND public.has_role(auth.uid(), 'admin'));