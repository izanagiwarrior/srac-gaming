'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const dam=require('../games/dam/engine'),empat=require('../games/empat/engine'),tangga=require('../games/tangga/engine');
const room=(settings={playMode:'standard'},n=2)=>({settings,round:1,revision:0,turn:0,players:Array.from({length:n},(_,i)=>({id:'p'+i,name:'P'+i,hand:[]}))});

// ---- Dam ----
function damRoom(quick=false){const r=room({playMode:quick?'quick':'standard'});dam.start(r);return r;}
function damBoard(n,cells){const b=Array(n*n).fill(0);for(const [r,c,v]of cells)b[r*n+c]=v;return b;}
test('Dam: initial setup 12 v 12 (Quick 6 v 6) on dark squares, Merah moves first',()=>{
  const r=damRoom();assert.equal(r.size,8);assert.equal(r.board.filter(v=>v===1).length,12);assert.equal(r.board.filter(v=>v===-1).length,12);
  assert(r.board.every((v,i)=>!v||(Math.floor(i/8)+i%8)%2===1));assert.equal(dam.view(r,r.players[0],true).legal.length,7);assert.equal(dam.view(r,r.players[1],false).legal.length,0);
  const q=damRoom(true);assert.equal(q.size,6);assert.equal(q.board.filter(v=>v===1).length,6);
});
test('Dam: men move diagonally forward only and cannot move onto occupied squares or backwards',()=>{
  const r=damRoom();const from=5*8+0;// Merah at row5,col0
  assert.throws(()=>dam.act(r,r.players[0],{type:'move',from,to:6*8+1}),/tidak sah/);
  assert.throws(()=>dam.act(r,r.players[0],{type:'move',from:7*8+2,to:6*8+1}),/tidak sah/);
  const res=dam.act(r,r.players[0],{type:'move',from,to:4*8+1});assert.match(res.text,/melangkah/);assert.equal(r.turn,1);assert.equal(r.board[4*8+1],1);
});
test('Dam: capture is mandatory and a non-capturing move is rejected',()=>{
  const r=damRoom();r.board=damBoard(8,[[5,2,1],[4,3,-1],[7,0,1],[0,1,-1]]);
  assert.throws(()=>dam.act(r,r.players[0],{type:'move',from:7*8+0,to:6*8+1}),/Wajib makan/);
  const res=dam.act(r,r.players[0],{type:'move',from:5*8+2,to:3*8+4});assert.match(res.text,/memakan/);assert.equal(r.board[4*8+3],0);
});
test('Dam: multi-jump continues with the same piece and keeps the turn',()=>{
  const r=damRoom();r.board=damBoard(8,[[6,1,1],[5,2,-1],[3,4,-1],[0,7,-1],[7,6,1]]);
  const first=dam.act(r,r.players[0],{type:'move',from:6*8+1,to:4*8+3});assert.match(first.text,/lanjut/i);assert.equal(r.turn,0);assert.equal(r.chain,4*8+3);
  assert.throws(()=>dam.act(r,r.players[0],{type:'move',from:7*8+6,to:6*8+5}),/Wajib makan|tidak sah/);
  const view=dam.view(r,r.players[0],true);assert(view.legal.every(m=>m.from===4*8+3&&m.cap>=0));
  const second=dam.act(r,r.players[0],{type:'move',from:4*8+3,to:2*8+5});assert.equal(r.chain,null);assert.equal(r.turn,1);assert.equal(second.winner,undefined);
});
test('Dam: reaching the last row crowns a King, ends the turn even if more jumps exist, and Kings move backward',()=>{
  const r=damRoom();r.board=damBoard(8,[[1,2,1],[7,0,-1],[2,5,-1]]);
  const res=dam.act(r,r.players[0],{type:'move',from:1*8+2,to:0*8+1});assert.equal(r.board[1],2);assert.equal(r.lastMove.king,true);assert.match(res.text,/Raja/);assert.equal(r.turn,1);
  const k=damRoom();k.board=damBoard(8,[[3,3,2],[7,1,-1]]);assert(dam.view(k,k.players[0],true).legal.some(m=>m.to===4*8+2),'king steps backward');
});
test('Dam: winner when opponent has no pieces or no legal move; draw after 80 quiet plies',()=>{
  const r=damRoom();r.board=damBoard(8,[[5,2,1],[4,3,-1]]);const res=dam.act(r,r.players[0],{type:'move',from:5*8+2,to:3*8+4});assert.equal(res.winner,r.players[0]);
  assert.deepEqual(dam.deltas(r,r.players[0]),[10,-10]);assert.deepEqual(dam.deltas(r,r.players),[0,0]);
  const q=damRoom();q.board=damBoard(8,[[3,3,2],[0,7,-2]]);q.quiet=79;const draw=dam.act(q,q.players[0],{type:'move',from:3*8+3,to:2*8+2});assert.equal(draw.finished,true);assert.equal(draw.winners.length,2);
  const stuck=damRoom();stuck.board=damBoard(8,[[1,0,1],[1,2,1],[2,3,1],[5,0,1],[0,1,-1]]);const blocked=dam.act(stuck,stuck.players[0],{type:'move',from:5*8+0,to:4*8+1});assert.equal(blocked.winner,stuck.players[0],'opponent with pieces but no legal move loses');
});
test('Dam: bots always return a legal move at every level, including mid-chain',()=>{
  for(const level of ['easy','normal','hard']){const r=damRoom();for(let i=0;i<40;i++){const p=r.players[r.turn],m=dam.bot(r,p,level),legal=dam.gen(r.board,r.size,p.side,r.chain);assert(legal.some(x=>x.from===m.from&&x.to===m.to),level);const res=dam.act(r,p,m);r.revision++;if(res.winner||res.finished)break;}}
});
test('Dam: random self-play always terminates with a coherent result (no illegal states)',()=>{
  for(let g=0;g<25;g++){const r=damRoom(g%2===0);let done=false;for(let i=0;i<2000&&!done;i++){const p=r.players[r.turn],legal=dam.gen(r.board,r.size,p.side,r.chain);assert(legal.length>0);const m=legal[Math.floor(Math.random()*legal.length)];const res=dam.act(r,p,{type:'move',from:m.from,to:m.to});r.revision++;done=!!(res.winner||res.finished);}assert(done,'game must end');assert(r.board.every((v,i)=>!v||(Math.floor(i/r.size)+i%r.size)%2===1));}
});

