// Optional local preview. The website itself needs no server-side code or build.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const port = Number(process.argv[2] || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port');

// Serve only public website files, even when the checkout contains local environment files.
const publicFiles = new Set(['index.html', 'podcast.html', 'styles.css', 'site.js', 'profile.jpg', 'favicon.svg', 'favicon.ico', 'apple-touch-icon.png']);
function addContent(directory) {
  if (!fs.existsSync(path.join(root, directory))) return;
  for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
    const file = directory + '/' + entry.name;
    if (entry.isDirectory()) addContent(file);
    else if (entry.isFile() && /\.(html|jpg|jpeg|png|webp|svg)$/.test(entry.name)) publicFiles.add(file);
  }
}
addContent('podcast');
addContent('articles');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

const server = http.createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return;
  }
  let file;
  try {
    file = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).slice(1) || 'index.html';
  } catch {
    response.writeHead(400);
    response.end('Bad request');
    return;
  }
  if (!publicFiles.has(file)) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }
  fs.readFile(path.join(root, file), (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    response.writeHead(200, { 'Content-Type': types[path.extname(file)], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : data);
  });
});
server.listen(port, '127.0.0.1', () => console.log(`Homepage preview: http://127.0.0.1:${port}`));
