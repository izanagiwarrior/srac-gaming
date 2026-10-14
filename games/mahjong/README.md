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
- Kotak klaim hanya muncul jika buangan memberi pilihan Hu, Pung, Kong, atau Chow yang sah. Jika tidak ada pilihan yang sah, pemain otomatis lewat. Untuk Pung/Kong/Chow, susun kombinasinya dengan mengetuk atau menyeret 2 ubin (3 untuk Kong) ke kotak klaim, lalu tekan Klaim.
- Posisi duduk diacak setiap ronde, sehingga pemain di sebelah kiri (sumber Chow) selalu berganti. Dealer tetap bergilir antar pemain.
- Hanya host yang bisa memulai ronde berikutnya dan pertandingan baru; pemain lain melihat pesan menunggu host.
- Satu-satunya otomatisasi: pemain yang koneksinya putus digantikan bot setelah beberapa detik supaya meja tidak tersandera, sampai ia kembali.
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
