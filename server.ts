// server.ts
import { serve } from "bun";
import { existsSync } from "node:fs";

serve({
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = `.${path}`;

    if (existsSync(filePath)) {
      return new Response(Bun.file(filePath));
    }

    // Return a clean 404 for missing icons/favicons
    return new Response("Not Found", { status: 404 });
  },
  port: 3000,
});

console.log("Server running at http://localhost:3000");