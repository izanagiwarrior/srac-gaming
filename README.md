# Meja Kita

Satu landing page untuk **Capsa Banting, Mahjong, Poker Texas Hold’em, Catur, Domino Gaple, dan Blackjack**. Keenam game berjalan dalam satu proses Node.js dan satu port HTTP/WebSocket.

Repository: [izanagiwarrior/srac-gaming](https://github.com/izanagiwarrior/srac-gaming).

Build: `2026-10-15-ui-polish-1`.

## Jalankan lokal

Node.js 22 atau lebih baru diperlukan. Dari root repository:

```sh
npm ci --omit=dev --ignore-scripts
npm start
```

Buka **http://localhost:3000**. Untuk port lain, gunakan `PORT=3010 npm start`. Jangan gunakan port game lain yang sedang dimainkan. Teman dapat membuka alamat jaringan komputer server jika bermain lokal; setelah deployment online, semua memakai domain yang sama.

## Panduan agent dan Cloudflare

Setelah clone/pull, agent mulai dari [AGENTS.md](AGENTS.md), lalu [skill Meja Kita](.agents/skills/meja-kita-games/SKILL.md). Aturan layout, komponen, bot, score/rupiah, kredit dan struktur modul ada di [GAME-CONVENTIONS.md](docs/GAME-CONVENTIONS.md). Cara menjalankan origin dan membagikannya melalui Quick Tunnel, termasuk update tanpa memutus pemain tanpa izin, ada di [CLOUDFLARE.md](docs/CLOUDFLARE.md).

Panduan memakai path relatif dan tidak menyimpan hostname/PID/token sesi pengguna. Siapa pun dapat membuat origin dan tunnel sendiri dari checkout-nya. GitHub push dan deployment live tetap dua tindakan terpisah.

## Hosting online (opsional)

Untuk bermain di kantor, cukup jalankan secara lokal. Pengguna membatalkan rencana deployment online. Petunjuk Render berikut disimpan sebagai referensi; paket gratis dapat tetap meminta kartu untuk verifikasi akun.

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
- **Mahjong:** server-authoritative 4 pemain, claim Hu/Pung/Kong/Chow, toggle lobby Fast mode (default OFF) dan Highlight set lengkap di tangan sendiri (default ON, Chow/Pung/keduanya). Keduanya dikunci saat permainan mulai; bot, panduan, contekan, chat, penonton, dan pembatalan buangan tersedia.
- **Poker:** no-limit Hold’em, private cards, blinds, side pots, chips/IDR, buy-in dan rebuy host, panduan, rekap/CSV, practice bots, dan penyimpanan sesi lokal.

- **Catur:** room berdua, bot latihan dengan jeda 3 detik, langkah sah dari server, rokade/en passant/promosi, skakmat dan remis, penonton, chat, tawaran remis, menyerah, main lagi dengan tukar warna, serta unduhan PGN. [Aturan dan batasan catur](games/chess/README.md).

- **Domino Gaple:** 28 batu double-six, 7 batu per pemain, 2–4 kursi, stok untuk meja kurang dari 4, sambung kiri/kanan, meja buntu berdasarkan sisa titik, bot jeda 3 detik, chat, log, penonton, dan rekap kemenangan. [Aturan meja Gaple](games/domino/README.md).

## Meja yang konsisten

Saat berada di room: chat, cheat sheet, rekap poin/rupiah, dan log disusun di kanan dengan urutan yang sama. Pada layar kecil panel berada di bawah meja. Poker menambahkan indikator peluang di antara cheat sheet dan rekap. Panduan/rekap terperinci dan unduhan yang sudah ada tetap tersedia.

Semua game mempunyai pilihan bot **Easy, Normal, Hard**, dengan jeda minimal 3 detik untuk aksi bot. Pengaturan nilai rupiah dilakukan oleh host sebelum mulai, kemudian dikunci. `0` berarti latihan tanpa nilai rupiah. Tidak ada integrasi pembayaran: angka rupiah mengukur hasil poin/chip.

| Game | Creator | Cara menghitung poin/chip |
| --- | --- | --- |
| Mahjong | Hendy W | Skor fan yang sudah ada: 1 fan = 10 poin per pembayar; zimo dibayar tiga lawan, buangan dibayar 3× oleh pembuang |
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

Capsa, Mahjong, Catur, Domino, dan Blackjack menyimpan room di RAM. Poker menyimpan sesi pada `var/poker/sessions.json` atau direktori privat `DATA_DIR` jika diatur. Folder runtime tidak disajikan melalui HTTP dan tidak di-commit.

**Pada Render Free, filesystem bersifat sementara.** Restart, deploy, atau tidur dapat menghapus sesi RAM dan file Poker. Repo ini tidak mengklaim penyimpanan permanen di Render Free. Bila sesi harus bertahan, tambahkan penyimpanan eksternal sebelum mengandalkannya. Unduh rekap yang diperlukan sebelum restart.

Render Free memiliki batas penggunaan dan tidur setelah tidak ada trafik. Jangan melakukan deployment saat orang sedang bermain; auto-deploy sengaja dinonaktifkan. Pembayaran tidak diproses aplikasi.

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

Build `2026-10-15-ui-polish-1` mencakup pemeriksaan UI enam game pada lebar 320, 390, 768, 1024 dan 1440 CSS pixel serta interaksi practice dengan nilai rupiah 0. Sebelas tes regresi komponen/sesi tersedia: `npm run test:ui`. Jalankan tes hanya ketika pengguna meminta verifikasi, sesuai AGENTS.md. Cakupan, perbaikan dan batas pemeriksaan ada di [UI-QUALITY.md](docs/UI-QUALITY.md). Tidak ada klaim bahwa seluruh cabang permainan sudah bebas bug.
