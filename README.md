# Meja Kita

Satu landing page untuk **Capsa Banting, Mahjong, Poker Texas Hold’em, Catur, Domino Gaple, dan Blackjack**. Hosting utama memakai Cloudflare Workers + SQLite Durable Object tanpa laptop. Target Node.js satu port tetap tersedia secara terpisah.

Repository: [izanagiwarrior/srac-gaming](https://github.com/izanagiwarrior/srac-gaming).

Baseline cloud terpasang 23 Oktober 2026: **2.0.0 / `2026-10-23-cloudflare-hosting-1`**. [Main online](https://srac-gaming.faiz-triputra.workers.dev/). Periksa `/health` untuk status aktual. Rilis source 2.0.0 mencakup panduan agent; lihat [status dan panduan maintenance](docs/MAINTENANCE.md).

Terbaru: dua belas emote chat tersedia di enam game, dengan efek transparan di meja yang terlihat seluruh room. Lobby Mahjong punya Manual bebas, Manual terbantu, serta Fast. Manual bebas membiarkan pemain mencoba klaim tanpa pemeriksaan awal; server menilai saat klaim dikirim. Panduan dapat dilewati dan panel sidebar tetap dapat dilipat.

Fitur: lobby bersama, nama diminta saat create/join game, lalu disimpan untuk prefill enam game, kunci room, save/pemulihan sesi, penonton/antrean/rotasi, panel lipat dan aksi HP, suara/volume serta pengurangan animasi. Saat masih ada sesi tersimpan, popup memberi pilihan lanjut atau keluar dulu sebelum pindah room; koneksi yang terputus tetap bisa menyambung ulang. [Panduan sesi bersama](docs/SOCIAL-SESSIONS.md).

## Jalankan lokal

Node.js 22 atau lebih baru diperlukan. Dari root repository:

```sh
npm ci --omit=dev --ignore-scripts
npm start
```

Buka **http://localhost:3000**. Untuk port lain, gunakan `PORT=3010 npm start`. Jangan gunakan port game lain yang sedang dimainkan. Teman dapat membuka alamat jaringan komputer server jika bermain lokal; setelah deployment online, semua memakai domain yang sama.

## Panduan agent dan Cloudflare

Setelah clone/pull, agent mulai dari [AGENTS.md](AGENTS.md), [panduan maintenance/handoff](docs/MAINTENANCE.md), lalu [skill Meja Kita](.agents/skills/meja-kita-games/SKILL.md). Aturan layout, komponen, bot, score/rupiah, kredit dan struktur modul ada di [GAME-CONVENTIONS.md](docs/GAME-CONVENTIONS.md). Hosting dan update cloud ada di [CLOUDFLARE-WORKERS.md](docs/CLOUDFLARE-WORKERS.md). [CLOUDFLARE.md](docs/CLOUDFLARE.md) hanya untuk alternatif Node + Quick Tunnel yang memerlukan laptop.

Panduan memakai path relatif dan tidak menyimpan hostname/PID/token sesi pengguna. Siapa pun dapat membuat origin dan tunnel sendiri dari checkout-nya. GitHub push dan deployment live tetap dua tindakan terpisah.

## Hosting online (opsional)

Alur utama pemilik sekarang Workers + SQLite Durable Object, sudah dipasang dan tidak memerlukan laptop. Build lokal tidak menerbitkan perubahan; deployment baru tetap perlu izin spesifik. Node + Quick Tunnel adalah alternatif terpisah yang memerlukan laptop. Petunjuk Render berikut hanya referensi alternatif; jangan membuat/deploy service tanpa permintaan. Paket gratis dapat tetap meminta kartu untuk verifikasi akun.

### Deploy di Render

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
| Catur | `/catur/` | 2, atau 1 pemain + bot latihan |
| Domino Gaple | `/domino/` | 2–4, kursi kosong dapat diisi bot |
| Blackjack | `/blackjack/` | 1–7 pemain melawan dealer; bot opsional |

WebSocket masing-masing: `/capsa/ws`, `/mahjong/ws`, `/poker/ws`, `/catur/ws`, `/domino/ws`, `/blackjack/ws`. Link room selalu menyertakan path game. Kode room yang sama pada game berbeda tetap merupakan dua room terpisah. Tombol **Pilih game** kembali ke landing page; saat sudah masuk room, browser meminta konfirmasi.

## Fitur yang dipertahankan

- **Capsa:** pembuka berisi 3♦, bot Bego/Normal/Hard, timer 60 detik, nilai rupiah otomatis, mode ruangan tetap, Easy Mode dengan saran dan undo 2× per pemain per ronde, rekap, chat, dan log.
- **Mahjong:** server-authoritative 4 pemain, claim Hu/Pung/Kong/Chow, pilihan lobby Manual bebas / Manual terbantu (default) / Fast dan Highlight set lengkap di tangan sendiri (default ON, Chow/Pung/keduanya). Keduanya dikunci saat permainan mulai; bot, panduan, contekan, chat, penonton, dan pembatalan buangan tersedia.
- **Poker:** no-limit Hold’em, private cards, blinds, side pots, chips/IDR, buy-in dan rebuy host, panduan, rekap/CSV, practice bots, dan penyimpanan sesi lokal.

- **Catur:** room berdua, bot latihan dengan jeda 3 detik, langkah sah dari server, rokade/en passant/promosi, skakmat dan remis, penonton, chat, tawaran remis, menyerah, main lagi dengan tukar warna, serta unduhan PGN. [Aturan dan batasan catur](games/chess/README.md).

- **Domino Gaple:** 28 batu double-six, 7 batu per pemain, 2–4 kursi, stok untuk meja kurang dari 4, sambung kiri/kanan, meja buntu berdasarkan sisa titik, bot jeda 3 detik, chat, log, penonton, dan rekap kemenangan. [Aturan meja Gaple](games/domino/README.md).

## Meja yang konsisten

Saat berada di room: chat, cheat sheet, rekap poin/rupiah, dan log disusun di kanan dengan urutan yang sama. Pada layar kecil panel berada di bawah meja. Poker menambahkan indikator peluang di antara cheat sheet dan rekap. Panduan/rekap terperinci dan unduhan yang sudah ada tetap tersedia.

Semua game mempunyai pilihan bot **Easy, Normal, Hard**, dengan jeda minimal 3 detik untuk aksi bot. Pengaturan nilai rupiah dilakukan oleh host sebelum mulai, kemudian dikunci. `0` berarti latihan tanpa nilai rupiah. Tidak ada integrasi pembayaran: angka rupiah mengukur hasil poin/chip.

| Game | Creator | Cara menghitung poin/chip |
| --- | --- | --- |
| Mahjong | Hendy W | Room baru: HKMA core 3–10 fan dengan tabel pembayaran; room legacy mempertahankan 1 fan = 10 poin dan aturan pembayar lamanya. Lihat README Mahjong |
| Poker | Hendy W | Chip net = stack + chip dalam pot yang belum selesai − seluruh bought chips; setelah pot selesai nilai final berubah |
| Capsa | Faiz T | Kalah −jumlah kartu tersisa; pemenang menerima jumlahnya |
| Domino | Faiz T | Kalah −titik tersisa; pool diterima pemenang. Seri dibagi rata, sisa 1 poin menurut urutan kursi |
| Catur | Faiz T | Menang +1, kalah −1, remis 0; menyerah/keluar saat bermain dihitung kalah |
| Blackjack | Faiz T | Stack + chip yang masih dimainkan − bought chips; dealer menerima kebalikan net pemain |

Rupiah = poin/chip net × nilai yang dipilih. Meja dengan bot adalah simulasi, termasuk rekap Poker; tidak menghasilkan instruksi pembayaran ke bot. Kredit tampil pada card landing dan bar dalam setiap game.

### Indikator peluang Poker

Menunjukkan kategori **5 kartu terbaik saat river** dari dua kartu sendiri dan kartu meja yang sudah terlihat. Kategori high card sampai royal flush saling eksklusif; full house tidak juga dihitung sebagai pair/triple. Kartu tersembunyi lawan tidak digunakan.

- Preflop: estimasi 10.000 sampel kartu meja tanpa pengembalian. Galat sampling terburuk sekitar ±1 poin persen pada tingkat nominal 95%; hasil dapat sedikit berubah saat perhitungan baru.
- Flop: enumerasi seluruh 1.081 pasangan kartu meja yang belum terlihat; turn: seluruh 46 kartu; river: kategori yang sudah terbentuk, 100%.
- Pembulatan persentase dapat membuat total tampilan sedikit berbeda dari 100%. Worker browser menghindari pembekuan UI. Tidak mengestimasi peluang mengalahkan lawan atau memperkirakan pilihan mereka.
- Contoh di lobby diberi label sebagai contoh; dalam pertandingan memakai kartu pribadi pemain. Tidak ada tangan lawan yang dibuka untuk menghitungnya.

### Blackjack

Meja 1–7 pemain melawan dealer otomatis, enam deck baru diacak setiap ronde. Hit, Stand, Double, Split sekali; dealer stand pada 17 termasuk soft 17. Blackjack dua kartu membayar 3:2, menang biasa 1:1, push mengembalikan chip. Split A mendapat satu kartu tambahan; 21 setelah split dibayar biasa. Tanpa insurance/surrender. Chip buy-in dan taruhan harus genap supaya payout 3:2 tetap bulat. [Aturan dan pencatatan Blackjack](games/blackjack/README.md).

## Penyimpanan dan restart

Pada hosting Workers, enam game memakai snapshot privat SQLite Durable Object. Pertahankan actor/binding/migrasi; jangan upload save Node atau mengganti store. Recovery unfinished dijeda hingga pemain kembali dan host melanjutkan. Detail [cloud](docs/CLOUDFLARE-WORKERS.md).

Pada target Node, seluruh enam game disimpan di direktori privat `DATA_DIR/rooms/` (default `var/rooms/`). Sesi belum selesai dipulihkan dalam keadaan jeda: pemain kembali ke kursinya, lalu host menekan **Lanjutkan sesi**. Unduh file pemulihan kursimu bila ingin kembali dari link Cloudflare baru. Simpan file itu sendiri; teman cukup diberi link undangan.

Upgrade pertama dari build UI-polish tetap mengakhiri lima game yang sebelumnya hanya di RAM. Save Poker lama diimpor tanpa dihapus. Pertahankan seluruh `DATA_DIR`, termasuk `poker/` dan `rooms/`, pada update. Detail migrasi, batas retensi tujuh hari, rotasi akun dan batas pemeriksaan ada di [SOCIAL-SESSIONS.md](docs/SOCIAL-SESSIONS.md).

## Struktur

```text
server.js           # HTTP router dan dispatcher WebSocket satu port
public/             # Landing page dan navigasi antar-game
games/capsa/        # Source Capsa yang diintegrasikan
games/mahjong/      # Source Mahjong yang diintegrasikan
games/poker/        # Source Poker yang diintegrasikan
games/chess/        # Catur multiplayer dan bot latihan
games/domino/       # Domino Gaple multiplayer dan bot latihan
games/blackjack/    # Blackjack bersama melawan dealer
games/shared/       # Validasi nilai poin dan ledger
public/game-tools.js # Sidebar chat, cheat sheet, rekap/CSV, log
render.yaml         # Konfigurasi Render Free
```

Tidak menyertakan sesi pemain, token, data kantor, credential, atau node_modules. GitHub memakai repository `srac-gaming` di akun personal `izanagiwarrior`.

## Pemeriksaan

Build UI-polish sebelumnya (`2026-10-15-ui-polish-1`) mencakup pemeriksaan UI enam game pada lebar 320, 390, 768, 1024 dan 1440 CSS pixel serta interaksi practice dengan nilai rupiah 0. Sebelas tes regresi komponen/sesi tersedia: `npm run test:ui`. Jalankan tes hanya ketika pengguna meminta verifikasi, sesuai AGENTS.md. Cakupan, perbaikan dan batas pemeriksaan ada di [UI-QUALITY.md](docs/UI-QUALITY.md). Tidak ada klaim bahwa seluruh cabang permainan sudah bebas bug.

Patch social-save ditinjau lewat source, sintaks dan pratinjau authoring terpisah; pertandingan/pemulihan crash dan pengujian otomatis fitur baru belum dijalankan. Tes hanya dijalankan bila diminta pengguna.

## Emote meja (1.5.1)

Semua game memakai palette 12 emote yang sama di chat. Emote yang diterima server muncul di meja seluruh room (pemain dan penonton): emoji besar transparan, 12 partikel dan dua lingkaran lembut, lalu hilang sekitar 3 detik. Efek tidak menangkap klik, tidak menggeser layout, dan dibatasi maksimal tiga semburan sekaligus; pengiriman lewat tombol berjeda 900ms. Mode **Kurangi animasi** memakai satu emoji statis singkat. Riwayat, reload/reconnect, perpindahan room dan Capsa undo tidak memutar ulang emote lama.

## Chat melayang (1.5.2)

Pesan chat pemain dan penonton yang baru diterima juga melayang tipis di pinggir meja seluruh enam game, dengan nama pengirim. Pesan lengkap tetap tersimpan di Chat meja. Maksimal tiga pesan tampil sekitar lima detik; teks panjang dibatasi tiga baris pada tampilan melayang. Efek tidak menangkap klik kartu/papan. Kurangi animasi menampilkan satu pesan statis selama empat detik. Riwayat lama, pesan sistem, reconnect dan Capsa undo tidak memutar ulang pesan melayang. Emote tetap memakai semburan transparannya sendiri.

## Menu emoji (1.5.3)

Tombol senyum **Menu emoji** ada di antara input chat dan tombol Kirim di enam game. Dua belas emoji disembunyikan sampai menu dibuka. Memilih emoji langsung mengirim lewat chat native lalu menutup menu; draft teks tetap ada dan fokus kembali ke input. Klik di luar, Escape, tombol tutup, keluar room atau putus koneksi juga menutup menu. Menu menyesuaikan posisi layar dan tetap terbuka saat tampilan meja diperbarui selama koneksi aktif. Efek emote dan chat melayang tetap tersedia.

## Tema tampilan bersama (1.6.0)

Tombol **Dark / Light** ada di bar Meja & preferensi, tanpa perlu membuka panel. Default Dark berlaku pada semua perangkat, termasuk yang memakai tema sistem Light. Pilihan tersimpan per browser dan origin, dipakai landing serta enam game, dan mengikuti perubahan pada tab lain. Tema dimuat sebelum tampilan pertama agar tidak berkedip terang. Pengaturan ini hanya mengubah tampilan perangkatmu, bukan room atau pemain lain. Menu emoji, input, sidebar, panduan dan dialog memakai warna yang kontras di kedua tema; kartu/ubin/bidak dan meja hijau tetap memiliki warna yang terbaca. Pengaturan Poker lama digantikan pilihan bersama ini.

## Quick Play

Pilih durasi di lobby sebelum mulai. Capsa, Mahjong, Domino dan Blackjack dapat selesai dalam 1 ronde; Poker dalam 1 tangan. Catur memiliki Santai tanpa jam, Blitz 5+0 dan Blitz 3+2. Quick Play tidak mengaktifkan auto-lewat Mahjong atau mempersingkat jeda bot. Tema Dark/Light bersama tetap tersedia, dengan Dark sebagai default.

## Bubarkan ruang (host)

Buka **Meja & preferensi → Bubarkan ruang**. Dialog menyebut kode dan akibatnya; host harus mengonfirmasi. Pemain/penonton kembali ke halaman masuk, room hilang dari daftar, undangan lama dan file pemulihan tidak berlaku. Sesi offline dibersihkan saat mencoba menyambung lagi. Kode yang dibubarkan tidak dialokasikan ulang selama DATA_DIR dipertahankan. Ronde aktif dibatalkan tanpa membuat hasil/payout baru; unduh rekap yang diperlukan terlebih dahulu.

## Mahjong Hong Kong (termasuk cloud 2.0.0)

Mahjong new rooms offer HKMA core scoring (3–10 fan and payment ladder), flowers/seasons, optional locally defined jokers and flower fan bonuses, and a skippable four-wall/dice/deal ceremony. See [actual rules and limitations](games/mahjong/README.md). Existing saved rooms keep legacy rules. This source update does not authorize pushing or changing a running host.

## Cloudflare hosting (2.0.0)

The Workers + SQLite Durable Object adapter for all six games was deployed on 23 October 2026; it runs without a laptop. Build with `npm run build:cloudflare`; this does not deploy. See [setup, limits and safe deployment](docs/CLOUDFLARE-WORKERS.md). It includes Hong Kong Mahjong and game-entry nickname changes. The existing Node command and private saves remain separate. No Git push or public deployment is implied by a build.
