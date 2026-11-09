import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAdmin() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const check = async (s: Session | null) => {
      setSession(s);
      if (!s) return setIsAdmin(false);
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", s.user.id).eq("role", "admin");
      setIsAdmin(!!data?.length);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setTimeout(() => check(s), 0);
    });
    supabase.auth.getSession().then(({ data }) => check(data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, isAdmin };
}
