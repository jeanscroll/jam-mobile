// lib/weglot/dynamicTranslate.ts
//
// Pont de traduction dynamique pour Weglot en contexte SPA (Next.js + Plasmic).
//
// Problème : Weglot traduit le DOM présent à l'init, mais son observer interne
// ne rattrape PAS de façon fiable le contenu rendu côté client (cards chargées
// depuis Supabase, contenu de navigation client-side). Résultat : l'UI initiale
// se traduit, mais les cards / les autres pages restent en langue d'origine.
// (L'option `dynamic` n'existe pas dans `Weglot.initialize()` — vérifié.)
//
// Solution : on s'appuie sur l'API publique `Weglot.translate()` (machine
// translation à la volée, qui fonctionne) + un MutationObserver. Dès que la
// langue active ≠ langue d'origine, on collecte les nœuds texte non traduits,
// on les traduit en lot, et on applique. On réagit aussi aux changements de DOM
// (cards, navigation) et de langue. En revenant à la langue d'origine, on
// restaure les textes initiaux.

type WeglotApi = {
  getCurrentLang?: () => string;
  getLanguage?: () => string;
  switchTo?: (code: string) => void;
  translate?: (
    payload: { words: { t: number; w: string }[]; languageTo: string },
    cb: (data: string[]) => void
  ) => void;
  on?: (event: string, cb: (...a: any[]) => void) => void;
};

function getWeglot(): WeglotApi | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { Weglot?: WeglotApi }).Weglot ?? null;
}

function currentLang(wg: WeglotApi): string | null {
  try {
    return wg.getCurrentLang?.() || wg.getLanguage?.() || null;
  } catch {
    return null;
  }
}

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "TEXTAREA",
  "CODE",
  "PRE",
]);
// Au moins une lettre (sinon : nombres, €, emojis… inutile à traduire).
const HAS_LETTER = /\p{L}/u;

