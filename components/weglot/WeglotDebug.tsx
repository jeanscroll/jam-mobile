"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
// ⚠️⚠️ DIAGNOSTIC TEMPORAIRE — à SUPPRIMER une fois le bug Weglot résolu.
// Affiche un panneau en haut de l'écran qui intercepte les requêtes réseau de
// Weglot (pour voir un éventuel échec CORS), l'origine réelle du WebView, l'état
// du script CDN, la langue courante, les erreurs JS/console, et permet de tester
// switchTo() en mesurant si le DOM change vraiment.

import React, { useEffect, useRef, useState } from "react";

const WEGLOT_DEBUG = true; // passer à false pour masquer

type WeglotApi = {
  switchTo?: (code: string) => void;
  getCurrentLang?: () => string;
  getLanguage?: () => string;
};

function getWeglot(): WeglotApi | undefined {
  return (window as unknown as { Weglot?: WeglotApi }).Weglot;
}

function readLang(w: WeglotApi | undefined): string {
  try {
    return w?.getCurrentLang?.() || w?.getLanguage?.() || "?";
  } catch {
    return "err";
  }
}

export default function WeglotDebug() {
  const [lines, setLines] = useState<string[]>([]);
  const ref = useRef<string[]>([]);

  const log = (m: string) => {
    ref.current = [...ref.current, m].slice(-250);
    setLines(ref.current);
  };

  useEffect(() => {
    if (!WEGLOT_DEBUG || typeof window === "undefined") return;

    log(`origin = ${window.location.origin}`);
    log(`href   = ${window.location.href}`);

    // --- intercepte fetch (logue uniquement les URLs Weglot) ---
    const origFetch = window.fetch;
    window.fetch = function (this: any, ...args: any[]) {
      const url = String(args[0]);
      const isWg = /weglot/i.test(url);
      if (isWg) log(`fetch → ${url}`);
      return (origFetch as any).apply(this, args).then(
        (res: Response) => {
          if (isWg) log(`fetch ✓ ${res.status} ${url}`);
          return res;
        },
        (err: unknown) => {
          if (isWg) log(`fetch ✗ ${url} :: ${String(err)}`);
          throw err;
        }
      );
    } as any;

    // --- intercepte XHR ---
    const XHR = XMLHttpRequest.prototype;
    const origOpen = XHR.open;
    const origSend = XHR.send;
    XHR.open = function (
      this: any,
      method: string,
      url: string,
      ...rest: any[]
    ) {
      this.__wgUrl = url;
      return (origOpen as any).apply(this, [method, url, ...rest]);
    } as any;
    XHR.send = function (this: any, ...sArgs: any[]) {
      const url = String(this.__wgUrl || "");
      if (/weglot/i.test(url)) {
        log(`xhr → ${url}`);
        this.addEventListener("load", () => log(`xhr ✓ ${this.status} ${url}`));
        this.addEventListener("error", () => log(`xhr ✗ (error/CORS) ${url}`));
      }
      return (origSend as any).apply(this, sArgs);
    } as any;

    // --- console + erreurs JS / ressources ---
    const origErr = console.error;
    console.error = (...a: any[]) => {
      log("console.error: " + a.map(String).join(" "));
      origErr(...a);
    };
    const origWarn = console.warn;
    console.warn = (...a: any[]) => {
      log("console.warn: " + a.map(String).join(" "));
      origWarn(...a);
    };
    const onErr = (e: Event) => {
      const t = e.target as { src?: string } | null;
      if (t && t.src && /weglot/i.test(t.src)) log(`RES ERROR: ${t.src}`);
      else if ((e as ErrorEvent).message)
        log(`JS ERROR: ${(e as ErrorEvent).message}`);
    };
    window.addEventListener("error", onErr, true);

    // --- timeline de l'état Weglot ---
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      const w = getWeglot();
      const hasScript = !!document.querySelector('script[src*="weglot"]');
      if ([1, 4, 10, 20, 40].includes(n)) {
        log(
          `t=${(n * 0.5).toFixed(
            1
          )}s | script=${hasScript} | Weglot=${typeof w} | lang=${readLang(w)}`
        );
      }
      if (n >= 40) window.clearInterval(id);
    }, 500);

    return () => {
      window.fetch = origFetch;
      XHR.open = origOpen;
      XHR.send = origSend;
      console.error = origErr;
      console.warn = origWarn;
      window.removeEventListener("error", onErr, true);
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trySwitch = (code: string) => {
    const w = getWeglot();
    log(
      `switchTo(${code}): Weglot=${typeof w}, switchTo=${typeof w?.switchTo}`
    );
    const before = document.body.innerText.slice(0, 60).replace(/\s+/g, " ");
    try {
      w?.switchTo?.(code);
      log(`switchTo(${code}) appelé sans exception`);
    } catch (e) {
      log(`switchTo(${code}) EXCEPTION: ${String(e)}`);
      return;
    }
    window.setTimeout(() => {
      const after = document.body.innerText.slice(0, 60).replace(/\s+/g, " ");
      log(`+1.5s lang=${readLang(w)} | DOM a changé=${before !== after}`);
    }, 1500);
  };

  if (!WEGLOT_DEBUG) return null;

  const btn: React.CSSProperties = {
    padding: "6px 10px",
    fontSize: 12,
    background: "#222",
    color: "#0f0",
    border: "1px solid #0f0",
    borderRadius: 4,
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        maxHeight: "50vh",
        overflowY: "auto",
        zIndex: 2147483647,
        background: "rgba(0,0,0,0.9)",
        color: "#0f0",
        font: "11px/1.35 monospace",
        padding: 8,
        whiteSpace: "pre-wrap",
        wordBreak: "break-all",
      }}
    >
      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        <button onClick={() => trySwitch("en")} style={btn}>
          switchTo EN
        </button>
        <button onClick={() => trySwitch("fr")} style={btn}>
          switchTo FR
        </button>
        <button
          onClick={() => {
            ref.current = [];
            setLines([]);
          }}
          style={btn}
        >
          clear
        </button>
      </div>
      {lines.join("\n")}
    </div>
  );
}
