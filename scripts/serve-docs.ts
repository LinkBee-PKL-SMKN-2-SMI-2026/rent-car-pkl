import { serve } from "bun";

const PORT = parseInt(process.env.DOCS_PORT || "3001", 10);
const DOCS_DIR = new URL("../docs/bundle", import.meta.url).pathname;

serve({
  port: PORT,
  async fetch(request: Request) {
    const url = new URL(request.url);
    const filePath = url.pathname === "/" ? "/index.html" : url.pathname;
    const file = Bun.file(DOCS_DIR + filePath);

    if (await file.exists()) {
      return new Response(file);
    }

    return new Response("404 - Not Found", { status: 404 });
  },
});

console.log(`\n📖 Docs served at: http://localhost:${PORT}\n`);
