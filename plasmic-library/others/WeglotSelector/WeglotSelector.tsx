import React, { useEffect, useMemo, useState, useRef } from "react";

export interface WeglotSelectorProps {
  // Langues disponibles (codes ISO: ex 'fr', 'en')
  languages?: string[];
  // Libellés à afficher pour chaque langue; si absent, on n'affiche rien
  labels?: Record<string, string>;
  // Langue par défaut si Weglot n'est pas dispo
  defaultLanguage?: string;
  // Style simple
  className?: string;
  // Direction du dropdown: 'up' (vers le haut) ou 'down' (vers le bas)
  dropdownDirection?: "up" | "down" | "auto";
  // Event: renvoie { code, label }
  onLanguageChange?: (lang: { code: string; label: string }) => void;
}

const FLAG_SVG_URLS: Record<string, string | undefined> = {
  fr: "/plasmic/weglot/flags/fr.svg",
  en: "/plasmic/weglot/flags/en.svg",
};

// API publique minimale du snippet Weglot (pas de types officiels fournis).
type WeglotApi = {
  switchTo?: (code: string) => void;
  getLanguage?: () => string;
  getCurrentLang?: () => string;
  _getCurrentLang?: () => string;
  on?: (event: string, cb: () => void) => void;
  off?: (event: string, cb: () => void) => void;
};

// Lecture LIVE de window.Weglot : le script Weglot se charge en asynchrone APRÈS
// le montage du composant. Capturer la référence une seule fois au render donnait
// souvent `null` figé → switchTo jamais appelé → "rien ne se passe" au clic.
function getWeglot(): WeglotApi | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { Weglot?: WeglotApi }).Weglot ?? null;
}

function persistLang(code: string) {
  try {
    window.localStorage.setItem("weglot_language", code);
    document.cookie = `weglot_language=${encodeURIComponent(
      code
    )}; path=/; max-age=${60 * 60 * 24 * 365}`;
  } catch {}
}

