# Catur Meja Kita

Modul game keempat di hub, tersedia pada `/catur/` dan WebSocket `/catur/ws`. Jalankan dari root repository menggunakan `npm start` (port default 3000).

## Bermain

1. Pilih **Main berdua** atau **Latihan bot**, isi nama, lalu buat room.
2. Bagikan link undangan kepada teman satu jaringan. Pembuat room memegang putih pada pertandingan pertama; pemain kedua memegang hitam.
3. Host menekan **Mulai permainan** saat kedua pemain terhubung. Klik bidak lalu petak tujuan; penanda petak hanya menunjukkan langkah yang sah.
4. Setelah selesai, kedua pemain menyetujui **Main lagi**. Warna ditukar pada pertandingan berikutnya.

Room yang penuh atau sedang bermain menerima penonton (maksimal 16). Link selalu menyertakan `/catur/`. Kursi disimpan menggunakan token pada sessionStorage browser; refresh atau koneksi terputus dapat melanjutkan kursi yang sama. Board dijeda ketika salah satu pemain offline. Keluar secara eksplisit saat bermain dianggap menyerah.

## Aturan dan batasan

- Putih bergerak lebih dulu. Validasi langkah di server menggunakan **chess.js 1.4.0**, lisensi BSD-2-Clause: [source dan dokumentasi](https://github.com/jhlywa/chess.js).
- Rokade, en passant, promosi empat pilihan, skak dan skakmat mengikuti library. Klien tidak dapat mengirim posisi papan atau memindahkan bidak di luar giliran.
- Aplikasi mengakhiri pertandingan otomatis saat stalemate, materi tidak cukup, posisi berulang tiga kali, atau 50 langkah tanpa gerakan pion/tangkapan. Mode Santai tanpa jam; Blitz memakai jam server. Tidak menerapkan prosedur klaim remis turnamen.
- Pemain dapat menawarkan remis, menerima/menolak tawaran, menyerah, memutar tampilan papan, mengobrol, dan mengunduh PGN.
- Bot latihan sederhana menunggu **3 detik**. Bot memilih langkah legal berdasarkan tangkapan, pengembangan, dan ancaman; bukan engine turnamen. Latihan bot memakai remis otomatis dan tidak menerima tawaran remis.
- Tidak ada undo atau petunjuk langkah terbaik pada catur. Penanda petak sah membantu memilih tujuan bidak.
- Room berada di RAM; restart server menghapus permainan catur. Room tanpa manusia tersambung dihapus setelah 60 menit.
- Perubahan fitur ini disiapkan terpisah dari host aktif. Tes otomatis dan pertandingan multiplayer tidak dijalankan tanpa permintaan pengguna.

## Pengaturan meja dan rekap

Creator **Faiz T**. Panel kanan mengikuti chat → cheat sheet bidak → rekap poin/rupiah/CSV → log langkah, serta pengaturan host di lobby. Unduhan PGN dan bidak yang tertangkap tetap tersedia.

Default nilai poin 0, bot Normal. Host memilih rupiah per poin dan Easy/Normal/Hard sebelum mulai; pilihan dikunci termasuk saat main lagi. Menang +1 poin, kalah −1, remis 0. Menyerah atau keluar dari pertandingan berjalan dihitung kalah. Rekap berlanjut saat main lagi dan mencatat setiap hasil sekali. Rupiah = poin × nilai lobby; total dua pemain nol, termasuk simulasi bot.

Easy memilih langkah legal acak. Normal menimbang tangkapan, pengembangan dan ancaman. Hard juga mempertimbangkan tanggapan lawan satu langkah berikutnya dengan nilai material. Semua menunggu 3 detik.

## Sesi bersama pada hub

Hub build `2026-10-15-social-save-2` menambahkan save privat/pemulihan dijeda, nama bersama, kunci room, antrean penonton dan rotasi antar ronde, saldo akun yang tetap tercatat, panel lipat, serta suara/volume/pengurangan animasi. Lihat [panduan sesi](../../docs/SOCIAL-SESSIONS.md), termasuk migrasi pertama dari game RAM dan batas pemeriksaan. Keterangan RAM/restart pada riwayat build lama tidak berlaku sebagai jaminan perilaku build ini.

## Emote meja bersama (1.5.1)

Chat menyediakan 12 emote. Emote baru yang diterima server terlihat seluruh room sebagai efek transparan sekitar 3 detik, tanpa menutup klik kartu/papan. Kurangi animasi menampilkan emoji statis singkat. Riwayat dan reconnect tidak memutar efek lama. Lihat panduan root dan docs/GAME-CONVENTIONS.md untuk komponen bersama; alur aturan, kartu privat dan poin tidak berubah.

Chat biasa juga melayang transparan di pinggir meja (1.5.2), dengan nama pengirim dan maksimal tiga pesan singkat. Isi lengkap tetap di Chat meja. Riwayat lama dan pesan sistem tidak melayang; Kurangi animasi memakai pesan statis.

## Quick Play

Lobby menyediakan Santai tanpa jam, **Blitz 5+0** (5 menit per pemain), dan **Blitz 3+2** (3 menit + 2 detik setiap langkah sah). Jam ditentukan server, input ilegal tidak menghentikannya. Jam dijeda saat pemain terputus atau sesi sedang recovery dan dilanjutkan saat siap. Save menyimpan sisa waktu, bukan process timer; downtime tidak dihitung. Waktu habis mengakhiri pertandingan sekali dengan poin normal. Lawan yang hanya memiliki raja / posisi insufficient-material dinyatakan remis. Ini aturan meja santai; belum mencakup seluruh adjudikasi posisi mati turnamen. Bot tetap menunggu minimal 3 detik dan memakai jamnya sendiri.
