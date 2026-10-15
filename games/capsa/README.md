> Game terintegrasi di Meja Kita. Jalankan aplikasi dari root repository dengan `npm start`; lihat README utama. Instruksi standalone di bawah adalah dokumentasi source asal.

# Capsa Banting / Big Two — Capsa Club

Game yang dimainkan bergiliran: keluarkan kartu atau kombinasi, lawan dengan yang lebih tinggi, atau lewat. Urutan kartu **3 < 4 < 5 < … < K < A < 2**. Yang habis kartu pertama menang. Ini versi Banting, bukan versi menyusun tiga baris.

## Jalankan lokal

Node.js 18+ diperlukan. Ekstrak seluruh ZIP terlebih dahulu. Paket portable sudah menyertakan dependency `ws`, sehingga tidak perlu `npm install`.

- **Windows:** buka `start.bat`.
- **Mac:** buka `start.command`; alternatif terminal: `sh start.command`.
- **Linux:** jalankan `sh start.sh` dari folder proyek.
- **Semua sistem:** jalankan `node start-local.js` dari folder proyek.

Launcher membuka browser ke **http://localhost:3002**. Biarkan terminal tetap terbuka selama bermain. Petunjuk untuk teman ada di **START-HERE.txt**.

Jika memakai source tanpa folder `node_modules`, jalankan:

```sh
npm install --ignore-scripts
npm start
```

Buka **http://localhost:3002**. Server mencetak alamat Wi-Fi untuk HP / laptop lain. Teman perlu jaringan yang sama. Buat ruang, bagikan link / kode 4 huruf, lalu mulai. Kursi kosong diisi bot; peserta yang masuk setelah mulai menjadi penonton.

Port bisa diganti dengan `PORT=3003 npm start`. Gunakan `HOST=127.0.0.1 npm start` jika hanya dimainkan di komputer server. Tekan Ctrl+C untuk berhenti. Ruangan dan skor disimpan di memori; restart menghapusnya. Refresh browser menyambung kembali ke sesi yang sama.

## Aturan yang diterapkan

- **Official:** 4 pemain, masing-masing 13 kartu. Kursi kurang dari 4 diisi bot.
- **Non-official:** 3–8 pemain. Semua 52 kartu dibagi; selisih jatah maksimal 1 kartu. Contoh 3 pemain: 18/17/17, 5 pemain: 11/11/10/10/10, 8 pemain: 7/7/7/7/6/6/6/6. Jatah ekstra bergilir tiap ronde. Jika baru 1–2 orang, bot melengkapi sampai 3; mulai dari 3 orang tidak ada tambahan bot. Giliran mengikuti urutan kursi secara siklik.
- Simbol: **♦ < ♣ < ♥ < ♠**. Setiap ronde dibuka oleh pemegang **3♦**, dan bantingan pertama wajib **menyertakan 3♦**. Boleh single, pair, triple, atau kombinasi lima kartu yang sah selama ada 3♦. Setelah meja dibersihkan karena semua lawan lewat, pembuka bebas tetap diperbolehkan.
- Kombinasi sah: single, pair, triple, dan lima kartu: straight < flush < full house < four of a kind + satu kartu < straight flush.
- Lawan dengan jumlah kartu yang sama dan kekuatan lebih tinggi. Four of a kind empat kartu saja tidak sah; tidak ada bomb lintas jumlah kartu.
- Semua lawan lewat membuat meja kosong dan pemain terakhir membuka bebas. Jumlahnya N−1: 2 untuk 3 pemain, 3 untuk 4 pemain, sampai 7 untuk 8 pemain.
- Default: sekali lewat, tunggu meja baru. Host dapat mematikan penguncian lewat agar pemain boleh ikut lagi saat giliran berikutnya.
- Default straight **Indonesia / aturan meja**: JQKA2, A2345, dan 23456 sah, lebih tinggi daripada straight biasa, dan dibandingkan dari simbol kartu 2. JQKA2 sudah diperbaiki sesuai urutan 3 sampai 2 yang diminta.
- Pilihan straight **Urut 3 → 2**: 34567 paling kecil, JQKA2 paling besar; tidak ada putaran / wraparound, sehingga A2345 dan 23456 tidak sah. Aturan pilihan berlaku juga pada straight flush.
- Straight biasa dibandingkan dari kartu puncak lalu simbol. Flush dari kartu tertinggi lalu simbol. Full house dari triple. Four of a kind dari angka empat kartunya.
- Ronde langsung selesai saat satu pemain habis. Tiap kartu tersisa = −1 poin; pemenang mendapat jumlah poin yang hilang dari tiga lawan. Skor seluruh meja berjumlah nol.

