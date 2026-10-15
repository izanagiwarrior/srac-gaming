# Domino Gaple · Meja Kita

Game santai untuk 2–4 pemain. Aturan Gaple berbeda antar meja; versi ini memakai aturan berikut yang juga tersedia pada tombol **Cara main**.

- 28 batu unik double-six (0–0 sampai 6–6), 7 batu per pemain. Sisa batu menjadi stok tertutup untuk meja 2 atau 3 pemain.
- Balak tertinggi **yang sudah dibagikan** wajib menjadi batu pembuka setiap ronde. Jika tidak ada balak yang dibagikan, batu dengan total titik tertinggi membuka; seri dipecahkan menurut angka sisi terbesar. Saat 4 pemain, balak 6 selalu dibagikan dan menjadi pembuka.
- Giliran mengikuti urutan kursi. Sambungkan angka yang sama di kiri atau kanan; orientasi batu dibalik otomatis oleh server. Balak tidak menjadi cabang baru.
- Tidak punya batu cocok: ambil dari stok sampai ada yang cocok atau stok habis. Mengambil tidak mengakhiri giliran. Lewat hanya jika tidak ada batu cocok dan stok kosong.
- Habis batu menang. Semua pemain lewat berturut-turut berarti meja buntu: jumlah titik tersisa paling sedikit menang. Seri buntu menjadi kemenangan bersama.
- Rekap menghitung kemenangan ronde; setiap pemenang mendapat 1 kemenangan, termasuk seri. Nilai rupiah per poin dapat dipilih di lobby untuk rekap simulasi hasil. Ronde baru perlu persetujuan semua pemain manusia; bot otomatis setuju.
- Pilih jumlah kursi dan pengisian bot saat membuat room. Bot baru mengisi kursi kosong ketika host mulai, agar teman masih bisa masuk ke lobby.
- Bot menunggu **3 detik per aksi**, memilih dari batu sendiri berdasarkan jumlah titik; tidak membaca tangan lawan. Jika mengambil lalu memasang, masing-masing aksi memiliki jeda 3 detik.
- Koneksi manusia terputus menjeda permainan sampai kembali. Tombol **Keluar** menyerahkan kursi/batu kepada bot agar teman tetap bermain; orang yang keluar tidak bisa mengambil kembali kursinya pada ronde itu. Buat room baru untuk mengganti susunan pemain setelah permainan dimulai.
- Room penuh/berjalan menerima penonton (maksimal 16). Batu pemain tersembunyi sampai hasil ronde; server mengirim hanya tangan milik penerima dan rantai publik. Refresh browser dapat melanjutkan kursi melalui token sesi tab.

## Integrasi

- Factory `createDominoServer()` tidak membuka port sendiri. Hub menyediakan `/domino/` dan `/domino/ws` pada port yang sama dengan game lain.
- Server mengatur pengocokan, pembagian, legalitas sambungan, giliran, stok, dan hasil. Setiap aksi menyertakan match ID/revision untuk menolak aksi dari tampilan lama.
- Namespace browser `mejakita.domino.*` terpisah dari game lain. Room, log, chat, dan rekap berada di RAM; restart menghapus semuanya.
- Tanpa dependency aturan tambahan. Ubin dan ilustrasi dibuat sebagai SVG lokal.

Pemeriksaan sintaks dan pratinjau tampilan dilakukan pada patch terpisah. Tidak menambah atau menjalankan tes otomatis, pertandingan multiplayer, atau ronde bot penuh tanpa permintaan pengguna.

## Pengaturan meja dan rekap

Creator **Faiz T**. Panel kanan: chat → cheat sheet visual → rekap poin/rupiah/CSV → log. Tangan lawan tetap dibuka pada hasil ronde.

Default nilai poin 0, bot Normal. Host memilih rupiah per poin dan Easy/Normal/Hard sebelum mulai. Pilihan dikunci selama room ini, termasuk ronde berikutnya. Yang kalah kehilangan poin sebanyak titik di batu tersisa. Pemenang menerima total kehilangan lawan. Jika beberapa pemenang seri: dibagi rata, sisa 1 poin menurut urutan kursi. Total meja nol. Rekap poin dan kemenangan berlanjut antar ronde.

Easy memilih batu/ujung legal acak; Normal cenderung membuang titik besar; Hard juga mengutamakan balak dan kesinambungan angka dengan batu sendiri. Bot tidak membaca tangan lawan dan menunggu 3 detik.

## Titik dibanding jumlah batu

Pemain yang menghabiskan batu menang. Saat meja buntu, aturan meja ini membandingkan jumlah titik di batu tersisa, bukan jumlah batunya. Dua batu dengan total 4 titik dapat mengalahkan satu batu dengan 6 titik. Penghitungan titik lazim pada [Gaple](https://www.pagat.com/domino/line/gaple.html), tetapi Gaple memiliki variasi; pilihan pembuka, stok, seri bersama dan distribusi pool di hub ini adalah aturan meja yang dijelaskan di atas, bukan klaim bahwa semuanya satu aturan resmi universal.

## Sesi bersama pada hub

Hub build `2026-10-15-social-save-2` menambahkan save privat/pemulihan dijeda, nama bersama, kunci room, antrean penonton dan rotasi antar ronde, saldo akun yang tetap tercatat, panel lipat, serta suara/volume/pengurangan animasi. Lihat [panduan sesi](../../docs/SOCIAL-SESSIONS.md), termasuk migrasi pertama dari game RAM dan batas pemeriksaan. Keterangan RAM/restart pada riwayat build lama tidak berlaku sebagai jaminan perilaku build ini.
