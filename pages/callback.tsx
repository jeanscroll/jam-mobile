import { useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient"

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function handleAuth() {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error(error.message);
      } else if (session) {
        console.log("User logged in", session.user);
        router.replace("/");
      }
    }
    handleAuth();
  }, [router]);

  return <p>Chargement...</p>;
}
