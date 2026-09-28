const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const publicFiles = new Set(['index.html', 'styles.css', 'game.js', 'experience.js', 'scenery.js']);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
function createGameServer() {
  return http.createServer((req, res) => {
    let file;
    try { file = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\//, '') || 'index.html'; }
    catch { res.writeHead(400); res.end('Bad request'); return; }
    if (!publicFiles.has(file)) { res.writeHead(404); res.end('Not found'); return; }
    fs.readFile(path.join(root,file), (error, data) => {
      if (error) { res.writeHead(500); res.end('Could not load game'); return; }
      res.writeHead(200, {'Content-Type':types[path.extname(file)],'Cache-Control':'no-store'});
      res.end(data);
    });
  });
}
module.exports = { createGameServer };
if (require.main === module) {
  const port = Number(process.env.PORT) || 5173;
  const server = createGameServer();
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`Nick is ready for work: http://127.0.0.1:${port}`));
}