Referensi kombinasi dasar dan alur: [Board Game Arena](https://en.boardgamearena.com/gamepanel?game=bigtwo). Variasi searah jarum jam, straight berkartu 2, dan lewat di Indonesia: [Pagat Big Two](https://www.pagat.com/climbing/bigtwo.html). Reset meja dan scoring menggunakan pilihan aturan meja yang dijelaskan di atas.

## Kontrol & koneksi

Tingkat bot bisa dipilih **Bego, Normal, atau Hard**, dengan **Normal** sebagai default. Bego lebih sering lewat dan memilih langkah acak, Normal sesekali melewatkan peluang atau salah prioritas, dan Hard mempertahankan strategi lama termasuk menghalangi lawan yang tinggal satu kartu. Semua bot tetap mengikuti aturan kartu dan **menunggu 3 detik sebelum bertindak**, di semua tingkat. Host mengubah tingkat di ruang tunggu atau panel kanan saat bermain; berlaku pada giliran bot berikutnya.

Setiap giliran dibatasi **1 menit (60 detik)**, dengan hitungan mundur di bawah meja. Server otomatis melewatkan pemain jika waktu habis saat ada kartu di meja. Saat membuka meja kosong, server memainkan **satu kartu terkecil yang sah**; pembukaan pertama tetap 3♦. Chat, refresh, reconnect, dan perubahan tingkat bot tidak mengulang waktu giliran. Langkah otomatis ditandai di riwayat.

Klik kartu untuk memilih beberapa sekaligus, lalu **Mainkan**. Panel kanan menampilkan **contekan urutan** kartu, simbol, dan kombinasi lima kartu dari tertinggi ke terendah, termasuk aturan straight yang sedang aktif. Setiap kombinasi dilengkapi contoh lima kartu dan tombol **✧** untuk melihat animasinya. Contoh ini statis dan tidak memilihkan kartu pemain. **Lewat** hanya bisa pada giliranmu ketika ada kartu di meja. Urut angka / simbol dan Batal pilih tersedia. Enter memainkan kartu terpilih, Escape membatalkan pilihan.

Bantingan **straight ke atas** memicu animasi: kilatan straight, gelombang flush, ledakan full house, hentakan four of a kind, lalu mahkota emas dan partikel warna pada straight flush. Efek semakin besar sesuai tingkat kombinasi, berlangsung kurang dari 3 detik, dan tidak menghalangi klik kartu. Chat dan reconnect tidak memutar ulang efek lama. Pengaturan sistem untuk mengurangi gerakan dihormati.

## Rupiah & rekap

Host memilih **nilai 1 poin dalam IDR** sebelum pertandingan, antara 0 dan 1.000.000 rupiah bulat. Nilai ini terkunci saat mulai. Nilai default 0 untuk latihan. Nilai pilihan host tetap dipakai meskipun pertandingan dimulai dengan bot. Meja dengan bot menampilkan simulasi saldo rupiah, tanpa saran pembayaran ke atau dari bot. Pemain manusia yang terputus sementara tetap mempertahankan akun dan saldo, walau bot mengambil alih kartunya.

- Setiap kartu tersisa = −1 poin. Tidak ada pengali penalti.
- Rupiah kalah = sisa kartu × nilai 1 poin; pemenang menerima total dari semua lawan.
- Contoh 1 poin = Rp1.000, lawan tersisa 3/5/8 kartu: masing-masing −Rp3.000/−Rp5.000/−Rp8.000, pemenang +Rp16.000.
- Semua poin dan saldo rupiah meja berjumlah nol. Tidak memakai buy-in, pot, atau blinds.
- **Rekap Rp** menampilkan saldo dari ronde selesai, rincian kartu awal/sisa, poin dan rupiah setiap ronde. Ronde berjalan belum masuk saldo.
- Saldo awal Rp0 dan baru berubah setelah ronde selesai; ini berbeda dari nilai 1 poin yang dipilih host.
- Pada akhir pertandingan tanpa bot, rekap memberi saran transfer dari saldo negatif ke positif. Gunakan jika saldo belum diselesaikan antarpemain. Aplikasi mencatat saldo; pembayaran dilakukan di luar game.
- **Unduh CSV** menyimpan saldo, hasil setiap ronde, dan saran pembayaran akhir. Unduh sebelum memulai pertandingan baru atau menghentikan server karena room masih disimpan di memori.

Kartu lawan privat sampai akhir ronde. Jumlah kartu, bantingan, dan giliran adalah informasi publik. Pemain offline diteruskan bot setelah 8 detik; kembali dari browser yang sama untuk mengambil alih. Bot hanya memakai tangan sendiri dan informasi publik.

## Pemeriksaan

```sh
npm test
```

Tes mencakup ranking 3 sampai 2, simbol, kombinasi dan straight, validasi kepemilikan, pembukaan 3♦, giliran dan lewat, reset meja, kemenangan, bot, konservasi 52 kartu, skor, privasi multiplayer, sesi, penonton, dan pertandingan baru.

## Halaman lama dan susunan panel

Bantingan pertama boleh single, pair, triple, atau kombinasi lima kartu yang sah selama menyertakan 3♦. Contoh 3♦–4♦–5♦–6♥–7♣ sah sebagai straight pembuka.

Jika sebuah tab masih mengatakan "wajib single 3♦", tab itu masih memegang JavaScript versi lama. Refresh halaman di browser yang sama untuk memuat aturan yang sekarang disajikan server. Selama server hidup dan room masih ada, token kursi digunakan untuk bergabung kembali ke room yang sama. Jangan menghapus data browser. Refresh tidak memperpanjang waktu giliran.

Panel kanan kini menampilkan obrolan terlebih dahulu, lalu log langkah, kemudian rekap rupiah, pengaturan bot, contekan, dan riwayat ronde. Urutan ini juga berlaku pada layar kecil.

Asset frontend memakai penanda versi. Jika versi baru tersedia, muncul pemberitahuan dengan tombol Segarkan halaman. Tidak ada refresh otomatis. Pemeriksaan versi hanya membaca HTML dan tidak mengubah room atau giliran. Untuk update berikutnya, samakan `capsa-build` dan query asset di `public/index.html` dengan `CLIENT_VERSION` di `public/client.js`.


## Mode room, autosave rupiah, dan Easy Mode

Mode **Official** atau **Non-official** kini dipilih saat membuat ruangan. Pilihan ini tetap: tidak dapat diganti ketika orang lain masuk atau pertandingan dimulai. Buat room baru untuk mode lain. Official tetap 4 pemain, Non-official 3–8; jika manusia kurang dari 3, bot melengkapi minimum.

Nominal rupiah di ruang tunggu **tersimpan otomatis saat diketik**, tanpa tombol Simpan. Mulai memakai angka terakhir yang diisi meskipun autosave masih dikirim. Input kosong/invalid harus diperbaiki sebelum mulai. Rate tetap dikunci saat pertandingan berjalan; saldo berubah hanya setelah ronde selesai.

Host dapat menyalakan **Easy Mode**, terpisah dari tingkat bot. Popup memberi tahu bahwa ini bantuan curang untuk semua pemain. Pada giliranmu, **Saran langkah** memilih kombinasi legal dari tanganmu; tekan Mainkan sendiri. Saat Easy Mode mati, saran dan undo tidak tersedia.

**Undo: 2 kali per pemain per ronde.** Setelah kamu bertindak (kartu atau lewat), undo kembali ke awal giliran terakhir yang sudah kamu pakai. Seluruh keadaan permainan ikut kembali: tangan semua pemain, kartu meja, giliran, log, chat, hasil ronde, riwayat, skor, dan saldo. Semua langkah setelah titik itu dibatalkan, dan timer kembali 60 detik. Kursi, koneksi, host, pengaturan terbaru, serta jatah undo yang telah dipakai tidak diputar balik. Undo masih tersedia setelah hasil ronde muncul, sampai host memulai ronde/pertandingan baru. Jatah baru hanya diberikan pada ronde baru; reconnect atau toggle Easy Mode tidak mengisi ulang jatah.

Build ini: `2026-10-13-easy-room-1`. Untuk update berikutnya, samakan `BUILD_VERSION` di server dengan meta/version asset dan `CLIENT_VERSION`. Perubahan backend ini perlu restart; lihat `PATCH-NOTES.md` dan minta konfirmasi sebelum menyentuh server aktif. Pemeriksaan untuk fitur baru terbatas pada sintaks, tinjauan kode, dan tampilan pratinjau; tes multiplayer/rollback end-to-end belum dijalankan.

## Hub patch 2026-10-14-six-games-1

Creator **Faiz T** tampil pada card hub dan bar dalam permainan. Panel kanan disusun chat → cheat sheet → rekap poin/rupiah → log, lalu catatan ronde dan pengaturan bot. Label bot Easy (sebelumnya Bego), Normal, Hard; kebijakan dan jeda 3 detik tidak berubah. Poin/rupiah dan seluruh aturan Capsa mengikuti build aturan sebelumnya, termasuk pembuka berisi 3♦, mode room, Easy Mode/undo, timer 60 detik, rekap, dan CSV.

## Sesi bersama pada hub

Hub build `2026-10-15-social-save-2` menambahkan save privat/pemulihan dijeda, nama bersama, kunci room, antrean penonton dan rotasi antar ronde, saldo akun yang tetap tercatat, panel lipat, serta suara/volume/pengurangan animasi. Lihat [panduan sesi](../../docs/SOCIAL-SESSIONS.md), termasuk migrasi pertama dari game RAM dan batas pemeriksaan. Keterangan RAM/restart pada riwayat build lama tidak berlaku sebagai jaminan perilaku build ini.