// ---- Empat Berturut ----
function empatRoom(quick=false){const r=room({playMode:quick?'quick':'standard'});empat.start(r);return r;}
test('Empat: pieces fall to the lowest empty row; full or invalid columns are rejected',()=>{
  const r=empatRoom();empat.act(r,r.players[0],{type:'place',at:3});assert.equal(r.board[5*7+3],1);empat.act(r,r.players[1],{type:'place',at:3});assert.equal(r.board[4*7+3],-1);
  assert.throws(()=>empat.act(r,r.players[0],{type:'place',at:9}),/tidak valid/);assert.throws(()=>empat.act(r,r.players[0],{type:'place',at:-1}),/tidak valid/);assert.throws(()=>empat.act(r,r.players[0],{type:'place',at:1.5}),/tidak valid/);
  const q=empatRoom(true);assert.equal(q.cols,6);assert.equal(q.rows,5);
  const f=empatRoom();for(let i=0;i<6;i++)f.board[i*7]=i%2?1:-1;assert.throws(()=>empat.act(f,f.players[0],{type:'place',at:0}),/penuh/);assert(!empat.view(f,f.players[0],true).legal.includes(0));
});
test('Empat: wins horizontally, vertically and on both diagonals and reports the winning line',()=>{
  const cases={h:[[5,0],[5,1],[5,2],[5,3]],v:[[2,4],[3,4],[4,4],[5,4]],d1:[[2,0],[3,1],[4,2],[5,3]],d2:[[2,3],[3,2],[4,1],[5,0]]};
  for(const [name,cells]of Object.entries(cases)){const r=empatRoom();for(const [row,col]of cells.slice(0,3))r.board[row*7+col]=1;const [row,col]=cells[3];for(let rr=5;rr>row;rr--)r.board[rr*7+col]=r.board[rr*7+col]||-1;const res=empat.act(r,r.players[0],{type:'place',at:col});assert.equal(res.winner,r.players[0],name);assert.equal(r.winLine.length,4,name);}
});
test('Empat: draw when the board fills without four in a row; zero-sum deltas',()=>{
  const r=empatRoom();for(let rr=0;rr<6;rr++)for(let c=0;c<7;c++)r.board[rr*7+c]=(Math.floor(c/2)+rr)%2?-1:1;r.board[0]=0;
  const res=empat.act(r,r.players[0],{type:'place',at:0});assert.equal(res.finished,true);assert.equal(res.winners.length,2);assert.equal(res.winner,undefined);
  assert.deepEqual(empat.deltas(r,res.winners),[0,0]);assert.deepEqual(empat.deltas(r,r.players[1]),[-10,10]);
  const t=empatRoom();t.board[5*7]=1;t.board[5*7+1]=1;assert.equal(empat.act(t,t.players[0],{type:'place',at:2}).winner,undefined,'three in a row is not a win');
});
test('Empat: bots take an immediate win, block an immediate loss, and always play legal columns',()=>{
  const r=empatRoom();r.board[5*7]=1;r.board[5*7+1]=1;r.board[5*7+2]=1;assert.equal(empat.bot(r,r.players[0],'normal').at,3);assert.equal(empat.bot(r,r.players[0],'hard').at,3);
  const b=empatRoom();b.turn=1;b.board[5*7+4]=1;b.board[5*7+5]=1;b.board[5*7+6]=1;assert.equal(empat.bot(b,b.players[1],'normal').at,3);assert.equal(empat.bot(b,b.players[1],'hard').at,3);
  for(const level of ['easy','normal','hard']){const g=empatRoom();for(let i=0;i<42;i++){const p=g.players[g.turn],m=empat.bot(g,p,level);assert(empat.view(g,p,true).legal.includes(m.at),level);const res=empat.act(g,p,m);g.revision++;if(res.winner||res.finished)break;}}
});

