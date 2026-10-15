# Blackjack · Meja Kita

Creator **Faiz T**. Halaman /blackjack/, WebSocket /blackjack/ws, satu proses dan port dengan lima game lain.

## Meja dan aturan

- 1–7 pemain bersama melawan dealer otomatis; jumlah bot opsional dipilih host di lobby. Pemain yang masuk setelah mulai/room penuh menjadi penonton.
- Enam deck, diacak ulang dengan randomInt kriptografis setiap ronde. Pemain mendapatkan dua kartu; dealer satu terbuka/satu tertutup, mengecek blackjack sebelum giliran pemain.
- As = 1/11; J/Q/K = 10. Hit mengambil satu kartu; Stand berhenti. Bust langsung kalah.
- Double pada dua kartu pertama termasuk setelah split, jika stack cukup: tambah taruhan setara, ambil satu kartu, lalu berhenti.
- Split pair dengan rank sama sekali menjadi dua tangan, jika stack cukup. Split As hanya mendapat satu tambahan per tangan; tidak dapat resplit.
- Dealer mengambil sampai 17 lalu stand, termasuk soft 17. Blackjack dua kartu asli membayar profit 3:2; kemenangan biasa profit 1:1; push kembali. 21 setelah split bukan natural. Tidak memakai insurance/surrender. Ini pilihan aturan meja; [rujukan dasar Bicycle](https://bicyclecards.com/how-to-play/blackjack/).

## Chip dan nilai rupiah

Host memilih chip per buy-in (default 1.000), minimum (10), nilai satu chip dalam IDR (default 0), kursi (4), bot (1), kesulitan (Normal). Semua pilihan dikunci sejak mulai. Buy-in/minimum/taruhan harus genap supaya payout 3:2 tetap chip bulat.

Pemain memasang chip saat tahap betting, kemudian seluruh meja mendapat kartu. Taruhan yang sudah dikunci tidak dapat diubah. Chip ditahan saat dibagikan; net sementara memasukkan chip dalam tangan yang belum selesai. Hasil final = stack − seluruh bought chips; rupiah = net × rate. Saldo dealer menjadi kebalikan total hasil pemain. Hasil tiap ronde dicatat sekali pada ledger/CSV. Semua ini chip permainan dan pengukuran hasil, tanpa integrasi pembayaran.

Rebuy sendiri tersedia di antara ronde, menambah stack dan bought chips bersama agar tidak menciptakan net palsu. Bot kehabisan chip menerima rebuy latihan sebelum ronde berikutnya. Host memulai ronde berikutnya. Batas recorded buy-in per kursi 1 miliar chip.

## Bot, koneksi, dan antarmuka

Easy terkadang mengambil keputusan acak kurang baik; Normal memakai jumlah kartu dan upcard dealer; Hard juga memilih double dan split tertentu. Seluruh bot menunggu 3 detik. Bot membaca tangan sendiri dan upcard, tidak membaca hole card dealer. Dealer tidak mengikuti pilihan kesulitan: aturan stand 17 tetap.

Tidak ada timer manusia terhubung. Pemain offline otomatis stand setelah 15 detik, atau memasang minimum jika belum memilih chip. Kembali dengan browser/token yang sama mengembalikan kursi. Tombol Keluar saat ronde berjalan menyerahkan kursi kepada bot; di lobby menghapus kursi. Penonton tidak dapat mengubah chip/kartu.

Panel kanan: chat, cheat sheet visual, rekap chip/rupiah/CSV, log, pengaturan meja. Pada layar kecil tersusun di bawah. Room, shoe, dan ledger berada di RAM; restart menghapusnya.

## Pemeriksaan patch

Sintaks dan authoring halaman masuk/lobby ditinjau pada port terpisah, tanpa memulai ronde atau memasang chip. Tidak menjalankan tes otomatis atau pertandingan. Belum diverifikasi lewat ronde multiplayer, split/double, payout nyata dalam permainan, dan pemulihan koneksi saat ronde berjalan.

## Sesi bersama pada hub

Hub build `2026-10-15-social-save-2` menambahkan save privat/pemulihan dijeda, nama bersama, kunci room, antrean penonton dan rotasi antar ronde, saldo akun yang tetap tercatat, panel lipat, serta suara/volume/pengurangan animasi. Lihat [panduan sesi](../../docs/SOCIAL-SESSIONS.md), termasuk migrasi pertama dari game RAM dan batas pemeriksaan. Keterangan RAM/restart pada riwayat build lama tidak berlaku sebagai jaminan perilaku build ini.

## Emote meja bersama (1.5.1)

Chat menyediakan 12 emote. Emote baru yang diterima server terlihat seluruh room sebagai efek transparan sekitar 3 detik, tanpa menutup klik kartu/papan. Kurangi animasi menampilkan emoji statis singkat. Riwayat dan reconnect tidak memutar efek lama. Lihat panduan root dan docs/GAME-CONVENTIONS.md untuk komponen bersama; alur aturan, kartu privat dan poin tidak berubah.

Chat biasa juga melayang transparan di pinggir meja (1.5.2), dengan nama pengirim dan maksimal tiga pesan singkat. Isi lengkap tetap di Chat meja. Riwayat lama dan pesan sistem tidak melayang; Kurangi animasi memakai pesan statis.
