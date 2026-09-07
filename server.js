const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const PORT = 8080;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".mp3": "audio/mpeg"
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split("?")[0]);
  if (reqPath === "/" || reqPath === "") {
    reqPath = "/index.html";
  }

  const filePath = path.normalize(path.join(PUBLIC_DIR, reqPath));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.statusCode = 403;
    return res.end("Forbidden");
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      return res.end("Not Found");
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const acceptEncoding = req.headers["accept-encoding"] || "";

    const shouldGzip = (ext === ".js" || ext === ".html" || ext === ".json" || ext === ".css") && acceptEncoding.includes("gzip");

    if (shouldGzip) {
      res.writeHead(200, {
        "Content-Type": contentType,
        "Content-Encoding": "gzip",
        "Vary": "Accept-Encoding",
        "Cache-Control": "public, max-age=3600"
      });
      const rawStream = fs.createReadStream(filePath);
      const gzipStream = zlib.createGzip({ level: 6 });
      rawStream.pipe(gzipStream).pipe(res);
      rawStream.on("error", () => res.end());
      res.on("error", () => rawStream.destroy());
    } else {
      res.writeHead(200, {
        "Content-Type": contentType,
        "Content-Length": stats.size,
        "Cache-Control": "public, max-age=3600"
      });
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      stream.on("error", () => res.end());
      res.on("error", () => stream.destroy());
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}/`);
});
