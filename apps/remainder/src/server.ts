import http from "node:http";

const port = Number(process.env.PORT ?? 4005);

http
  .createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${port}`);
    res.setHeader("Content-Type", "application/json");
    if (url.pathname === "/health") {
      res.end(JSON.stringify({ ok: true, service: "remainder" }));
      return;
    }
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "not found" }));
  })
  .listen(port, () => {
    console.log(`[remainder] listening on http://localhost:${port}`);
  });