const WeglotSelector: React.FC<WeglotSelectorProps> = ({
  languages = ["fr", "en"],
  labels = {},
  defaultLanguage = "fr",
  className = "",
  dropdownDirection = "down",
  onLanguageChange,
}) => {
  const getLabel = (code: string): string => {
    return Object.prototype.hasOwnProperty.call(labels, code)
      ? labels[code] ?? ""
      : "";
  };

  const normalizedOptions = useMemo(() => {
    return languages.map((code) => ({
      code,
      label: getLabel(code),
      flagSvg: FLAG_SVG_URLS[code],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languages, labels]);

  const getWeglotLanguage = (): string | null => {
    try {
      const weglot = getWeglot();
      if (!weglot) return null;
      // Compat: certaines versions exposent getLanguage, d'autres _getCurrentLang
      return (
        weglot.getLanguage?.() ||
        weglot.getCurrentLang?.() ||
        weglot._getCurrentLang?.() ||
        null
      );
    } catch {
      return null;
    }
  };

  const [selected, setSelected] = useState<string>(defaultLanguage);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [autoOpenUp, setAutoOpenUp] = useState<boolean>(false);
  // Passe à true dès que window.Weglot est disponible (script CDN chargé).
  const [weglotReady, setWeglotReady] = useState<boolean>(false);

  // Synchronise l'état local avec Weglot au montage (LS puis Weglot si dispo)
  useEffect(() => {
    try {
      const ls = window.localStorage.getItem("weglot_language");
      if (ls) setSelected(ls);
    } catch {}
    const current = getWeglotLanguage();
    if (current && current !== selected) setSelected(current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll court pour attendre le chargement réel de Weglot (script CDN async).
  // Dès qu'il est dispo, on marque weglotReady (→ rebranche l'écouteur ci-dessous)
  // et on resynchronise la langue affichée.
  useEffect(() => {
    let tries = 0;
    const maxTries = 50; // ~5s à 100ms (le CDN peut être lent sur mobile)
    const id = window.setInterval(() => {
      tries += 1;
      if (getWeglot()) setWeglotReady(true);
      const current = getWeglotLanguage();
      if (current) {
        setSelected((prev) => (prev !== current ? current : prev));
        window.clearInterval(id);
      }
      if (tries >= maxTries) window.clearInterval(id);
    }, 100);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Quand Weglot change en dehors (ex: widget natif), on écoute l'évènement si dispo.
  // Dépend de weglotReady pour (re)brancher l'écouteur une fois Weglot chargé.
  useEffect(() => {
    const weglot = getWeglot();
    if (!weglot?.on) return;
    const handler = () => {
      const current = getWeglotLanguage();
      if (current) setSelected(current);
    };
    try {
      weglot.on("languageChanged", handler);
      return () => weglot.off?.("languageChanged", handler);
    } catch {
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weglotReady]);

  // Resynchronise lorsqu'on revient sur l'onglet (visibility change)
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") {
        const current = getWeglotLanguage();
        if (current) setSelected(current);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Fermer au clic extérieur
  useEffect(() => {
    if (!isOpen) return;
    const onDocClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      const inButton = buttonRef.current?.contains(target);
      const inMenu = menuRef.current?.contains(target);
      if (!inButton && !inMenu) setIsOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("touchstart", onDocClick, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("touchstart", onDocClick);
    };
  }, [isOpen]);

  // Fermer avec Échap
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  // Decide direction en mode auto (à l'ouverture + resize/scroll)
  const decideAutoDirection = () => {
    try {
      const btn = buttonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const viewportH =
        window.innerHeight || document.documentElement.clientHeight;
      const spaceBelow = Math.max(0, viewportH - rect.bottom);
      const spaceAbove = Math.max(0, rect.top);
      // Estimation de la hauteur du menu
      const estimatedItemH = 36; // px
      const estimatedMenuH = Math.min(
        240,
        normalizedOptions.length * estimatedItemH
      );
      // Ouvre vers le haut si dessous insuffisant mais au-dessus suffisant
      if (spaceBelow < estimatedMenuH && spaceAbove > spaceBelow) {
        setAutoOpenUp(true);
      } else {
        setAutoOpenUp(false);
      }
    } catch {}
  };

  useEffect(() => {
    if (!isOpen || dropdownDirection !== "auto") return;
    decideAutoDirection();
    const onWinChange = () => decideAutoDirection();
    window.addEventListener("resize", onWinChange);
    window.addEventListener("scroll", onWinChange, true);
    return () => {
      window.removeEventListener("resize", onWinChange);
      window.removeEventListener("scroll", onWinChange, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, dropdownDirection]);

  // Applique la langue à Weglot. `switchTo` est la seule méthode publique de l'API.
  // Renvoie true si l'appel a pu être passé (Weglot présent), false sinon.
  const applyWeglotLanguage = (code: string): boolean => {
    const weglot = getWeglot();
    if (typeof weglot?.switchTo === "function") {
      try {
        weglot.switchTo(code);
        console.log("[WeglotSelector] switchTo →", code);
        return true;
      } catch (e) {
        console.warn("[WeglotSelector] switchTo a échoué:", e);
      }
    }
    return false;
  };

  const switchLanguage = (code: string) => {
    setSelected(code);
    persistLang(code);
    // Notifie Plasmic avec le libellé tel que fourni (éventuellement vide)
    onLanguageChange?.({ code, label: getLabel(code) });

    // Applique immédiatement ; si Weglot n'est pas encore chargé (script CDN async),
    // on réessaie pendant quelques secondes pour ne pas "perdre" le clic.
    if (!applyWeglotLanguage(code)) {
      console.warn(
        "[WeglotSelector] Weglot indisponible au clic, retry…",
        "(window.Weglot =",
        !!getWeglot(),
        ")"
      );
      let tries = 0;
      const id = window.setInterval(() => {
        tries += 1;
        if (applyWeglotLanguage(code) || tries >= 50) {
          window.clearInterval(id);
        }
      }, 100);
    }

    setIsOpen(false);
  };

  const isUp =
    dropdownDirection === "up" ||
    (dropdownDirection === "auto" ? autoOpenUp : false);

  return (
    <div
      className={className}
      style={{ position: "relative" }}
    >
      <button
        ref={buttonRef}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen((v) => {
            const next = !v;
            if (next && dropdownDirection === "auto") decideAutoDirection();
            return next;
          });
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen((v) => {
              const next = !v;
              if (next && dropdownDirection === "auto") decideAutoDirection();
              return next;
            });
          }
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          whiteSpace: "nowrap",
          background: "none",
          border: "none",
          padding: 0,
          font: "inherit",
          cursor: "pointer",
        }}
      >
        {FLAG_SVG_URLS[selected] && (
          <img
            src={FLAG_SVG_URLS[selected]!}
            alt=""
            aria-hidden
            style={{
              width: 16,
              height: 12,
              objectFit: "cover",
              borderRadius: 2,
            }}
          />
        )}
        {getLabel(selected) ? <span>{getLabel(selected)}</span> : null}
        <span aria-hidden style={{ marginLeft: "auto", opacity: 0.6 }}>
          {isOpen ? "▴" : "▾"}
        </span>
      </button>
      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          aria-activedescendant={`weglot-opt-${selected}`}
          style={{
            position: "absolute",
            ...(isUp
              ? { bottom: "100%", marginBottom: 6 }
              : { top: "100%", marginTop: 6 }),
            left: 0,
            zIndex: 1000,
            width: "max-content",
            maxWidth: "90vw",
            maxHeight: 240,
            overflowY: "auto",
            overflowX: "auto",
          }}
        >
          {normalizedOptions.map((opt) => {
            const isActive = opt.code === selected;
            return (
              <div
                id={`weglot-opt-${opt.code}`}
                key={opt.code}
                role="option"
                aria-selected={isActive}
                onClick={() => switchLanguage(opt.code)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") switchLanguage(opt.code);
                }}
                tabIndex={0}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                {opt.flagSvg && (
                  <img
                    src={opt.flagSvg}
                    alt=""
                    aria-hidden
                    style={{
                      width: 16,
                      height: 12,
                      objectFit: "cover",
                      borderRadius: 2,
                    }}
                  />
                )}
                {opt.label ? <span>{opt.label}</span> : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WeglotSelector;
