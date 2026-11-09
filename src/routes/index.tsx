import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ExternalLink, Gift as GiftIcon, Pencil, Plus, Search, Snowflake, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GiftDialog } from "@/components/GiftDialog";
import { CATEGORIES, categoryLabel, giftsQuery, removeImage, type Gift } from "@/lib/gifts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Guia de Sobrevivência do Meu Amigo Secreto" },
      { name: "description", content: "Um manual de instruções completo para a pessoa não errar de jeito nenhum." },
      { property: "og:title", content: "Guia de Sobrevivência do Meu Amigo Secreto" },
      { property: "og:description", content: "Um manual de instruções completo para a pessoa não errar de jeito nenhum." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(giftsQuery),
  component: Index,
});

const FLAKES = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 71) % 100, delay: (i * 1.7) % 12, dur: 14 + ((i * 3) % 10), size: 8 + ((i * 5) % 10),
}));

function Index() {
  const { data: gifts } = useSuspenseQuery(giftsQuery);
  const qc = useQueryClient();
  const [filter, setFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Gift | null>(null);
  const [deleting, setDeleting] = useState<Gift | null>(null);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return gifts.filter((g) => (filter === "todos" || g.category === filter) && (!q || g.name.toLowerCase().includes(q)));
  }, [gifts, filter, search]);

  async function confirmDelete() {
    if (!deleting) return;
    qc.setQueryData<Gift[]>(["gifts"], (old) => old?.filter((g) => g.id !== deleting.id));
    const { error } = await supabase.from("gifts").delete().eq("id", deleting.id);
    if (error) { toast.error("Não foi possível excluir."); await qc.invalidateQueries({ queryKey: ["gifts"] }); return; }
    await removeImage(deleting.image_url);
    await qc.invalidateQueries({ queryKey: ["gifts"] });
    toast.success("Presente removido da lista.");
    setDeleting(null);
  }

  const openNew = () => { setEditing(null); setDialogOpen(true); };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        {FLAKES.map((f, i) => (
          <Snowflake key={i} className="snowflake absolute text-sky/30"
            style={{ left: `${f.left}%`, top: "-5vh", width: f.size, height: f.size, animationDelay: `-${f.delay}s`, animationDuration: `${f.dur}s` }} />
        ))}
      </div>

      <header className="bg-hero relative px-6 pb-14 pt-20 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-secondary-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Amigo secreto · Natal
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-tight text-foreground sm:text-6xl">
            Guia de Sobrevivência do Meu Amigo Secreto:
          </h1>
          <p className="mt-5 text-lg text-muted-foreground sm:text-xl">
            Um manual de instruções completo para a pessoa não errar de jeito nenhum.
          </p>
          <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-border bg-card/80 p-6 text-left shadow-soft backdrop-blur">
            <p className="text-sm leading-relaxed text-foreground">
              <span className="font-semibold text-primary">Olá, meu amigo secreto! 🎄</span>{" "}
              Calma! Antes de sair comprando qualquer coisa, consulte este guia. Aqui estão algumas dicas para aumentar consideravelmente suas chances de acertar no presente!
            </p>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 pb-24">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {[{ value: "todos", plural: "Todos os presentes" }, ...CATEGORIES].map((c) => (
              <button key={c.value} onClick={() => setFilter(c.value)}
                className={cn("rounded-full px-4 py-2 text-sm font-semibold transition",
                  filter === c.value ? "bg-primary text-primary-foreground shadow-soft" : "bg-secondary text-secondary-foreground hover:bg-accent")}>
                {c.plural}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 md:w-60">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar pelo nome" className="h-10 rounded-full pl-10" />
            </div>
            <Button className="h-10 px-5" onClick={openNew}><Plus /> Adicionar presente</Button>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="mt-16 flex flex-col items-center rounded-3xl border border-dashed border-input bg-card px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-soft">
              <GiftIcon className="h-8 w-8 text-sky" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-semibold">
              {gifts.length === 0 ? "A lista ainda está vazia" : "Nenhum presente encontrado"}
            </h2>
            <p className="mt-2 max-w-sm text-muted-foreground">
              {gifts.length === 0 ? "O Papai Noel ainda está pensando… adicione o primeiro desejo!" : "Tente outra categoria ou outro nome."}
            </p>
            {gifts.length === 0 && <Button className="mt-6" onClick={openNew}><Plus /> Adicionar presente</Button>}
          </div>
        ) : (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((g) => (
              <li key={g.id} className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift">
                <div className="relative aspect-[4/3] overflow-hidden bg-sky-soft">
                  {g.imageSrc ? (
                    <img src={g.imageSrc} alt={g.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><GiftIcon className="h-12 w-12 text-sky/60" /></div>
                  )}
                  <span className="absolute left-4 top-4 rounded-full bg-card/90 px-3 py-1 text-xs font-semibold text-accent-foreground backdrop-blur">
                    {categoryLabel(g.category)}
                  </span>
                  <div className="absolute right-3 top-3 flex gap-1.5 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                    <button aria-label="Editar" onClick={() => { setEditing(g); setDialogOpen(true); }}
                      className="rounded-full bg-card/90 p-2 text-accent-foreground backdrop-blur hover:bg-card"><Pencil className="h-4 w-4" /></button>
                    <button aria-label="Excluir" onClick={() => setDeleting(g)}
                      className="rounded-full bg-card/90 p-2 text-destructive backdrop-blur hover:bg-card"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-xl font-semibold">{g.name}</h3>
                  {g.description && <p className="mt-2 flex-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{g.description}</p>}
                  {g.link && (
                    <Button asChild variant="soft" className="mt-5 w-full">
                      <a href={g.link} target="_blank" rel="noopener noreferrer">Encontrar presente <ExternalLink /></a>
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <footer className="pb-10 text-center text-sm text-muted-foreground">Feito com carinho ❄️ Boas festas!</footer>

      <GiftDialog open={dialogOpen} onOpenChange={setDialogOpen} gift={editing} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este presente?</AlertDialogTitle>
            <AlertDialogDescription>“{deleting?.name}” sairá da lista. Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
