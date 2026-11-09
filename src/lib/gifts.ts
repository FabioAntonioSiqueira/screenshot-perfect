import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const CATEGORIES = [
  { value: "roupa", label: "Roupa", plural: "Roupas" },
  { value: "livro", label: "Livro", plural: "Livros" },
  { value: "acessorio", label: "Acessório", plural: "Acessórios" },
  { value: "lembrancinha", label: "Lembrancinha", plural: "Lembrancinhas" },
  { value: "tecnologia", label: "Tecnologia", plural: "Tecnologia" },
  { value: "outros", label: "Outros", plural: "Outros" },
] as const;

export const categoryLabel = (v: string) => CATEGORIES.find((c) => c.value === v)?.label ?? "Outros";

export type Gift = {
  id: string;
  name: string;
  category: string;
  description: string;
  link: string;
  image_url: string | null; // storage path
  imageSrc: string | null; // signed URL
  created_at: string;
};

const BUCKET = "gift-images";

async function fetchGifts(): Promise<Gift[]> {
  const { data, error } = await supabase
    .from("gifts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const paths = data.map((g) => g.image_url).filter((p): p is string => !!p);
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 60 * 60 * 24);
    signed?.forEach((s) => s.path && s.signedUrl && urls.set(s.path, s.signedUrl));
  }
  return data.map((g) => ({ ...g, imageSrc: g.image_url ? (urls.get(g.image_url) ?? null) : null }));
}

export const giftsQuery = queryOptions({ queryKey: ["gifts"], queryFn: fetchGifts });

export async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}

export async function removeImage(path: string | null) {
  if (path) await supabase.storage.from(BUCKET).remove([path]);
}

export function normalizeLink(link: string) {
  const l = link.trim();
  if (!l) return "";
  return /^https?:\/\//i.test(l) ? l : `https://${l}`;
}
