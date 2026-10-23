# Current Mahjong setup — 2.2.0 / protocol v12

| Preset | Hu requirement | Completed-set highlight | Bots |
| --- | --- | --- | --- |
| Easy (default, new rooms) | Hong Kong casual, 0 fan allowed | ON | Easy |
| Normal | Hong Kong casual, 0 fan allowed | OFF | Normal |
| Hard | Hong Kong HKMA, minimum3fan | OFF | Hard |
| Customize | Host selects existing rule/bot/help options | Host chooses | Host chooses |

All named presets use assisted manual claims (no auto-pass), eight flowers with replacements, no extra flower fan, no joker, animated/skippable opening, no turn/claim deadline. Duration (including1round) and Rp remain independent. Presets are server-enforced and host-only in lobby; all settings lock at Start. Customize initially retains the current choices and exposes the existing controls, including Manual bebas/Fast, legacy profile, flower bonus, joker and opening. Easy/Normal are house variants, not official tournament rules. Hard is implemented HKMA core, not a certification of all physical tournament rules.

**Chinese Official/MCR is a different ruleset.** The user's reference https://playmahjong.io/chinese-official-rules requires8points and has different scoring/payment rules. This game continues to use Hong Kong as explicitly requested in the preset definitions; it does not implement MCR.

Casual accepts valid4sets+pair (or Thirteen Orphans) without a minimum fan. It still scores the actual hand: **0fan=0points**,1/2fan=8/16discardpoints (house extension),3–10useHKMA; Zimo each opponent pays half the table. No automatic basic-win fan is invented. Rp=netpoints×rate. Optional bonus flowers/jokers remain labeled variations. Seven Pairs remains legacy-only.

Saved rooms without tablePreset restore as Customize, preserving their settings. Missing casualZero restores false (the preceding2.1.0 casual0fan=4house payout); new rooms/presets use true. Existing strict/legacy rooms and all settled history/money remain unchanged. In Customize the host can explicitly change that policy before Start. Reconnect requires v12 clients/page refresh.

A fresh observed Hu plays a2.7second celebration before the results panel, with a Lihat hasil skip button; reduced motion is a brief static card. Initial recovery/history does not replay it. Leave/disconnect/new round cancels it; hidden tab/preference changes finish it. At most48particles; names are textContent, no server-only information is exposed. Settlement completes once on the server independently of this effect.

Verification for this release: syntax/source review, cloud build and isolated lobby/visual authoring; no new automated/gameplay tests requested. The106-test scoring report describes2.0.1, not the new presets/0fan policy or cloud multiplayer races. Following sections retain detailed rules/history; where historical defaults differ, this section is current.

---

# Hong Kong Mahjong — protokol v11 (hub 2.1.0)

## Aturan yang digunakan

