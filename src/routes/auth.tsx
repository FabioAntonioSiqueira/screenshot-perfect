import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Snowflake } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar · Guia do Amigo Secreto" },
      { name: "description", content: "Acesso para gerenciar a lista de presentes." },
      { property: "og:title", content: "Entrar · Guia do Amigo Secreto" },
      { property: "og:description", content: "Acesso para gerenciar a lista de presentes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vinda de volta!");
        navigate({ to: "/" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password, options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/" });
        else toast.success("Conta criada! Confirme pelo link enviado ao seu e-mail.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo deu errado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-hero flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 shadow-soft">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-soft">
          <Snowflake className="h-6 w-6 text-sky" />
        </div>
        <h1 className="mt-4 text-center font-display text-2xl font-semibold">
          {mode === "in" ? "Área da dona da lista" : "Criar conta de dona"}
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Convidados não precisam entrar — é só ver a lista.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw">Senha</Label>
            <Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} {mode === "in" ? "Entrar" : "Criar conta"}
          </Button>
        </form>
        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-primary">
          {mode === "in" ? "Primeiro acesso? Criar conta" : "Já tenho conta"}
        </button>
        <Link to="/" className="mt-2 block text-center text-sm text-primary">← Voltar para a lista</Link>
      </div>
    </div>
  );
}
