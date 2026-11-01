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

const {createUnoServer}=require('./games/uno/server');
const {createLudoServer}=require('./games/ludo/server');

const {createMonopoliServer}=require('./games/monopoli/server');
const {createReversiServer}=require('./games/reversi/server');
const VERSION = '2026-11-01-monopoli-bot-trades-1';
const {installRoomService}=require('./games/shared/room-service');

function createHub(options = {}) {
  let closing = false;
  const runtimeDir = options.dataDir || process.env.DATA_DIR || path.join(__dirname,'var');
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
    ['poker',createPokerServer({ dataDir:path.join(runtimeDir,'poker'), getAddresses:sharedAddresses,managed:true })],
    ['catur',createChessServer({ getAddresses:sharedAddresses })],
    ['domino',createDominoServer({ getAddresses:sharedAddresses })],
    ['blackjack',createBlackjackServer({ getAddresses:sharedAddresses })],
    ['uno',createUnoServer({getAddresses:sharedAddresses})],['ludo',createLudoServer({getAddresses:sharedAddresses})],['monopoli',createMonopoliServer({getAddresses:sharedAddresses})],['reversi',createReversiServer({getAddresses:sharedAddresses})]
  ]);
  const services = new Map([...games].map(([slug,app])=>[slug,installRoomService(app,{slug,dataDir:path.join(runtimeDir,'rooms')})]));
  const assets = new Map([
    ['/strategy-ui.js',['public/strategy-ui.js','application/javascript; charset=utf-8']],
    ['/party-client.js',['public/party-client.js','application/javascript; charset=utf-8']],
    ['/party.css',['public/party.css','text/css; charset=utf-8']],
    ['/accessory-amethyst-frame.webp', ['public/accessory-amethyst-frame.webp','image/webp']],
    ['/accessory-crown-frame.webp', ['public/accessory-crown-frame.webp','image/webp']],
    ['/accessory-emerald-frame.webp', ['public/accessory-emerald-frame.webp','image/webp']],
    ['/accessory-gold.webp', ['public/accessory-gold.webp','image/webp']],
    ['/accessory-lotus-frame.webp', ['public/accessory-lotus-frame.webp','image/webp']],
    ['/accessory-orbit-frame.webp', ['public/accessory-orbit-frame.webp','image/webp']],
    ['/accessory-ruby-frame.webp', ['public/accessory-ruby-frame.webp','image/webp']],
    ['/accessory-sapphire-frame.webp', ['public/accessory-sapphire-frame.webp','image/webp']],
    ['/characters-game-night.webp', ['public/characters-game-night.webp','image/webp']],
    ['/leaderboard-dragons.webp', ['public/leaderboard-dragons.webp','image/webp']],
    ['/cast-bamboo-panda.webp', ['public/cast-bamboo-panda.webp','image/webp']],
    ['/cast-bima.webp', ['public/cast-bima.webp','image/webp']],
    ['/cast-ember-tiger.webp', ['public/cast-ember-tiger.webp','image/webp']],
    ['/cast-fox.webp', ['public/cast-fox.webp','image/webp']],
    ['/cast-jade.webp', ['public/cast-jade.webp','image/webp']],
    ['/cast-mira-starlight.webp', ['public/cast-mira-starlight.webp','image/webp']],
    ['/cast-moon-rabbit.webp', ['public/cast-moon-rabbit.webp','image/webp']],
    ['/cast-raccoon-scout.webp', ['public/cast-raccoon-scout.webp','image/webp']],
    ['/cast-river-otter.webp', ['public/cast-river-otter.webp','image/webp']],
    ['/cast-snow-owl.webp', ['public/cast-snow-owl.webp','image/webp']],
    ['/cast-starter-buddy.webp', ['public/cast-starter-buddy.webp','image/webp']],
    ['/avatar-admin-faiz.webp', ['public/avatar-admin-faiz.webp','image/webp']],
    ['/avatar-admin-lion.webp', ['public/avatar-admin-lion.webp','image/webp']],
    ['/avatar-admin-lunar.webp', ['public/avatar-admin-lunar.webp','image/webp']],
    ['/avatar-admin-phoenix.webp', ['public/avatar-admin-phoenix.webp','image/webp']],
    ['/avatar-admin-qilin.webp', ['public/avatar-admin-qilin.webp','image/webp']],
    ['/avatar-admin-turtle.webp', ['public/avatar-admin-turtle.webp','image/webp']],
    ['/avatar-arka.webp', ['public/avatar-arka.webp','image/webp']],
    ['/avatar-bamboo-panda.webp', ['public/avatar-bamboo-panda.webp','image/webp']],
    ['/avatar-bima.webp', ['public/avatar-bima.webp','image/webp']],
    ['/avatar-crane.webp', ['public/avatar-crane.webp','image/webp']],
    ['/avatar-ember-tiger.webp', ['public/avatar-ember-tiger.webp','image/webp']],
    ['/avatar-fox.webp', ['public/avatar-fox.webp','image/webp']],
    ['/avatar-jade.webp', ['public/avatar-jade.webp','image/webp']],
    ['/avatar-koi-spirit.webp', ['public/avatar-koi-spirit.webp','image/webp']],
    ['/avatar-luna.webp', ['public/avatar-luna.webp','image/webp']],
    ['/avatar-mira-starlight.webp', ['public/avatar-mira-starlight.webp','image/webp']],
    ['/avatar-moon-rabbit.webp', ['public/avatar-moon-rabbit.webp','image/webp']],
    ['/avatar-nadia.webp', ['public/avatar-nadia.webp','image/webp']],
    ['/avatar-orion-explorer.webp', ['public/avatar-orion-explorer.webp','image/webp']],
    ['/avatar-raccoon-scout.webp', ['public/avatar-raccoon-scout.webp','image/webp']],
    ['/avatar-rio.webp', ['public/avatar-rio.webp','image/webp']],
    ['/avatar-river-otter.webp', ['public/avatar-river-otter.webp','image/webp']],
    ['/avatar-sakura-ronin.webp', ['public/avatar-sakura-ronin.webp','image/webp']],
    ['/avatar-sari.webp', ['public/avatar-sari.webp','image/webp']],
    ['/avatar-snow-owl.webp', ['public/avatar-snow-owl.webp','image/webp']],
    ['/avatar-starter-buddy.webp', ['public/avatar-starter-buddy.webp','image/webp']],
    ['/account/', ['public/account.html','text/html; charset=utf-8']],
    ['/admin/', ['public/account.html','text/html; charset=utf-8']],
    ['/account.css', ['public/account.css','text/css; charset=utf-8']],
    ['/account-app.js', ['public/account-app.js','application/javascript; charset=utf-8']],
    ['/account-bridge.css', ['public/account-bridge.css','text/css; charset=utf-8']],
    ['/account-bridge.js', ['public/account-bridge.js','application/javascript; charset=utf-8']],

    ['/brand.css', ['public/brand.css','text/css; charset=utf-8']],
    ['/avatar-admin-faiz-white.webp', ['public/avatar-admin-faiz-white.webp','image/webp']],
    ['/uno-deck-art.webp', ['public/uno-deck-art.webp','image/webp']],
    ['/uno-cards.css', ['public/uno-cards.css','text/css']],
    ['/brand-emblem.webp', ['public/brand-emblem.webp','image/webp']],
    ['/brand-dragon.webp', ['public/brand-dragon.webp','image/webp']],
    ['/cast-admin-faiz.webp', ['public/cast-admin-faiz.webp','image/webp']],
    ['/leaderboard/', ['public/leaderboard.html','text/html; charset=utf-8']],
    ['/leaderboard', ['public/leaderboard.html','text/html; charset=utf-8']],
    ['/leaderboard.js', ['public/leaderboard.js','text/javascript; charset=utf-8']],
    ['/leaderboard.css', ['public/leaderboard.css','text/css; charset=utf-8']],
    ['/', ['public/index.html','text/html; charset=utf-8']],
    ['/index.html', ['public/index.html','text/html; charset=utf-8']],
    ['/hub.css', ['public/hub.css','text/css; charset=utf-8']],
    ['/hub.js', ['public/hub.js','application/javascript; charset=utf-8']],
    ['/room-client.js',['public/room-client.js','application/javascript; charset=utf-8']],
    ['/theme.js',['public/theme.js','application/javascript; charset=utf-8']],
    ['/help.js',['public/help.js','application/javascript; charset=utf-8']],
    ['/help.css',['public/help.css','text/css; charset=utf-8']],
    ['/theme.css',['public/theme.css','text/css; charset=utf-8']],
    ['/room-ui.css',['public/room-ui.css','text/css; charset=utf-8']],
    ['/hub-game.css', ['public/hub-game.css','text/css; charset=utf-8']],
    ['/hub-game.js', ['public/hub-game.js','application/javascript; charset=utf-8']],
    ['/game-tools.js', ['public/game-tools.js','application/javascript; charset=utf-8']],
    ['/disclosures.css', ['public/disclosures.css','text/css']],
    ['/lobby-panels.css', ['public/lobby-panels.css','text/css']],
    ['/favicon-dragon-v1.png', ['public/favicon-dragon-v1.png','image/png']],
    ['/favicon.svg', ['public/favicon.svg','image/svg+xml']],
    ['/table.svg', ['public/table.svg','image/svg+xml']],
    ['/chess-art.svg', ['public/chess-art.svg','image/svg+xml']],
    ['/domino-art.svg', ['public/domino-art.svg','image/svg+xml']]
  ]);
  function route(url) {
    const match = /^\/(capsa|mahjong|poker|catur|domino|blackjack|uno|ludo|monopoli|reversi)(\/.*)?$/.exec(url.pathname);
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
    if(url.pathname==='/api/lobby'&&['GET','HEAD'].includes(req.method)){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});return res.end(req.method==='HEAD'?undefined:JSON.stringify({version:VERSION,rooms:[...services.values()].flatMap(s=>s.summary()).slice(0,200)}));}
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
    for(const service of services.values())service.close();
    await Promise.all([...games.values()].map(game => game.close()));
    server.closeIdleConnections();
    await new Promise(resolve => server.close(resolve));
  }
  return { server,games,services,close,version:VERSION };
}
if (require.main === module) {
  const app = createHub(), port = Number(process.env.PORT || 3000), host = process.env.HOST || '127.0.0.1';
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
