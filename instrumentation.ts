export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.on("unhandledRejection", (reason: unknown) => {
      const msg = reason instanceof Error ? reason.message : String(reason);
      if (msg.includes("Internal Server Error") || msg.includes("PLASMIC")) {
        console.warn("PLASMIC: Suppressed unhandled rejection:", msg);
        return;
      }
      console.error("Unhandled rejection:", reason);
    });
  }
}
