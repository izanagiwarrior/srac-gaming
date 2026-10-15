'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createApp: createCapsa } = require('./games/capsa/server');
const { createMahjongServer } = require('./games/mahjong/server');
const { createPokerServer } = require('./games/poker/server');
const { createChessServer } = require('./games/chess/server');
const { createDominoServer } = require('./games/domino/server');
const { createBlackjackServer } = require('./games/blackjack/server');

const VERSION = '2026-10-15-ui-polish-1';

function createHub() {
  let closing = false;
  const runtimeDir = process.env.DATA_DIR || path.join(__dirname,'var');
  const sharedAddresses = () => {
    if (process.env.NODE_ENV === 'production') return [];
    if (['127.0.0.1','::1'].includes(server.address()?.address || process.env.HOST)) return [];
    const port = server.address()?.port || Number(process.env.PORT || 3000);
    return [...new Set(Object.values(os.networkInterfaces()).flat().filter(n => n && n.family === 'IPv4' && !n.internal)
      .map(n => 'http://' + n.address + ':' + port))];
  };
  // Each factory owns its rooms, timers, and WebSocket server. Only the hub listens.
  const games = new Map([
    ['capsa',createCapsa()],
    ['mahjong',createMahjongServer()],
    ['poker',createPokerServer({ dataDir:path.join(runtimeDir,'poker'), getAddresses:sharedAddresses })],
    ['catur',createChessServer({ getAddresses:sharedAddresses })],
    ['domino',createDominoServer({ getAddresses:sharedAddresses })],
    ['blackjack',createBlackjackServer({ getAddresses:sharedAddresses })]
  ]);
  const assets = new Map([
    ['/', ['public/index.html','text/html; charset=utf-8']],
    ['/index.html', ['public/index.html','text/html; charset=utf-8']],
    ['/hub.css', ['public/hub.css','text/css; charset=utf-8']],
    ['/hub.js', ['public/hub.js','application/javascript; charset=utf-8']],
    ['/hub-game.css', ['public/hub-game.css','text/css; charset=utf-8']],
    ['/hub-game.js', ['public/hub-game.js','application/javascript; charset=utf-8']],
    ['/game-tools.js', ['public/game-tools.js','application/javascript; charset=utf-8']],
    ['/favicon.svg', ['public/favicon.svg','image/svg+xml']],
    ['/table.svg', ['public/table.svg','image/svg+xml']],
    ['/chess-art.svg', ['public/chess-art.svg','image/svg+xml']],
    ['/domino-art.svg', ['public/domino-art.svg','image/svg+xml']]
  ]);
  function route(url) {
    const match = /^\/(capsa|mahjong|poker|catur|domino|blackjack)(\/.*)?$/.exec(url.pathname);
    return match ? { slug:match[1], remainder:match[2] || '/', app:games.get(match[1]), bare:!match[2] } : null;
  }
  const server = http.createServer((req,res) => {
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','same-origin');
    let url;
    try { url = new URL(req.url,'http://localhost'); } catch { res.writeHead(400); return res.end('Bad request'); }
    if (closing) { res.writeHead(503); return res.end('Restarting'); }
    if (url.pathname === '/health' && ['GET','HEAD'].includes(req.method)) {
      res.writeHead(200,{ 'Content-Type':'application/json', 'Cache-Control':'no-store' });
      return res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ ok:true, version:VERSION, games:[...games.keys()] }));
    }
    const game = route(url);
    if (game) {
      if (game.bare) { res.writeHead(308,{ Location:'/' + game.slug + '/' + url.search }); return res.end(); }
      req.url = game.remainder + url.search;
      try { return game.app.server.emit('request',req,res); }
      catch (error) { console.error('Game request failed:',game.slug,error.message); if (!res.headersSent) res.writeHead(500); return res.end('Cannot load game'); }
    }
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
    const asset = assets.get(url.pathname);
    if (!asset) { res.writeHead(404); return res.end('Not found'); }
    fs.readFile(path.join(__dirname,asset[0]),(error,data) => {
      if (error) { res.writeHead(500); return res.end('Cannot load page'); }
      res.writeHead(200,{ 'Content-Type':asset[1], 'Cache-Control':'no-store',
        'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'" });
      res.end(req.method === 'HEAD' ? undefined : data);
    });
  });
  server.on('upgrade',(req,socket,head) => {
    let url;
    try { url = new URL(req.url,'http://localhost'); } catch { socket.destroy(); return; }
    const game = route(url);
    if (closing || !game || game.remainder !== '/ws') {
      socket.end('HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n'); return;
    }
    if (req.headers.origin) {
      try { if (new URL(req.headers.origin).host !== req.headers.host) throw new Error('Origin mismatch'); }
      catch { socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); return; }
    }
    req.url = '/ws';
    game.app.server.emit('upgrade',req,socket,head);
  });
  async function close() {
    if (closing) return;
    closing = true;
    await Promise.all([...games.values()].map(game => game.close()));
    server.closeIdleConnections();
    await new Promise(resolve => server.close(resolve));
  }
  return { server,games,close,version:VERSION };
}
if (require.main === module) {
  const app = createHub(), port = Number(process.env.PORT || 3000), host = process.env.HOST || '0.0.0.0';
  app.server.on('error',error => { console.error('Meja Kita:',error.message); app.close().finally(() => process.exit(1)); });
  app.server.listen(port,host,() => console.log('Meja Kita ' + VERSION + '\nLocal: http://localhost:' + port));
  let shutdown = false;
  const stop = () => {
    if (shutdown) return; shutdown = true;
    const deadline = setTimeout(() => process.exit(1),10000); deadline.unref();
    app.close().then(() => process.exit(0)).catch(error => { console.error(error.message); process.exit(1); });
  };
  process.on('SIGINT',stop); process.on('SIGTERM',stop);
}
module.exports = { createHub };