export function startWeglotDynamicTranslation(originalLang = "fr"): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __weglotDynStarted?: boolean };
  if (w.__weglotDynStarted) return;
  w.__weglotDynStarted = true;

  // "lang::texteSource" -> traduction
  const cache = new Map<string, string>();
  // nœud modifié -> son texte source (langue d'origine), pour restaurer
  const originalText = new WeakMap<Text, string>();
  // nœuds qu'on a modifiés (pour restaurer en revenant à la langue d'origine)
  const changed = new Set<Text>();
  // true pendant nos propres écritures → l'observer ignore (évite les boucles)
  let applying = false;
  let debounceId: number | null = null;

  const isSkippable = (node: Text): boolean => {
    const v = node.nodeValue;
    if (!v || !v.trim() || !HAS_LETTER.test(v)) return true;
    let el: HTMLElement | null = node.parentElement;
    while (el) {
      if (SKIP_TAGS.has(el.tagName)) return true;
      if (
        el.hasAttribute("data-wg-notranslate") ||
        el.classList.contains("wg-notranslate")
      )
        return true;
      const cls = el.className?.toString?.() || "";
      // sélecteur de langue Weglot / pays : ne pas traduire
      if (/weglot|country-selector/i.test(cls)) return true;
      if (el.isContentEditable) return true;
      // Spans gérés par Weglot (wg-N) : laisser le CSS ::before gérer l'espacement
      if ([...el.attributes].some((a) => /^wg-\d+$/.test(a.name))) return true;
      el = el.parentElement;
    }
    return false;
  };

  const collect = (): Text[] => {
    const nodes: Text[] = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT
    );
    let n: Node | null;
    while ((n = walker.nextNode())) {
      const t = n as Text;
      if (!isSkippable(t)) nodes.push(t);
    }
    return nodes;
  };

  const setText = (node: Text, src: string, translated: string) => {
    // L'API Weglot renvoie une traduction trimmée. On réattache les espaces
    // (début/fin) du texte source autour de la traduction, sinon des nœuds/spans
    // adjacents se collent ("aussi " + "simple" → "sosimple"). Indispensable car
    // Plasmic splite les phrases en plusieurs spans (texte + span lime stylé).
    const leading = src.match(/^\s*/)?.[0] ?? "";
    const trailing = src.match(/\s*$/)?.[0] ?? "";
    const value = leading + translated + trailing;
    if (node.nodeValue === value) return;
    applying = true;
    originalText.set(node, src);
    node.nodeValue = value;
    changed.add(node);
    applying = false;
  };

  const revertToOriginal = () => {
    applying = true;
    for (const node of Array.from(changed)) {
      if (!node.isConnected) {
        changed.delete(node);
        continue;
      }
      const orig = originalText.get(node);
      if (orig != null && node.nodeValue !== orig) node.nodeValue = orig;
    }
    applying = false;
  };

  const run = () => {
    const wg = getWeglot();
    if (!wg?.translate) return;
    const lang = currentLang(wg);
    if (!lang || lang === originalLang) {
      revertToOriginal();
      return;
    }

    const nodes = collect();
    const pending: { node: Text; src: string }[] = [];
    for (const node of nodes) {
      // texte source = original mémorisé si déjà traduit, sinon valeur courante
      const src = (originalText.get(node) ?? node.nodeValue ?? "").toString();
      const key = lang + "::" + src.trim();
      const cached = cache.get(key);
      if (cached != null) {
        setText(node, src, cached);
      } else {
        pending.push({ node, src });
      }
    }
    if (pending.length === 0) return;

    const uniq = Array.from(
      new Set(pending.map((p) => p.src.trim()))
    ).filter(Boolean);
    if (uniq.length === 0) return;
    const words = uniq.map((wstr) => ({ t: 1, w: wstr }));

    wg.translate({ words, languageTo: lang }, (data) => {
      if (!Array.isArray(data)) return;
      uniq.forEach((src, i) => {
        if (data[i] != null) cache.set(lang + "::" + src, data[i]);
      });
      for (const { node, src } of pending) {
        if (!node.isConnected) continue;
        const tr = cache.get(lang + "::" + src.trim());
        if (tr != null) setText(node, src, tr);
      }
    });
  };

  const schedule = () => {
    if (debounceId != null) window.clearTimeout(debounceId);
    debounceId = window.setTimeout(run, 250);
  };

  const observer = new MutationObserver(() => {
    if (applying) return; // ignore nos propres écritures
    schedule();
  });

  // Restauration de la langue mémorisée (survit au reload / cold-start natif).
  // Le projet Weglot étant en mode SUBDIRECTORY, Weglot déduit la langue de l'URL
  // et peut réécraser un switchTo trop précoce → on réessaie de façon bornée
  // jusqu'à ce que la langue « tienne ».
  const restoreSavedLang = () => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem("weglot_language");
    } catch {
      return;
    }
    if (!saved || saved === originalLang) return;
    let attempts = 0;
    const tid = window.setInterval(() => {
      attempts += 1;
      const wg = getWeglot();
      if (wg && currentLang(wg) === saved) {
        window.clearInterval(tid);
        return;
      }
      try {
        wg?.switchTo?.(saved!);
      } catch {
        /* noop */
      }
      if (attempts > 20) window.clearInterval(tid);
    }, 300);
  };

  const start = () => {
    const wg = getWeglot();
    restoreSavedLang();

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    try {
      wg?.on?.("languageChanged", () => schedule());
    } catch {
      /* noop */
    }
    schedule();
  };

  // Attendre que Weglot (et translate) soit dispo (script CDN async).
  let tries = 0;
  const id = window.setInterval(() => {
    tries += 1;
    if (getWeglot()?.translate) {
      window.clearInterval(id);
      start();
    } else if (tries > 100) {
      window.clearInterval(id);
    }
  }, 100);
}
