import { useEffect, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, normalizeLink, removeImage, uploadImage, type Gift } from "@/lib/gifts";

type Props = { open: boolean; onOpenChange: (o: boolean) => void; gift?: Gift | null };

export function GiftDialog({ open, onOpenChange, gift }: Props) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("outros");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(gift?.name ?? "");
    setCategory(gift?.category ?? "outros");
    setDescription(gift?.description ?? "");
    setLink(gift?.link ?? "");
    setFile(null);
    setPreview(gift?.imageSrc ?? null);
  }, [open, gift]);

  function pickFile(f: File | undefined) {
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Escolha um arquivo de imagem."); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error("A imagem deve ter até 10 MB."); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Dê um nome ao presente."); return; }
    setSaving(true);
    try {
      let image_url = gift?.image_url ?? null;
      if (file) {
        image_url = await uploadImage(file);
        if (gift?.image_url) await removeImage(gift.image_url);
      }
      const row = { name: name.trim(), category, description: description.trim(), link: normalizeLink(link), image_url };
      const { error } = gift
        ? await supabase.from("gifts").update(row).eq("id", gift.id)
        : await supabase.from("gifts").insert(row);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["gifts"] });
      toast.success(gift ? "Presente atualizado!" : "Presente adicionado à lista!");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-semibold">
            {gift ? "Editar presente" : "Novo presente"}
          </DialogTitle>
          <DialogDescription>Capriche nos detalhes para ninguém errar.</DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <label className="group relative flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-input bg-sky-soft transition hover:border-sky">
            {preview ? (
              <img src={preview} alt="Pré-visualização" className="h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImagePlus className="h-8 w-8 text-sky" />
                <span className="text-sm">Toque para escolher uma foto</span>
              </div>
            )}
            {preview && (
              <span className="absolute bottom-3 rounded-full bg-card/90 px-3 py-1 text-xs font-semibold text-accent-foreground opacity-0 transition group-hover:opacity-100">
                Trocar foto
              </span>
            )}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => pickFile(e.target.files?.[0])} />
          </label>
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome do presente</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Suéter de tricô" maxLength={120} />
          </div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desc">Descrição</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tamanho, cor, modelo, preferências…" rows={3} maxLength={1000} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="link">Link do produto</Label>
            <Input id="link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://loja.com/produto" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" className="rounded-full" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />} Salvar presente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