Room baru memakai profil Hong Kong dengan **Santai sebagai aturan menang default**: empat set + satu pasang atau Thirteen Orphans sah tanpa minimum fan. Host dapat memilih **Hong Kong HKMA (minimal 3 fan)** di lobby. Keduanya mempertahankan bunga, joker opsional dan animasi; pilihan dikunci setelah mulai. Mode HKMA memakai acuan asosiasi untuk bentuk Hu, fan, dan pembayaran. Sumber primer: [halaman aturan HKMA](https://www.hkmahjong.org/rules?lang=en) dan [Hong Kong Mahjong (English)](https://docs.google.com/document/d/1a66AhGRZE6IJmA_nd-C7gIQfSJ7sXo_2-c4XgVnMpTQ/edit). Implementasi ini bukan salinan buku aturan atau sertifikasi turnamen: fitur bantuan, undo, manual/fast, bot dan durasi terbatas adalah fasilitas meja santai. Penalti wasit fisik/turnamen tidak disimulasikan.

- Hu memerlukan empat set dan satu pasang atau Thirteen Orphans, **minimal 3 fan pada opsi HKMA**, **batas skor 10 fan**. Tidak ada fan menang dasar otomatis. Tujuh Pasang hanya pada profil legacy.
- Mesin menilai seluruh pemisahan set yang sah dan memilih fan tertinggi. Closed Hand hanya bila tidak ada meld, termasuk tidak ada Kong tertutup. Angin kursi dan angin ronde dapat dihitung terpisah pada set yang sama.
- Fan: semua Chow 1; tertutup 1; Zimo 1; tiap Pung naga/angin relevan 1; terminal+huruf 1; rebut Kong 1; pengganti Kong 1; ubin terakhir 1. Semua Pung dan campur satu warna 3; naga kecil 3 ditambah dua Pung naga; naga besar 5 ditambah tiga Pung naga; satu warna penuh 7. Pola limit diberi 10 dan total dibatasi 10.
- Limit: semua huruf, angin kecil/besar, empat Pung tertutup tanpa Kong (Hu buangan harus melengkapi pasangan), empat Kong, semua terminal, Heaven/Earth, Thirteen Orphans, Hu dari Kong beruntun, Nine Gates. Nine Gates dari buangan mensyaratkan bentuk tunggu sembilan sisi sebelum ubin menang. Joker tidak membentuk pola limit.
- Tabel poin buangan untuk fan 3–10: **32, 64, 96, 128, 192, 256, 384, 512**. Pembuang membayar nilai itu penuh; Zimo dibayar **setengah** nilai itu oleh masing-masing tiga lawan. Jumlah delta nol. Rate rupiah hanya pengukuran net poin, bukan transaksi uang.
- Pao: pemberi klaim set keempat atau naga ketiga memikul seluruh pembayaran jika penerima kemudian Zimo. Tanggung jawab baru menggantikan yang lama. Hu buangan tetap ditanggung pembuang ubin menang; Kong tertutup keempat tidak menciptakan Pao baru.
- Added Kong dapat direbut untuk Hu; concealed Kong hanya dapat direbut oleh Thirteen Orphans. Jendela klaim memakai ID yang sama dengan alur klaim biasa. Pada Manual bebas server tidak mengirim pilihan Hu sebelum dicoba; semua klaim harus memenuhi bentuk dan minimum fan.

## Bunga, musim, dan joker

Bunga ON secara default: 4 bunga + 4 musim ditambahkan ke 136 ubin standar. Bunga selalu ditampilkan terbuka di depan pemilik dan diganti dari ujung tembok; tidak masuk set atau hitungan 13/14 ubin. Saat pembagian awal, penggantian dilakukan bergiliran mulai dealer dan diulang untuk bunga pengganti; saat draw/Kong, penggantian berantai dilakukan otomatis. Set bunga turut tampil pada hasil ronde.

Tabel fan HKMA yang dirujuk tidak memuat bonus fan bunga. Karena itu **bonus bunga OFF default**; mekanik penggantian tetap berlaku. Toggle **variasi meja HKOS** menambahkan: tanpa bunga 1 fan; bunga/musim sesuai kursi 1 fan per kelompok; kelompok empat lengkap 2 fan menggantikan bonus kursi kelompok itu. Tidak ada kemenangan otomatis tujuh/delapan bunga. Semua variasi diberi label di lobby/meja.

**Joker OFF default.** Saat ON, ditambah empat ubin liar, total148 bersama bunga. Joker hanya menggantikan ubin pada pasangan/Chow/Pung di bagian tangan tertutup; tidak digunakan untuk klaim/Kong terbuka, tidak membuat pola limit, dan joker yang dibuang tidak dapat diklaim. Perhitungan memilih representasi sah dengan fan tertinggi. Ini variasi meja, bukan aturan HKMA. Bantuan shanten standar dinonaktifkan ketika joker ON agar tidak menyatakan estimasi palsu; server tetap menilai Hu.

## Tembok, dadu, pembagian

- Empat sisi tembok, dua tingkat; default144 ubin =18 tumpuk per sisi. Dengan empat joker, total148 dan dua sisi berisi19 tumpuk, dua sisi18. Tiga dadu berasal dari server dan benar-benar menentukan sisi serta titik potong tembok.
- Urutan pemain Timur→Selatan→Barat→Utara; pengambilan fisik tembok bergerak berlawanan. Ambil empat ubin bergiliran tiga kali, lalu ubin ke-13 masing-masing dan ubin lompat dealer; dealer memulai dengan14, lainnya13, setelah penggantian bunga.
- Animasi default ON, dapat dimatikan host di lobby. **Skip & mulai** hanya untuk host, membawa ID pembukaan terbaru dan melewati animasi seluruh room. Semua ubin dibagikan sekali oleh server; tidak ada re-shuffle/deal ulang saat Skip/reconnect. Aksi bermain diblokir selama pembukaan; bot menunggu minimal3 detik setelah pembukaan selesai.
- Server menyimpan fase pembukaan. Recovery dijeda melalui kontrol bersama; melanjutkan meneruskan tahap yang tersimpan. Timer opening dibersihkan saat close/dissolve. Klien tidak menerima identitas ubin tembok/tangan lawan; hanya posisi tembok terisi, jumlah pembagian dan dadu publik. Tangan sendiri baru dikirim setelah pembukaan selesai.
- Kurangi animasi/OS reduced motion menghentikan gerak visual, tetapi tahapan tetap sinkron server; host tetap dapat Skip. Warna muka ubin tetap terbaca dalam Dark/Light.
- Kursi tetap pada Hong Kong; dealer menang tetap Timur, selain itu dealer berpindah ke Selatan. Angin ronde bergeser setelah empat perpindahan dealer. Quick Play tetap menghitung jumlah tangan/ronde yang dipilih, termasuk seri dan dealer ulang; bukan sesi turnamen satu putaran penuh.

## Kompatibilitas dan batas pemeriksaan

Save lama tanpa `ruleset` dipulihkan sebagai `legacy`, mempertahankan fan/pembayaran dan kursi acak sebelumnya. Tidak mengonversi ronde/saldo lama ke HKMA. Pilihan profil, bunga, bonus bunga, joker, animasi dan bantuan dikunci setelah mulai. Protokol v11 meminta refresh browser setelah deployment yang diizinkan.

Aturan HK ini sudah terpasang di cloud; kontrol Mahjong mendapat perbaikan CSP pada hub 2.0.1. Validasi atas permintaan pengguna menghasilkan 106 tes lokal lulus (95 skor/server HK), tanpa perubahan runtime/scoring. Lihat [laporan validasi](../../docs/MAHJONG-SCORING-VALIDATION.md) untuk sumber, fixture dan batas; belum memvalidasi pertandingan cloud/recovery/race secara penuh. Pengujian berikutnya tetap memerlukan permintaan pengguna. Riwayat fitur sebelum 1.9.0 di bawah berlaku pada profil legacy, kecuali sudah digantikan bagian ini.

---

> Game terintegrasi di Meja Kita. Jalankan aplikasi dari root repository dengan `npm start`; lihat README utama. Instruksi standalone di bawah adalah dokumentasi source asal.

# Mahjong P2P (main bareng di WiFi yang sama)

Mahjong 4 pemain lewat jaringan lokal. Satu orang menjalankan server di laptopnya, teman-teman membuka alamatnya dari browser HP atau laptop masing-masing. Ada ruang tunggu dengan kode ruangan 4 huruf; kursi yang kosong diisi bot.

## Yang dibutuhkan
- Node.js versi 18 atau lebih baru (https://nodejs.org), hanya di komputer yang jadi server.
- Semua pemain terhubung ke WiFi/jaringan yang sama.
- Pemain lain tidak perlu menginstal apa pun, cukup browser.

## Cara menjalankan
1. Ekstrak zip ini.
2. Buka terminal di folder hasil ekstrak, lalu jalankan:
   ```
   npm install
   npm start
   ```
   Di Windows bisa klik dua kali `start.bat`. Di Mac klik dua kali `start.command` (pertama kali: klik kanan > Open, lalu izinkan). Di Linux jalankan `./start.sh`.
   Catatan Mac: klik dua kali `start.sh` hanya membukanya di editor teks, jadi pakai `start.command` atau Terminal.
3. Terminal akan menampilkan alamat, misalnya `http://192.168.1.10:3000`. Bagikan alamat itu ke teman.
4. Satu orang menekan "Buat ruangan baru", lalu membagikan kode 4 huruf (atau tombol "Salin link"). Yang lain memasukkan kode di "Gabung ke ruangan".
5. Host menekan "Mulai permainan". Kursi kosong otomatis diisi bot (Mei, Raka, Sinta).

Ganti port kalau 3000 sudah terpakai: `PORT=4000 npm start` (Windows PowerShell: `$env:PORT=4000; npm start`).

## Kalau teman tidak bisa membuka alamatnya
- Pastikan semua perangkat di WiFi yang sama. WiFi tamu/hotspot kampus sering memblokir koneksi antar perangkat.
- Firewall komputer server harus mengizinkan Node.js menerima koneksi masuk (Windows biasanya menampilkan dialog saat pertama kali, pilih Allow).
- Coba buka alamatnya dari komputer server sendiri dulu (`http://localhost:3000`) untuk memastikan server jalan.

## Kode ruangan vs password
Kode ruangan 4 huruf acak sudah cukup untuk jaringan lokal: hanya orang di WiFi yang sama yang bisa mengakses server, dan kode acak mencegah salah masuk ruangan. Password tidak ditambahkan supaya alur gabung tetap satu langkah. Kalau server ini dipasang di internet publik, barulah password per ruangan layak dipertimbangkan.

## Fitur
- Ruang tunggu: nama pemain, kode ruangan, link undangan, pilihan 4/8/12 ronde dan panduan tampilan meja.
- Area tengah menampilkan hitungan per jenis ubin (berapa lembar sudah terlihat di meja dari buangan dan set terbuka, plus penanda ubin yang ada di tanganmu), bisa diganti ke tampilan buangan per pemain.
- Permainan di server (anti curang): klien hanya melihat tangannya sendiri. Tangan semua pemain dibuka di akhir ronde untuk dibandingkan.
- Tanpa batas waktu di semua tahap. Bar kuning "GILIRANMU" menandai giliranmu.
- Host memilih **Mode klaim** sebelum mulai: **Manual bebas**, **Manual terbantu** (default), atau **Fast**. Pengaturan dikunci selama pertandingan, termasuk main lagi; buat room baru untuk mengganti.
- **Manual bebas**: semua manusia yang terhubung menjawab sendiri. Server tidak menghitung opsi klaim manusia sebelum diminta dan tidak mengirim daftar Pung/Chow/Hu yang tersedia. Pilih dua ubin untuk mencoba Pung/Chow atau tiga untuk Kong; tombol Coba klaim hanya memeriksa jumlah pilihan, bukan susunannya. Coba Hu selalu tersedia. Server mengecek kepemilikan, keunikan ID, aturan kombinasi/posisi Chow dan bentuk Hu saat dikirim. Klaim salah ditolak tanpa mengubah ubin, saldo atau jawaban menunggu; pemain masih boleh mencoba lagi atau Lewat.
- **Manual terbantu**: semua manusia menjawab sendiri, tetapi pilihan klaim diperiksa terlebih dahulu. Tanpa pilihan sah, hanya Lewat tersedia; pemilihan ubin diberi label sah/tidak dan tombol Klaim hanya aktif jika sah.
- **Fast**: manusia tanpa pilihan sah dilewati otomatis; yang punya pilihan menjawab sendiri. Ini bisa memberi petunjuk bahwa pemain yang masih diminta menjawab mempunyai pilihan klaim.
- Semua mode tanpa batas waktu untuk manusia terhubung. Prioritas Hu → Pung/Kong → Chow, keputusan bot, jeda bot dan penanganan disconnect tetap. Permintaan klaim membawa ID jendela buangan; permintaan lama tidak bisa mengklaim buangan berikutnya.
- **Highlight set di tangan** juga toggle host di lobby, default ON. Kedua mode berlaku untuk seluruh room dan dikunci server sejak Mulai permainan, termasuk ronde berikutnya dan main lagi. Meja hanya menampilkan status mode; buat room baru untuk memilih mode lain.
- Untuk Pung/Kong/Chow, susun kombinasinya dengan mengetuk atau menyeret 2 ubin (3 untuk Kong) ke kotak klaim, lalu tekan Klaim.
- Jika highlight aktif: toska `C` menandai ubin pada Chow yang sudah lengkap di tangan; emas `P` menandai 3/4 ubin identik untuk Pung/Kong; ungu `C/P` menandai ubin yang bisa menjadi keduanya. Chow hanya dihitung pada angka berurutan dalam jenis yang sama; angin/naga tidak diberi tanda Chow.
- Warna hanya memakai ubin yang sudah ada di tangan sendiri. Dua ubin identik atau dua angka berurutan belum dianggap set lengkap; buangan lawan dan opsi klaim tidak memengaruhi warna. Warna tidak memilihkan ubin untuk klaim. Highlight nonaktif menghilangkan warna/badge/legenda bantuan set dari tangan dan contoh lobby.
- Warna menandai kemungkinan yang saling tumpang tindih, bukan pembagian set yang pasti. Semua salinan ubin yang sejenis diberi tanda yang sama karena masing-masing dapat dipakai; ubin yang sudah dipakai oleh satu set tidak dapat sekaligus dipakai set lain. Legenda dan label C/P membantu selain warna.
- Posisi duduk diacak setiap ronde, sehingga pemain di sebelah kiri (sumber Chow) selalu berganti. Dealer tetap bergilir antar pemain.
- Hanya host yang bisa memulai ronde berikutnya dan pertandingan baru; pemain lain melihat pesan menunggu host.
- Selain auto lewat dalam mode cepat, pemain yang koneksinya putus digantikan bot setelah beberapa detik supaya meja tidak tersandera, sampai ia kembali.
- Putus koneksi: kursi dimainkan bot sampai pemain kembali. Buka alamat yang sama di perangkat yang sama untuk otomatis kembali ke kursi.
- Panduan interaktif, contekan cepat, atur tangan manual, dan tombol Petunjuk (dihitung di sisi klien hanya dari informasi yang memang terlihat pemain).

## Fitur main bareng
- Obrolan meja dengan reaksi emoji; emoji muncul sebagai gelembung di kartu pemain yang mengirim.
- Notifikasi giliran: bunyi pendek dan judul tab berkedip saat giliranmu atau saat kotak klaim terbuka (bisa dimatikan lewat tombol Suara).
- Riwayat aksi yang bisa di-scroll per ronde di panel kanan.
- Animasi saat ubin diambil, dibuang, dan saat set diklaim, plus kilatan PUNG/CHOW/KONG/HU di tengah layar.
- Penonton: orang kelima (atau siapa pun yang masuk setelah permainan dimulai) ikut sebagai penonton, melihat meja dan obrolan tanpa melihat tangan pemain sampai ronde selesai.

## Fitur tambahan
- Tingkat bot (Mudah, Normal, Sulit): Mudah kadang asal membuang dan jarang klaim; Sulit menambah pertahanan, memilih ubin aman saat ada lawan yang sudah membuka 2 set atau dinding menipis.
- Batalkan buangan: 2 detik setelah membuang, selama belum ada pemain yang mengklaim ubin itu.
- Jadikan host: host bisa memindahkan perannya ke pemain lain dari ruang tunggu atau dari kartu pemain di meja.
- Layout dioptimalkan untuk laptop: ukuran ubin dihitung dari lebar papan (bukan layar), jadi tidak terpotong, dan papan hitung di tengah dibuat lebih besar.

## Aturan singkat
- 13 ubin per pemain, dealer (Timur) jalan duluan. Ambil 1, buang 1.
- Menang (Hu) dengan 4 set + 1 pasang, atau Tujuh Pasang.
- Pung/Kong dari buangan siapa saja; Chow hanya dari pemain di sebelah kiri.
- Prioritas klaim: Hu, lalu Pung/Kong, lalu Chow.
- Skor dalam fan, 1 fan = 10 poin per pembayar. Zimo: 3 lawan membayar. Dari buangan: pembuang membayar 3x.

## Struktur file
- `server.js`: server HTTP + WebSocket, ruang tunggu, dan jalannya permainan.
- `engine.js`: logika mahjong (dipakai server dan klien).
- `public/index.html`, `public/client.js`: tampilan di browser.
- `public/tiles.js`: gambar muka ubin tradisional (SVG).
- `public/hand-help.js`: warna set lengkap, hanya dari tangan sendiri.

## Patch 2026-10-14-six-games-1

Protokol Mahjong versi 6 mengharuskan browser dimuat ulang setelah pemasangan, agar klien lama tidak terus melakukan auto lewat saat host memilih manual. Server meminta reload secara ramah jika ada klien lama mencoba masuk; tidak menyuruh pemain menghentikan server.

Pemeriksaan sintaks dan authoring tampilan dilakukan di preview terpisah. Tidak menambah/menjalankan tes otomatis atau pertandingan multiplayer/bot penuh tanpa permintaan pengguna.

## Pengukuran poin dan sidebar

Creator **Hendy W**. Panel kanan konsisten: chat → cheat sheet visual → rekap poin/rupiah/CSV → log. Panduan mock meja dapat dibuka di lobby; Petunjuk tetap terlihat di bawah tangan.

Host memilih nilai 1 poin dalam rupiah di lobby; default 0 (latihan). Nilai dikunci sejak mulai. Fan tetap memakai logika sebelumnya: 1 fan = 10 poin per pembayar; zimo: tiga lawan membayar; Hu dari buangan: pembuang membayar 3×. Nilai rupiah = skor × rate, hasil setiap ronde dicatat dalam ledger. Main lagi memulai pertandingan baru dan mengosongkan skor/ledger pertandingan ini seperti sebelumnya; unduh rekap terlebih dahulu jika diperlukan.

Fast mode default OFF dan Highlight set lengkap default ON tetap dipilih hanya di lobby dan dikunci saat mulai. Seluruh tingkat bot Easy/Normal/Hard menunggu sekurangnya 3 detik untuk aksi bot. Protokol v6 membutuhkan refresh klien lama setelah pemasangan.

## Contekan pada sidebar — 2026-10-14-mahjong-cheat-layout-1

Contekan cepat menggunakan satu kolom sesuai lebar sidebar, dengan contoh ubin dan tiga bagian: Bentuk set, Mengambil buangan, Fan & poin. Aturan klaim memakai daftar agar nama pemain/keterangan dapat membungkus; tabel fan mempunyai kolom nilai tetap tanpa teks yang meluber. Panel memakai bingkai bersama, tanpa kartu bersarang. Posisi scroll contekan dipertahankan ketika sidebar digambar ulang. Aturan permainan tetap; lihat perubahan protokol v7 pada rilis UI di bawah.

Perubahan disiapkan pada source dan port preview terpisah. Tidak ada pemasangan otomatis ke host aktif.

## Rilis UI 2026-10-15-ui-polish-1

Protokol v7 memberi pesan saat kursi dipindahkan ke tab baru. Tab lama berhenti reconnect otomatis dan tidak menghapus credential tab baru. Muat ulang klien lama setelah deployment yang disetujui. Sidebar lobby dibersihkan saat masuk meja agar ID input tidak ganda; tangan membungkus ke beberapa baris pada layar sempit. Shutdown menghentikan ronde yang tertunda. Verifikasi komponen dan sesi: `npm run test:ui`; cakupan lengkap ada di docs/UI-QUALITY.md pada root hub.

## Sesi bersama pada hub

Hub build `2026-10-15-social-save-2` menambahkan save privat/pemulihan dijeda, nama bersama, kunci room, antrean penonton dan rotasi antar ronde, saldo akun yang tetap tercatat, panel lipat, serta suara/volume/pengurangan animasi. Lihat [panduan sesi](../../docs/SOCIAL-SESSIONS.md), termasuk migrasi pertama dari game RAM dan batas pemeriksaan. Keterangan RAM/restart pada riwayat build lama tidak berlaku sebagai jaminan perilaku build ini.

## Panduan dan panel (1.4.2)

Tombol **Lewati panduan** tersedia pada seluruh sepuluh langkah, tetap terlihat saat isi panduan digulir. Panduan dapat dibuka lagi dari tombol aturan. Contekan Mahjong memakai satu tombol Buka/Lipat di judul sidebar, tanpa kontrol detail kedua di dalamnya. Semua panel sidebar mengikuti kontrol bersama dan menyimpan pilihan lipat setelah tampilan diperbarui.

## Emoji dan mode klaim — 1.5.0 (protokol v9)

Emoji cepat 👍 😂 😭 🔥 😱 🙏 🀄 ☕ ada kembali di chat sidebar lobby maupun meja, termasuk penonton. Emoji memakai jalur chat server yang sama dengan penanda emoji sehingga bubble pemain tetap tampil; chat draft tidak dihapus oleh tombol emoji. Manual bebas tidak menampilkan saran klaim melalui Petunjuk; highlight set lengkap di tangan tetap merupakan pilihan lobby terpisah. Room lama dipulihkan dengan mode ekuivalen (autoPass true → Fast, false → Manual terbantu); mode baru tidak dipaksakan ke save lama. Muat ulang klien setelah pemasangan v9.

## Emote meja bersama (1.5.1)

Chat menyediakan 12 emote. Emote baru yang diterima server terlihat seluruh room sebagai efek transparan sekitar 3 detik, tanpa menutup klik kartu/papan. Kurangi animasi menampilkan emoji statis singkat. Riwayat dan reconnect tidak memutar efek lama. Lihat panduan root dan docs/GAME-CONVENTIONS.md untuk komponen bersama; alur aturan, kartu privat dan poin tidak berubah.

Chat biasa juga melayang transparan di pinggir meja (1.5.2), dengan nama pengirim dan maksimal tiga pesan singkat. Isi lengkap tetap di Chat meja. Riwayat lama dan pesan sistem tidak melayang; Kurangi animasi memakai pesan statis.

## Quick Play

Durasi lobby mencakup **Quick Play · 1 ronde**, 4, 8, atau 12 ronde. Quick Play terpisah dari Manual bebas/Manual terbantu/Fast; tidak mengubah auto-lewat. Sesi mencapai rekap final setelah satu ronde termasuk ronde seri.


## Santai — variasi meja 2.1.0

Santai menghilangkan minimum fan untuk bentuk Hu sah. Fan tetap ditampilkan dan menjadi ukuran poin. Pembayaran buangan untuk 0/1/2 fan adalah **4/8/16 poin**; Zimo dibayar setengah nilai tersebut oleh masing-masing tiga lawan. Mulai 3 fan tabel sama seperti HKMA. Ini perluasan lokal, bukan tabel resmi HKMA. Pao dan aturan pengganti bunga tetap berlaku. Joker/bonus bunga tetap opsi terpisah. Tujuh Pasang tetap hanya profil legacy.

Room tersimpan yang belum mempunyai settings.winMode dipulihkan sebagai **hkma**, sehingga deploy tidak menurunkan syarat Hu atau mengubah skor pertandingan lama. Room baru default casual; host hanya bisa mengganti sebelum mulai. Tidak mengubah saldo/hasil yang sudah diselesaikan. Klien v10 harus refresh ke v11. Validasi106tes sebelumnya mengacu2.0.1; perubahan Santai2.1.0 belum menjalani gameplay/tesotomatis baru.
