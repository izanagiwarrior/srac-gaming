# Meja Kita

Satu landing page untuk **Capsa Banting, Mahjong, dan Poker Texas Hold’em**. Ketiga game berjalan dalam satu proses Node.js dan satu port HTTP/WebSocket.

Repository: [izanagiwarrior/srac-gaming](https://github.com/izanagiwarrior/srac-gaming).

Build: `2026-10-14-game-hub-1`.

## Jalankan lokal

Node.js 22 atau lebih baru diperlukan. Dari root repository:

```sh
npm ci --omit=dev --ignore-scripts
npm start
```

Buka **http://localhost:3005**. Untuk port lain, gunakan `PORT=3010 npm start`. Jangan gunakan port game lain yang sedang dimainkan. Teman dapat membuka alamat jaringan komputer server jika bermain lokal; setelah deployment online, semua memakai domain yang sama.

## Deploy gratis di Render

1. Hubungkan GitHub **izanagiwarrior** dan pilih repository **srac-gaming**. Berikan akses Render ke repository ini.
2. Pilih **New Web Service**, runtime **Node**, dan paket **Free**.
3. Root Directory: kosong (root repository).
4. Build Command: `npm ci --omit=dev --ignore-scripts`.
5. Start Command: `npm start`.
6. Health Check Path: `/health`.
7. Environment: `NODE_ENV=production`, `HOST=0.0.0.0`. Render menyediakan `PORT`; jangan memaksanya ke port localhost.
8. Set **Auto-Deploy → Off**, lalu deploy versi yang memang ingin dipasang.

`render.yaml` juga tersedia untuk deployment melalui Render Blueprint. Konfigurasi memakai paket Free, region Singapore, dan auto-deploy nonaktif. Review paket Free pada halaman konfirmasi sebelum membuat service.

Setelah aktif, bagikan URL publik landing page. Setiap game memiliki path dan room sendiri:

| Game | Alamat | Pemain |
| --- | --- | --- |
| Capsa Banting | `/capsa/` | Official 4; Non-official 3–8 |
| Mahjong | `/mahjong/` | 4, kursi kosong dapat diisi bot |
| Poker | `/poker/` | 2–8, tersedia pengaturan practice bots |

WebSocket masing-masing: `/capsa/ws`, `/mahjong/ws`, `/poker/ws`. Link room selalu menyertakan path game. Kode room yang sama pada game berbeda tetap merupakan dua room terpisah. Tombol **Pilih game** kembali ke landing page; saat sudah masuk room, browser meminta konfirmasi.

## Fitur yang dipertahankan

- **Capsa:** pembuka berisi 3♦, bot Bego/Normal/Hard, timer 60 detik, nilai rupiah otomatis, mode ruangan tetap, Easy Mode dengan saran dan undo 2× per pemain per ronde, rekap, chat, dan log.
- **Mahjong:** server-authoritative 4 pemain, claim Hu/Pung/Kong/Chow, bot, panduan, contekan, chat, penonton, dan pembatalan buangan.
- **Poker:** no-limit Hold’em, private cards, blinds, side pots, chips/IDR, buy-in dan rebuy host, panduan, rekap/CSV, practice bots, dan penyimpanan sesi lokal.

## Penyimpanan dan restart

Capsa dan Mahjong menyimpan room di RAM. Poker menyimpan sesi pada `var/poker/sessions.json` atau direktori privat `DATA_DIR` jika diatur. Folder runtime tidak disajikan melalui HTTP dan tidak di-commit.

**Pada Render Free, filesystem bersifat sementara.** Restart, deploy, atau tidur dapat menghapus sesi RAM dan file Poker. Repo ini tidak mengklaim penyimpanan permanen di Render Free. Bila sesi harus bertahan, tambahkan penyimpanan eksternal sebelum mengandalkannya. Unduh rekap yang diperlukan sebelum restart.

Render Free memiliki batas penggunaan dan tidur setelah tidak ada trafik. Jangan melakukan deployment saat orang sedang bermain; auto-deploy sengaja dinonaktifkan. Pembayaran tidak diproses aplikasi.

## Struktur

```text
server.js           # HTTP router dan dispatcher WebSocket satu port
public/             # Landing page dan navigasi antar-game
games/capsa/        # Source Capsa yang diintegrasikan
games/mahjong/      # Source Mahjong yang diintegrasikan
games/poker/        # Source Poker yang diintegrasikan
render.yaml         # Konfigurasi Render Free
```

Tidak menyertakan sesi pemain, token, data kantor, credential, atau node_modules. GitHub memakai repository `srac-gaming` di akun personal `izanagiwarrior`.

## Pemeriksaan

Pemeriksaan sintaks dan pratinjau dilakukan untuk integrasi. Tidak menambah atau menjalankan tes otomatis/multiplayer pada pekerjaan ini. Ready to deploy berarti source, dependency lock, entry point, route, asset, WebSocket, dan konfigurasi hosting tersedia; aturan tiap game mengikuti implementasi yang disertakan.

Rujukan hosting: [Render Web Services](https://render.com/docs/web-services), [WebSockets](https://render.com/docs/websocket), [Free limitations](https://render.com/docs/free), [Auto-Deploy](https://render.com/docs/deploys).
