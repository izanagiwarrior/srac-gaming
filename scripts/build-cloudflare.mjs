import {build} from 'esbuild';
import {readFile,mkdir,cp,writeFile,readdir,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'dist/cloudflare'),assets=path.join(out,'public');
const source=await readFile(path.join(root,'server.js'),'utf8');
const version=/const VERSION = '([^']+)'/.exec(source)?.[1];if(!version)throw Error('Missing hub build ID');
await rm(out,{recursive:true,force:true});
await mkdir(assets,{recursive:true});
// Explicit source directories only; never copy a checkout, DATA_DIR or .git.
const games={capsa:'capsa',mahjong:'mahjong',poker:'poker',catur:'chess',domino:'domino',blackjack:'blackjack'};
async function copyPublic(from,to){await mkdir(to,{recursive:true});for(const file of await readdir(from,{withFileTypes:true})){if(!file.isFile()||!/^[-a-z0-9.]+\.(html|css|js|svg|png|webp|ico)$/.test(file.name))throw Error('Unexpected public asset: '+file.name);await cp(path.join(from,file.name),path.join(to,file.name));}}
await copyPublic(path.join(root,'public'),assets);
for(const [slug,folder]of Object.entries(games)){await copyPublic(path.join(root,'games',folder,'public'),path.join(assets,slug));if(['capsa','mahjong','poker','blackjack'].includes(slug))await cp(path.join(root,'games',folder,'engine.js'),path.join(assets,slug,'engine.js'));}
await cp(path.join(root,'games/mahjong/hong-kong.js'),path.join(assets,'mahjong/hong-kong.js'));
// Build-time link validation catches missing script/style/image payloads.
for(const slug of ['',...Object.keys(games)]){
  const html=await readFile(path.join(assets,slug,'index.html'),'utf8');
  for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
    if(!match[1].startsWith('/')||match[1].startsWith('//'))continue;
    const target=new URL(match[1],'https://assets.invalid').pathname;
    if(!/\.(js|css|svg|png|webp|ico)$/.test(target))continue;
    await readFile(path.join(assets,target));
  }
}

await writeFile(path.join(assets,'_headers'),`/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: same-origin\n  Cache-Control: no-store\n  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'\n`);
const compat=name=>path.join(root,'cloudflare/compat',name+'.cjs');
const nodeRequires={name:'static-node-requires',setup(b){b.onResolve({filter:/^(node:(buffer|crypto|events|path)|path)$/},args=>args.kind==='require-call'?{path:args.path==='path'?'node:path':args.path,namespace:'static-node'}:null);b.onLoad({filter:/.*/,namespace:'static-node'},args=>({contents:`import * as native from ${JSON.stringify(args.path)}; module.exports=native;`,loader:'js'}));}};
await build({plugins:[nodeRequires],entryPoints:[path.join(root,'cloudflare/worker.js')],outfile:path.join(out,'worker.js'),bundle:true,format:'esm',platform:'neutral',mainFields:['module','main'],target:'es2022',minify:true,sourcemap:false,external:['cloudflare:workers','node:*','path'],inject:[path.join(root,'cloudflare/compat/globals.js')],alias:{ws:compat('ws'),'node:http':compat('http'),http:compat('http'),'node:fs':compat('fs'),fs:compat('fs'),'node:os':compat('os'),os:compat('os'),'node:v8':compat('v8')},define:{__SRAC_BUILD__:JSON.stringify(version),'process.env.NODE_ENV':'"production"','process.env.SPEED':'"1"','process.env.UNDO_MS':'"2000"',__dirname:'"/unused"'}});
await writeFile(path.join(out,'BUILD.json'),JSON.stringify({version,games:Object.keys(games),runtime:'Workers + SQLite Durable Object'},null,2)+'\n');
console.log('Cloudflare build ready: '+version+' (six games). No deployment performed.');
