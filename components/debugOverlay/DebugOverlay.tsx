"use client";

import { useEffect, useState, useCallback } from "react";

interface LogEntry {
  id: number;
  type: "error" | "warn" | "log" | "unhandled";
  message: string;
  timestamp: string;
}

let _counter = 0;

export default function DebugOverlay() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [visible, setVisible] = useState(true);
  const [minimized, setMinimized] = useState(false);

  const push = useCallback((type: LogEntry["type"], args: unknown[]) => {
    const message = args
      .map((a) => {
        if (a instanceof Error) return `${a.message}\n${a.stack ?? ""}`;
        if (typeof a === "object") {
          try { return JSON.stringify(a, null, 2); } catch { return String(a); }
        }
        return String(a);
      })
      .join(" ");

    const timestamp = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setEntries((prev) => [{ id: ++_counter, type, message, timestamp }, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    const origError = console.error.bind(console);
    const origWarn = console.warn.bind(console);
    const origLog = console.log.bind(console);

    console.error = (...args) => { origError(...args); push("error", args); };
    console.warn = (...args) => { origWarn(...args); push("warn", args); };
    console.log = (...args) => { origLog(...args); push("log", args); };

    const onError = (e: ErrorEvent) => push("unhandled", [`[window.onerror] ${e.message}`, e.filename, `line ${e.lineno}`]);
    const onRejection = (e: PromiseRejectionEvent) => push("unhandled", [`[unhandledrejection] ${e.reason}`]);

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      console.error = origError;
      console.warn = origWarn;
      console.log = origLog;
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [push]);

  if (!visible) return null;

  const colors: Record<LogEntry["type"], string> = {
    error: "#ff4d4d",
    unhandled: "#ff4d4d",
    warn: "#ffaa00",
    log: "#aaa",
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "env(safe-area-inset-bottom, 0px)",
        left: 0,
        right: 0,
        maxHeight: minimized ? 40 : "50vh",
        background: "rgba(0,0,0,0.92)",
        zIndex: 999999,
        fontFamily: "monospace",
        fontSize: 11,
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        borderTop: "2px solid #BBFE68",
        transition: "max-height 0.2s",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{ display: "flex", alignItems: "center", padding: "4px 8px", background: "#111", gap: 8, flexShrink: 0 }}
      >
        <span style={{ color: "#BBFE68", fontWeight: "bold", flex: 1 }}>
          🐛 Debug ({entries.length})
        </span>
        <button onClick={() => setMinimized((m) => !m)} style={{ background: "none", border: "none", color: "#fff", fontSize: 14, cursor: "pointer", padding: "0 4px" }}>
          {minimized ? "▲" : "▼"}
        </button>
        <button
          onClick={() => {
            const text = entries.map((e) => `[${e.timestamp}][${e.type}] ${e.message}`).join("\n");
            navigator.clipboard?.writeText(text).catch(() => {});
          }}
          style={{ background: "none", border: "none", color: "#BBFE68", fontSize: 11, cursor: "pointer", padding: "0 4px" }}
        >
          copy
        </button>
        <button onClick={() => setEntries([])} style={{ background: "none", border: "none", color: "#aaa", fontSize: 11, cursor: "pointer", padding: "0 4px" }}>
          clear
        </button>
        <button onClick={() => setVisible(false)} style={{ background: "none", border: "none", color: "#aaa", fontSize: 14, cursor: "pointer", padding: "0 4px" }}>
          ✕
        </button>
      </div>

      {/* Log entries */}
      {!minimized && (
        <div style={{ overflowY: "auto", flex: 1, padding: "4px 0" }}>
          {entries.length === 0 ? (
            <div style={{ padding: "8px 12px", color: "#555" }}>Aucune erreur</div>
          ) : (
            entries.map((e) => (
              <div
                key={e.id}
                style={{
                  padding: "3px 8px",
                  borderBottom: "1px solid #222",
                  color: colors[e.type],
                  wordBreak: "break-all",
                  whiteSpace: "pre-wrap",
                }}
              >
                <span style={{ color: "#555", marginRight: 6 }}>{e.timestamp}</span>
                {e.message}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
