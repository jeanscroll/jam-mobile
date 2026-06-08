// lib/jobs/toggleLike.ts
//
// Bascule le favori (table `Like`) en CLIENT DIRECT, via le client Supabase
// authentifié unifié (utils/supabase/components.ts). On parle directement à
// Supabase (rôle `authenticated` + session de l'utilisateur) → ~0,1 s, sans le
// double hop du proxy Plasmic server-data (~2 s) et sans le double refetch.
//
// Sécurité : l'utilisateur est déduit de la session (`auth.getUser()`), jamais
// d'un id passé par l'UI → impossible de liker pour quelqu'un d'autre. Les RLS de
// `Like` (déjà en place, puisque Plasmic écrit dans cette table) garantissent que
// chacun ne touche que ses propres lignes.
//
// Renvoie le nouvel état pour réconcilier l'optimistic update côté Plasmic.
import { createClient } from "../../utils/supabase/components";

export interface ToggleLikeResult {
  job_id: string;
  is_liked: boolean;
}

export async function toggleLike(
  jobId: string,
  desiredState?: boolean
): Promise<ToggleLikeResult> {
  if (!jobId) throw new Error("toggleLike: jobId manquant");

  const supabase = createClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    throw new Error("toggleLike: utilisateur non authentifié");
  }

  // Ligne existante pour ce couple (user, job).
  const { data: existing, error: selErr } = await supabase
    .from("Like")
    .select("id")
    .eq("user_id", user.id)
    .eq("job_id", jobId)
    .maybeSingle();
  if (selErr) throw selErr;

  // L'affichage du cœur se base sur la PRÉSENCE de la ligne (pas sur `is_liked`).
  // Donc : like → insérer la ligne si absente ; unlike → la supprimer.
  // État cible : `desiredState` (optimistic, déterministe) sinon bascule.
  const target =
    typeof desiredState === "boolean" ? desiredState : !existing;

  if (target) {
    if (!existing) {
      const { error } = await supabase.from("Like").insert({
        user_id: user.id,
        job_id: jobId,
        is_liked: true,
        liked_at: new Date().toISOString(),
      });
      if (error) throw error;
    }
  } else if (existing) {
    const { error } = await supabase
      .from("Like")
      .delete()
      .eq("id", existing.id);
    if (error) throw error;
  }

  return { job_id: jobId, is_liked: target };
}