// ---- Ular Tangga ----
function tanggaRoom(quick=false,n=2){const r=room({playMode:quick?'quick':'standard'},n);tangga.start(r);return r;}
test('Tangga: boards are well-formed (no chained or looping jumps, in range)',()=>{
  for(const l of Object.values(tangga.boards)){const end=l.size*l.size,jumps={...l.ladders,...l.snakes};for(const [from,to]of Object.entries(jumps)){assert(+from>0&&+from<end&&to>0&&to<=end);assert(!(to in jumps),'jump must not chain '+from);}for(const [f,t]of Object.entries(l.ladders))assert(t>+f);for(const [f,t]of Object.entries(l.snakes))assert(t<+f);assert(!(end in jumps));}
});
function withDice(values,fn){const crypto=require('node:crypto'),orig=crypto.randomInt;let i=0;crypto.randomInt=()=>values[i++];try{delete require.cache[require.resolve('../games/tangga/engine')];return fn(require('../games/tangga/engine'));}finally{crypto.randomInt=orig;delete require.cache[require.resolve('../games/tangga/engine')];}}
test('Tangga: ladders climb, snakes descend, exact finish required, six grants an extra roll, third six is void',()=>{
  withDice([3,1,4,5,6,6],eng=>{const r=room({playMode:'quick'});eng.start(r);const [a]=r.players;
    let res=eng.act(r,a,{type:'roll'});assert.equal(a.pos,13);assert.match(res.text,/tangga/);assert.equal(r.turn,1);
    r.turn=0;a.pos=16;res=eng.act(r,a,{type:'roll'});assert.equal(a.pos,6);assert.match(res.text,/ular/);
    r.turn=0;a.pos=34;res=eng.act(r,a,{type:'roll'});assert.equal(a.pos,34);assert.match(res.text,/pas/);
    r.turn=0;a.pos=30;res=eng.act(r,a,{type:'roll'});assert.equal(a.pos,21);
    r.turn=0;a.pos=20;res=eng.act(r,a,{type:'roll'});assert.equal(a.pos,26);assert.equal(r.turn,0);assert.match(res.text,/tambahan/);
    r.sixes=2;a.pos=10;res=eng.act(r,a,{type:'roll'});assert.equal(a.pos,10);assert.equal(r.turn,1);assert.match(res.text,/hangus/);
  });
});
test('Tangga: landing exactly on the last square wins; deltas follow Ludo-style scoring',()=>{
  withDice([2],eng=>{const r=room({playMode:'quick'},3);eng.start(r);r.players[0].pos=34;const res=eng.act(r,r.players[0],{type:'roll'});assert.equal(res.winner,r.players[0]);assert.deepEqual(eng.deltas(r,r.players[0]),[20,-10,-10]);});
});
test('Tangga: random self-play always terminates and keeps players on the board',()=>{
  for(let g=0;g<40;g++){const r=tanggaRoom(g%2===0,2+g%3);let done=false;for(let i=0;i<5000&&!done;i++){const p=r.players[r.turn],res=tangga.act(r,p,{type:'roll'});r.revision++;assert(r.players.every(x=>x.pos>=0&&x.pos<=r.size*r.size));done=!!res.winner;}assert(done);}
});
test('Tangga: only roll is accepted and views expose public positions',()=>{
  const r=tanggaRoom();assert.throws(()=>tangga.act(r,r.players[0],{type:'move'}),/Lempar/);const v=tangga.view(r,r.players[0],true);assert.equal(v.size,10);assert.equal(v.canRoll,true);assert.deepEqual(v.counts,[0,0]);
});
